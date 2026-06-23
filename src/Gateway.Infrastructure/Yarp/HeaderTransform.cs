using Gateway.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Yarp.ReverseProxy.Transforms;

namespace Gateway.Infrastructure.Yarp;

/// <summary>
/// YARP transform for handling header manipulation
/// - Forwards all original request headers to downstream
/// - Adds custom headers defined in endpoint policy
/// - Removes headers specified in endpoint policy
/// - Adds gateway-specific headers (correlation ID, client info)
/// </summary>
public class HeaderTransform : RequestTransform
{
    private readonly IPolicyResolver _policyResolver;
    private readonly ILogger<HeaderTransform> _logger;

    // Headers that should never be forwarded to downstream
    private static readonly HashSet<string> RestrictedHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Host",           // Will be set by YARP to the destination host
        "Connection",     // Managed by HTTP client
        "Transfer-Encoding",
        "Keep-Alive",
        "Upgrade",
        "Proxy-Authorization",
        "Proxy-Connection"
    };

    public HeaderTransform(
        IPolicyResolver policyResolver,
        ILogger<HeaderTransform> logger)
    {
        _policyResolver = policyResolver;
        _logger = logger;
    }

    public override async ValueTask ApplyAsync(RequestTransformContext context)
    {
        var request = context.HttpContext.Request;
        var path = request.Path.Value ?? "";
        var method = request.Method;

        _logger.LogDebug("HeaderTransform - Processing headers for {Method} {Path}", method, path);

        // Resolve policy to get header configuration
        var policy = await _policyResolver.ResolvePolicyAsync(path, method);
        
        _logger.LogDebug("Forwarding {Count} headers for {Method} {Path}", request.Headers.Count, method, path);
        
        foreach (var header in request.Headers)
        {
            if (!RestrictedHeaders.Contains(header.Key))
            {
                _logger.LogDebug("Forwarding header: {Key} = {Value}", header.Key, 
                    header.Key.Equals("Authorization", StringComparison.OrdinalIgnoreCase) 
                        ? "[REDACTED]" 
                        : header.Value.ToString());
            }
        }

        var correlationId = context.HttpContext.TraceIdentifier;
        context.ProxyRequest.Headers.TryAddWithoutValidation("X-Correlation-Id", correlationId);
        context.ProxyRequest.Headers.TryAddWithoutValidation("X-Gateway-Request-Id", Guid.NewGuid().ToString());
        context.ProxyRequest.Headers.TryAddWithoutValidation("X-Gateway-Timestamp", DateTime.UtcNow.ToString("o"));

        var clientId = context.HttpContext.User.FindFirst("sub")?.Value
                    ?? context.HttpContext.User.FindFirst("client_id")?.Value;
        if (!string.IsNullOrEmpty(clientId))
        {
            context.ProxyRequest.Headers.TryAddWithoutValidation("X-Client-Id", clientId);
        }

        if (policy != null)
        {
            foreach (var header in policy.HeadersToAdd)
            {
                var value = ResolveHeaderValue(header.Value, context.HttpContext);
                context.ProxyRequest.Headers.TryAddWithoutValidation(header.Key, value);
            }

            foreach (var headerName in policy.HeadersToRemove)
            {
                context.ProxyRequest.Headers.Remove(headerName);
            }
        }

        _logger.LogDebug("Header transform complete for {CorrelationId}", correlationId);
    }

    /// <summary>
    /// Resolves dynamic header values with placeholders
    /// Supported placeholders:
    /// - {ClientId} - The client ID from JWT
    /// - {CorrelationId} - The request correlation ID
    /// - {Timestamp} - Current UTC timestamp
    /// - {UserId} - The user ID from JWT (sub claim)
    /// </summary>
    private string ResolveHeaderValue(string template, HttpContext context)
    {
        if (string.IsNullOrEmpty(template) || !template.Contains('{'))
        {
            return template;
        }

        var result = template;
        
        // Replace known placeholders
        result = result.Replace("{ClientId}", 
            context.User.FindFirst("client_id")?.Value ?? "unknown");
        result = result.Replace("{UserId}", 
            context.User.FindFirst("sub")?.Value ?? "unknown");
        result = result.Replace("{CorrelationId}", 
            context.TraceIdentifier);
        result = result.Replace("{Timestamp}", 
            DateTime.UtcNow.ToString("o"));

        return result;
    }
}
