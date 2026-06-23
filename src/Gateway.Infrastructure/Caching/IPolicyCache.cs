using Gateway.Core.Entities;
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
    Task<HashSet<Guid>?> GetClientPermissionsAsync(Guid clientId);
    Task SetClientPermissionsAsync(Guid clientId, HashSet<Guid> endpointIds, TimeSpan ttl);
    Task<Client?> GetClientAsync(string clientId);
    Task SetClientAsync(string clientId, Client client, TimeSpan ttl);
    Task<UserProfile?> GetUserProfileAsync(string userId, Guid? serviceId);
    Task SetUserProfileAsync(string userId, Guid? serviceId, UserProfile profile, TimeSpan ttl);
    Task InvalidateAsync(string key);
    Task InvalidateAllAsync();
}
