using System.Diagnostics;
using Gateway.Core.Models;
using Gateway.Data.Repositories;
using Gateway.Infrastructure.Caching;
using Gateway.Infrastructure.Events;
using Gateway.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Gateway.Infrastructure.Middleware;

/// <summary>
/// Middleware for endpoint authorization and request tracking
/// Validates client permissions before proxying
/// Emits Kafka events when configured
/// </summary>
public class GatewayAuthorizationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GatewayAuthorizationMiddleware> _logger;

    public GatewayAuthorizationMiddleware(
        RequestDelegate next,
        ILogger<GatewayAuthorizationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext context,
        IPolicyResolver policyResolver,
        IClientRepository clientRepo,
        IClientPermissionRepository permissionRepo,
        IPolicyCache cache,
        IEventProducer eventProducer)
    {
        var stopwatch = Stopwatch.StartNew();
        var correlationId = context.TraceIdentifier;
        
        // Add correlation ID to response headers
        context.Response.Headers["X-Correlation-Id"] = correlationId;

        try
        {
            var path = context.Request.Path.Value ?? "";
            var method = context.Request.Method;

            if (path.StartsWith("/health", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Resolve policy
            var policy = await policyResolver.ResolvePolicyAsync(path, method);
            if (policy == null)
            {
                _logger.LogWarning("No policy found for {Method} {Path}", method, path);
                context.Response.StatusCode = 404;
                await context.Response.WriteAsync("Endpoint not found or disabled");
                return;
            }

            // Store policy in context for downstream middleware
            context.Items["EndpointPolicy"] = policy;

            // Check if JWT is required
            if (policy.RequiresJwt && !context.User.Identity?.IsAuthenticated == true)
            {
                _logger.LogWarning("Unauthorized access attempt to {Path}", path);
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Unauthorized");
                return;
            }

            // Get client ID from JWT
            var clientId = context.User.FindFirst("sub")?.Value 
                          ?? context.User.FindFirst("client_id")?.Value;

            if (string.IsNullOrEmpty(clientId) && policy.RequiresJwt)
            {
                _logger.LogWarning("No client ID in JWT for {Path}", path);
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Invalid token");
                return;
            }

            // Verify client permissions
            if (!string.IsNullOrEmpty(clientId))
            {
                var client = await cache.GetClientAsync(clientId);
                if (client == null)
                {
                    client = await clientRepo.GetByClientIdAsync(clientId);
                    if (client != null)
                    {
                        await cache.SetClientAsync(clientId, client, TimeSpan.FromHours(1));
                    }
                }
                if (client == null)
                {
                    _logger.LogWarning("Client {ClientId} not found", clientId);
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsync("Client not found");
                    return;
                }

                // Check permissions (with caching)
                var permissions = await cache.GetClientPermissionsAsync(client.Id);
                if (permissions == null)
                {
                    var endpointIds = await permissionRepo.GetAuthorizedEndpointIdsAsync(client.Id);
                    permissions = new HashSet<Guid>(endpointIds);
                    await cache.SetClientPermissionsAsync(client.Id, permissions, TimeSpan.FromHours(1));
                }

                if (!permissions.Contains(policy.Endpoint.Id))
                {
                    _logger.LogWarning("Client {ClientId} not authorized for endpoint {EndpointId}", 
                        clientId, policy.Endpoint.Id);
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsync("Access denied to this endpoint");
                    return;
                }

                // Update last access (fire and forget)
                _ = clientRepo.UpdateLastAccessAsync(client.Id);
            }

            // Proceed to next middleware (YARP proxy)
            await _next(context);

            // Emit event if configured
            if (policy.EmitEvents && !string.IsNullOrEmpty(clientId))
            {
                stopwatch.Stop();
                var gatewayEvent = new GatewayEvent
                {
                    CorrelationId = correlationId,
                    ProductName = policy.Product.Name,
                    ServiceName = policy.Service.ServiceName,
                    EndpointName = policy.Endpoint.EndpointName,
                    ClientId = clientId,
                    Method = method,
                    Path = path,
                    UpstreamStatusCode = context.Response.StatusCode,
                    LatencyMs = stopwatch.ElapsedMilliseconds,
                    Timestamp = DateTime.UtcNow
                };

                var topic = $"{policy.TopicPrefix}.events";
                _ = eventProducer.PublishAsync(gatewayEvent, topic);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in gateway authorization middleware");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsync("Internal server error");
        }
    }
}
