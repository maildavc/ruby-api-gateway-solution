using Gateway.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Yarp.ReverseProxy.Configuration;
using Yarp.ReverseProxy.Forwarder;

namespace Gateway.Infrastructure.Yarp;

/// <summary>
/// Dynamic YARP configuration provider that reads routes from database via PolicyResolver
/// Supports load balancing, session affinity, circuit breaker, retry policies, and health checks
/// </summary>
public class DatabaseProxyConfigProvider : IProxyConfigProvider
{
    private const string GatewayPathPrefix = "/gateway";
    private readonly PolicyResolver _policyResolver;
    private readonly ILogger<DatabaseProxyConfigProvider> _logger;
    private readonly bool _dangerousAcceptAnyCert;
    private volatile DatabaseProxyConfig _config;

    public DatabaseProxyConfigProvider(
        PolicyResolver policyResolver,
        IConfiguration configuration,
        ILogger<DatabaseProxyConfigProvider> logger)
    {
        _policyResolver = policyResolver;
        _logger = logger;
        _dangerousAcceptAnyCert = configuration.GetValue<bool>("Gateway:DangerousAcceptAnyServerCertificate", false);
        _config = new DatabaseProxyConfig(Array.Empty<RouteConfig>(), Array.Empty<ClusterConfig>());

        // Run the async init on a threadpool thread to avoid sync-over-async deadlock.
        // The StartupCacheWarmupService will also call RefreshConfigAsync after the host is built.
        Task.Run(RefreshConfigAsync).GetAwaiter().GetResult();
    }

    public IProxyConfig GetConfig()
    {
        _logger.LogDebug("YARP GetConfig called. Routes: {RouteCount}", _config.Routes.Count);
        return _config;
    }

    public async Task RefreshConfigAsync()
    {
        try
        {
            _logger.LogInformation("Refreshing YARP configuration from database...");
            
            // Trigger policy refresh to load latest from database
            await _policyResolver.RefreshPoliciesAsync();
            
            // Get all policies
            var policies = _policyResolver.GetAllPolicies();
            
            var routes = new Dictionary<string, RouteConfig>(); // Use dict to deduplicate by routeId
            var clusters = new Dictionary<string, ClusterConfig>();

            foreach (var kvp in policies)
            {
                var policy = kvp.Value;
                var service = policy.Service;
                var endpoint = policy.Endpoint;

                // Create route - use dict to avoid duplicates (policies have one entry per HTTP method)
                var routeId = $"{service.ServiceName}-{endpoint.EndpointName}";
                
                // Skip if we already added this route
                if (routes.ContainsKey(routeId))
                {
                    _logger.LogDebug("Skipping duplicate route: {RouteId}", routeId);
                    continue;
                }
                
                var routePath = $"{GatewayPathPrefix}{service.BasePath}{endpoint.RelativePath}";
                
                _logger.LogInformation("Adding YARP route: {RouteId} - Path: {Path}, Method: {Method}, Cluster: {Cluster}",
                    routeId, routePath, endpoint.HttpMethod, service.ClusterId);
                
                var route = new RouteConfig
                {
                    RouteId = routeId,
                    ClusterId = service.ClusterId,
                    Match = new RouteMatch
                    {
                        Path = routePath,
                        Methods = endpoint.HttpMethod.Split(',').Select(m => m.Trim()).ToList()
                    },
                    Transforms = new List<IReadOnlyDictionary<string, string>>
                    {
                        // Transform the path to upstream
                        new Dictionary<string, string>
                        {
                            ["PathPattern"] = endpoint.UpstreamPathTemplate ?? endpoint.RelativePath
                        },
                        // Copy all request headers to downstream (default behavior, but explicit)
                        new Dictionary<string, string>
                        {
                            ["RequestHeadersCopy"] = "true"
                        },
                        // Use the upstream host header (required for Azure App Gateway routing)
                        new Dictionary<string, string>
                        {
                            ["RequestHeaderOriginalHost"] = "false"
                        },
                        // Add X-Forwarded headers for downstream services
                        new Dictionary<string, string>
                        {
                            ["X-Forwarded"] = "Set"
                        },
                        // Copy response headers back to client
                        new Dictionary<string, string>
                        {
                            ["ResponseHeadersCopy"] = "true"
                        }
                    },
                    Metadata = new Dictionary<string, string>
                    {
                        ["EndpointId"] = endpoint.Id.ToString(),
                        ["ServiceId"] = service.Id.ToString(),
                        ["RequiresJwt"] = service.RequiresJwt.ToString()
                    }
                };

                routes[routeId] = route;

                // Create cluster if not exists
                if (!clusters.ContainsKey(service.ClusterId))
                {
                    clusters[service.ClusterId] = BuildClusterConfig(service);
                }
            }

            var newConfig = new DatabaseProxyConfig(routes.Values.ToList(), clusters.Values.ToList());
            _config = newConfig;
            
            _logger.LogInformation(
                "YARP configuration refreshed. Routes: {RouteCount}, Clusters: {ClusterCount}",
                routes.Count,
                clusters.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh YARP configuration");
        }
    }

    /// <summary>
    /// Build cluster configuration with load balancing, session affinity, health checks, and resilience settings
    /// </summary>
    private ClusterConfig BuildClusterConfig(Gateway.Core.Entities.Service service)
    {
        // Parse destinations from JSON
        var destinations = System.Text.Json.JsonSerializer.Deserialize<string[]>(service.Destinations);
        var destDict = new Dictionary<string, DestinationConfig>();
        
        for (int i = 0; i < (destinations?.Length ?? 0); i++)
        {
            destDict[$"destination{i}"] = new DestinationConfig
            {
                Address = destinations![i]
            };
        }

        _logger.LogInformation(
            "Building cluster {ClusterId}: LB={LoadBalancing}, Destinations={DestCount}, SessionAffinity={SessionAffinity}, CircuitBreaker={CircuitBreaker}, Retry={Retry}",
            service.ClusterId,
            service.LoadBalancingPolicy,
            destDict.Count,
            service.SessionAffinityEnabled,
            service.CircuitBreakerEnabled,
            service.RetryEnabled);

        // Build session affinity config
        SessionAffinityConfig? sessionAffinity = null;
        if (service.SessionAffinityEnabled)
        {
            sessionAffinity = new SessionAffinityConfig
            {
                Enabled = true,
                Policy = "Cookie", // Cookie-based sticky sessions
                AffinityKeyName = service.SessionAffinityCookieName,
                Cookie = new SessionAffinityCookieConfig
                {
                    MaxAge = TimeSpan.FromSeconds(service.SessionAffinityTtlSeconds),
                    HttpOnly = true,
                    SecurePolicy = Microsoft.AspNetCore.Http.CookieSecurePolicy.SameAsRequest,
                    SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax
                }
            };
            _logger.LogDebug("Session affinity enabled for {ClusterId}: Cookie={Cookie}, TTL={TTL}s",
                service.ClusterId, service.SessionAffinityCookieName, service.SessionAffinityTtlSeconds);
        }

        // Build health check config
        HealthCheckConfig? healthCheck = null;
        if (service.HealthCheckEnabled || service.PassiveHealthCheckEnabled)
        {
            healthCheck = new HealthCheckConfig
            {
                Active = service.HealthCheckEnabled ? new ActiveHealthCheckConfig
                {
                    Enabled = true,
                    Interval = TimeSpan.FromSeconds(service.HealthCheckIntervalSeconds),
                    Path = service.HealthCheckPath,
                    Timeout = TimeSpan.FromSeconds(10)
                } : null,
                Passive = service.PassiveHealthCheckEnabled ? new PassiveHealthCheckConfig
                {
                    Enabled = true,
                    Policy = "TransportFailureRate",
                    ReactivationPeriod = TimeSpan.FromSeconds(service.PassiveHealthReactivationSeconds)
                } : null
            };
            _logger.LogDebug("Health checks for {ClusterId}: Active={Active}, Passive={Passive}",
                service.ClusterId, service.HealthCheckEnabled, service.PassiveHealthCheckEnabled);
        }

        // Build HTTP client config with timeouts
        var httpClient = new HttpClientConfig
        {
            RequestHeaderEncoding = "utf-8",
            DangerousAcceptAnyServerCertificate = _dangerousAcceptAnyCert
        };

        // Build HTTP request config with timeout
        var httpRequest = new ForwarderRequestConfig
        {
            ActivityTimeout = TimeSpan.FromSeconds(service.RequestTimeoutSeconds)
        };

        // Build cluster metadata for custom features
        var metadata = new Dictionary<string, string>
        {
            ["ServiceId"] = service.Id.ToString(),
            ["ServiceName"] = service.ServiceName,
            ["CircuitBreakerEnabled"] = service.CircuitBreakerEnabled.ToString(),
            ["CircuitBreakerThreshold"] = service.CircuitBreakerThreshold.ToString(),
            ["CircuitBreakerDurationSeconds"] = service.CircuitBreakerDurationSeconds.ToString(),
            ["RetryEnabled"] = service.RetryEnabled.ToString(),
            ["RetryCount"] = service.RetryCount.ToString(),
            ["RetryDelayMs"] = service.RetryDelayMs.ToString()
        };

        return new ClusterConfig
        {
            ClusterId = service.ClusterId,
            Destinations = destDict,
            LoadBalancingPolicy = service.LoadBalancingPolicy.ToString(),
            SessionAffinity = sessionAffinity,
            HealthCheck = healthCheck,
            HttpClient = httpClient,
            HttpRequest = httpRequest,
            Metadata = metadata
        };
    }

    private class DatabaseProxyConfig : IProxyConfig
    {
        private readonly CancellationTokenSource _cts = new();

        public DatabaseProxyConfig(IReadOnlyList<RouteConfig> routes, IReadOnlyList<ClusterConfig> clusters)
        {
            Routes = routes;
            Clusters = clusters;
            ChangeToken = new CancellationChangeToken(_cts.Token);
        }

        public IReadOnlyList<RouteConfig> Routes { get; }
        public IReadOnlyList<ClusterConfig> Clusters { get; }
        public IChangeToken ChangeToken { get; }
    }
}
