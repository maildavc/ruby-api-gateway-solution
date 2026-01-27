using Gateway.Core.Models;

namespace Gateway.Infrastructure.Caching;

/// <summary>
/// High-performance cache for endpoint policies and permissions
/// Uses ValKey (Redis-compatible) + in-memory cache for ultra-low latency
/// </summary>
public interface IPolicyCache
{
    Task<EndpointPolicy?> GetPolicyAsync(string routeKey);
    Task SetPolicyAsync(string routeKey, EndpointPolicy policy, TimeSpan ttl);
    Task<HashSet<int>?> GetClientPermissionsAsync(int clientId);
    Task SetClientPermissionsAsync(int clientId, HashSet<int> endpointIds, TimeSpan ttl);
    Task InvalidateAsync(string key);
    Task InvalidateAllAsync();
}
