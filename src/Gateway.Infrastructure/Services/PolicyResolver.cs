using System.Collections.Concurrent;
using System.Text.Json;
using Gateway.Core.Entities;
using Gateway.Core.Enums;
using Gateway.Core.Models;
using Gateway.Data.Repositories;
using Gateway.Infrastructure.Caching;
using Microsoft.Extensions.Logging;

namespace Gateway.Infrastructure.Services;

/// <summary>
/// Resolves endpoint policies with minimal latency
/// Uses immutable snapshots for thread-safe access
/// </summary>
public class PolicyResolver : IPolicyResolver
{
    private const string GatewayPathPrefix = "/gateway";
    private readonly IServiceRepository _serviceRepo;
    private readonly IEndpointRepository _endpointRepo;
    private readonly IProductRepository _productRepo;
    private readonly IPolicyCache _cache;
    private readonly ILogger<PolicyResolver> _logger;

    // Immutable snapshot for fast lookups (no locks in hot path)
    private volatile ConcurrentDictionary<string, EndpointPolicy> _policySnapshot = new();

    public PolicyResolver(
        IServiceRepository serviceRepo,
        IEndpointRepository endpointRepo,
        IProductRepository productRepo,
        IPolicyCache cache,
        ILogger<PolicyResolver> logger)
    {
        _serviceRepo = serviceRepo;
        _endpointRepo = endpointRepo;
        _productRepo = productRepo;
        _cache = cache;
        _logger = logger;
    }

    public async Task<EndpointPolicy?> ResolvePolicyAsync(string path, string method)
    {
        var routeKey = RouteKey.FromRequest(path, method).ToKey();

        // Try cache first
        var cached = await _cache.GetPolicyAsync(routeKey);
        if (cached != null)
        {
            return cached;
        }

        // Try snapshot
        if (_policySnapshot.TryGetValue(routeKey, out var snapshotPolicy))
        {
            // Cache it for next time
            await _cache.SetPolicyAsync(routeKey, snapshotPolicy, TimeSpan.FromHours(1));
            return snapshotPolicy;
        }

        // Not found - may need refresh
        _logger.LogWarning("Policy not found for route {RouteKey}, triggering refresh", routeKey);
        return null;
    }

    public IDictionary<string, EndpointPolicy> GetAllPolicies()
    {
        return _policySnapshot;
    }

    public async Task RefreshPoliciesAsync()
    {
        _logger.LogInformation("Starting policy refresh...");
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            // Load all enabled services and endpoints
            var services = (await _serviceRepo.GetAllAsync(enabledOnly: true)).ToList();
            var products = (await _productRepo.GetAllAsync(enabledOnly: true)).ToList();
            var productDict = products.ToDictionary(p => p.Id);

            var newSnapshot = new ConcurrentDictionary<string, EndpointPolicy>();

            foreach (var service in services)
            {
                if (!productDict.TryGetValue(service.ProductId, out var product))
                {
                    continue;
                }

                var endpoints = await _endpointRepo.GetByServiceIdAsync(service.Id, enabledOnly: true);

                foreach (var endpoint in endpoints)
                {
                    var policy = BuildEndpointPolicy(product, service, endpoint);
                    
                    // Register all HTTP methods for this endpoint
                    var methods = endpoint.HttpMethod.Split(',', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var method in methods)
                    {
                        var fullPath = $"{GatewayPathPrefix}{service.BasePath}{endpoint.RelativePath}";
                        var routeKey = $"{method.Trim().ToUpperInvariant()}:{fullPath}";
                        
                        newSnapshot[routeKey] = policy;
                        
                        // Also cache in Redis
                        await _cache.SetPolicyAsync(routeKey, policy, TimeSpan.FromHours(1));
                    }
                }
            }

            // Atomic swap
            _policySnapshot = newSnapshot;

            stopwatch.Stop();
            _logger.LogInformation(
                "Policy refresh completed. Loaded {Count} routes in {ElapsedMs}ms",
                newSnapshot.Count,
                stopwatch.ElapsedMilliseconds
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh policies");
        }
    }

    private EndpointPolicy BuildEndpointPolicy(Product product, Service service, Endpoint endpoint)
    {
        // Resolve effective crypto config (endpoint override -> service default)
        var cryptoAlgorithm = endpoint.CryptoAlgorithm ?? service.DefaultCryptoAlgorithm;
        var keySource = endpoint.KeySource ?? service.DefaultKeySource;
        var ivSource = endpoint.IvSource ?? service.DefaultIvSource;
        var encoding = endpoint.Encoding ?? service.DefaultEncoding;
        var requireIv = endpoint.RequireIv ?? service.DefaultRequireIv;

        var cryptoConfig = new CryptoConfig
        {
            Algorithm = cryptoAlgorithm,
            KeySource = keySource,
            IvSource = ivSource,
            Encoding = encoding,
            RequireIv = requireIv
        };

        // Parse JSON fields
        var requiredScopes = ParseJsonArray(service.RequiredScopes);
        var allowedClients = ParseJsonArray(service.AllowedClients);
        var headersToAdd = ParseJsonObject(endpoint.HeadersToAdd);
        var headersToRemove = ParseJsonArray(endpoint.HeadersToRemove);

        return new EndpointPolicy
        {
            Product = product,
            Service = service,
            Endpoint = endpoint,
            CryptoConfig = cryptoConfig,
            PayloadExpectation = endpoint.PayloadExpectation,
            TimeoutMs = endpoint.TimeoutMs,
            MaxRetries = endpoint.MaxRetries,
            RequiresJwt = service.RequiresJwt,
            RequiredScopes = requiredScopes,
            AllowedClients = allowedClients,
            HeadersToAdd = headersToAdd,
            HeadersToRemove = headersToRemove,
            EmitEvents = service.EmitEvents,
            TopicPrefix = service.TopicPrefix,
            EncryptRequest = endpoint.EncryptRequest,
            EncryptResponse = endpoint.EncryptResponse
        };
    }

    private List<string> ParseJsonArray(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private Dictionary<string, string> ParseJsonObject(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new Dictionary<string, string>();
        }

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }
}
