using System.Text.Json;
using Gateway.Core.Entities;
using Gateway.Core.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Gateway.Infrastructure.Caching;

/// <summary>
/// Two-tier cache: L1 (in-memory) + L2 (ValKey/Redis)
/// Optimized for minimal latency in hot path
/// </summary>
public class PolicyCache : IPolicyCache
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<PolicyCache> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    // L1 cache settings for ultra-fast access
    private readonly TimeSpan _memoryCacheTtl = TimeSpan.FromHours(1);
    private const string PolicyKeyPrefix = "policy:";
    private const string PermissionKeyPrefix = "perm:";
    private const string ClientKeyPrefix = "client:";
    private const string UserProfileKeyPrefix = "user-profile:";

    public PolicyCache(
        IConnectionMultiplexer redis,
        IMemoryCache memoryCache,
        ILogger<PolicyCache> logger)
    {
        _redis = redis;
        _memoryCache = memoryCache;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = false
        };
    }

    public async Task<EndpointPolicy?> GetPolicyAsync(string routeKey)
    {
        var cacheKey = $"{PolicyKeyPrefix}{routeKey}";

        // Try L1 cache first (in-memory, fastest)
        if (_memoryCache.TryGetValue<EndpointPolicy>(cacheKey, out var cachedPolicy))
        {
            return cachedPolicy;
        }

        // Try L2 cache (ValKey/Redis)
        try
        {
            var db = _redis.GetDatabase();
            var json = await db.StringGetAsync(cacheKey);
            
            if (!json.IsNullOrEmpty)
            {
                var policy = JsonSerializer.Deserialize<EndpointPolicy>(json!, _jsonOptions);
                
                // Populate L1 cache for next request
                if (policy != null)
                {
                    var options = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = _memoryCacheTtl,
                        Size = 1
                    };
                    _memoryCache.Set(cacheKey, policy, options);
                }
                
                return policy;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read from Redis cache for key {CacheKey}", cacheKey);
        }

        return null;
    }

    public async Task SetPolicyAsync(string routeKey, EndpointPolicy policy, TimeSpan ttl)
    {
        var cacheKey = $"{PolicyKeyPrefix}{routeKey}";

        // Set in L1 cache (in-memory) with size
        var cacheEntryOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = _memoryCacheTtl,
            Size = 1  // Each policy counts as 1 unit toward the size limit
        };
        _memoryCache.Set(cacheKey, policy, cacheEntryOptions);

        // Set in L2 cache (ValKey/Redis)
        try
        {
            var db = _redis.GetDatabase();
            var json = JsonSerializer.Serialize(policy, _jsonOptions);
            await db.StringSetAsync(cacheKey, json, ttl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write to Redis cache for key {CacheKey}", cacheKey);
        }
    }

    public async Task<HashSet<Guid>?> GetClientPermissionsAsync(Guid clientId)
    {
        var cacheKey = $"{PermissionKeyPrefix}{clientId}";

        // Try L1 cache first
        if (_memoryCache.TryGetValue<HashSet<Guid>>(cacheKey, out var cachedPerms))
        {
            return cachedPerms;
        }

        // Try L2 cache
        try
        {
            var db = _redis.GetDatabase();
            var json = await db.StringGetAsync(cacheKey);
            
            if (!json.IsNullOrEmpty)
            {
                var permissions = JsonSerializer.Deserialize<HashSet<Guid>>(json!, _jsonOptions);
                
                if (permissions != null)
                {
                    var options = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = _memoryCacheTtl,
                        Size = 1
                    };
                    _memoryCache.Set(cacheKey, permissions, options);
                }
                
                return permissions;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read permissions from Redis for client {ClientId}", clientId);
        }

        return null;
    }

    public async Task SetClientPermissionsAsync(Guid clientId, HashSet<Guid> endpointIds, TimeSpan ttl)
    {
        var cacheKey = $"{PermissionKeyPrefix}{clientId}";

        // Set in L1 cache with size
        var cacheEntryOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = _memoryCacheTtl,
            Size = 1
        };
        _memoryCache.Set(cacheKey, endpointIds, cacheEntryOptions);

        // Set in L2 cache
        try
        {
            var db = _redis.GetDatabase();
            var json = JsonSerializer.Serialize(endpointIds, _jsonOptions);
            await db.StringSetAsync(cacheKey, json, ttl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write permissions to Redis for client {ClientId}", clientId);
        }
    }

    public async Task<Client?> GetClientAsync(string clientId)
    {
        var cacheKey = $"{ClientKeyPrefix}{clientId}";

        if (_memoryCache.TryGetValue<Client>(cacheKey, out var cachedClient))
        {
            return cachedClient;
        }

        try
        {
            var db = _redis.GetDatabase();
            var json = await db.StringGetAsync(cacheKey);

            if (!json.IsNullOrEmpty)
            {
                var client = JsonSerializer.Deserialize<Client>(json!, _jsonOptions);
                if (client != null)
                {
                    var options = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = _memoryCacheTtl,
                        Size = 1
                    };
                    _memoryCache.Set(cacheKey, client, options);
                }

                return client;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read client from Redis for client {ClientId}", clientId);
        }

        return null;
    }

    public async Task SetClientAsync(string clientId, Client client, TimeSpan ttl)
    {
        var cacheKey = $"{ClientKeyPrefix}{clientId}";

        var cacheEntryOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = _memoryCacheTtl,
            Size = 1
        };
        _memoryCache.Set(cacheKey, client, cacheEntryOptions);

        try
        {
            var db = _redis.GetDatabase();
            var json = JsonSerializer.Serialize(client, _jsonOptions);
            await db.StringSetAsync(cacheKey, json, ttl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write client to Redis for client {ClientId}", clientId);
        }
    }

    public async Task<UserProfile?> GetUserProfileAsync(string userId, Guid? serviceId)
    {
        var cacheKey = $"{UserProfileKeyPrefix}{userId}:{serviceId?.ToString() ?? "global"}";

        if (_memoryCache.TryGetValue<UserProfile>(cacheKey, out var cachedProfile))
        {
            return cachedProfile;
        }

        try
        {
            var db = _redis.GetDatabase();
            var json = await db.StringGetAsync(cacheKey);

            if (!json.IsNullOrEmpty)
            {
                var profile = JsonSerializer.Deserialize<UserProfile>(json!, _jsonOptions);
                if (profile != null)
                {
                    var options = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = _memoryCacheTtl,
                        Size = 1
                    };
                    _memoryCache.Set(cacheKey, profile, options);
                }

                return profile;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read user profile from Redis for user {UserId}", userId);
        }

        return null;
    }

    public async Task SetUserProfileAsync(string userId, Guid? serviceId, UserProfile profile, TimeSpan ttl)
    {
        var cacheKey = $"{UserProfileKeyPrefix}{userId}:{serviceId?.ToString() ?? "global"}";

        var cacheEntryOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = _memoryCacheTtl,
            Size = 1
        };
        _memoryCache.Set(cacheKey, profile, cacheEntryOptions);

        try
        {
            var db = _redis.GetDatabase();
            var json = JsonSerializer.Serialize(profile, _jsonOptions);
            await db.StringSetAsync(cacheKey, json, ttl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write user profile to Redis for user {UserId}", userId);
        }
    }

    public async Task InvalidateAsync(string key)
    {
        _memoryCache.Remove(key);

        try
        {
            var db = _redis.GetDatabase();
            await db.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to invalidate Redis key {Key}", key);
        }
    }

    public async Task InvalidateAllAsync()
    {
        // Clear L1 cache
        if (_memoryCache is MemoryCache mc)
        {
            mc.Compact(1.0); // Compact 100%
        }

        // Clear L2 cache (pattern-based delete)
        try
        {
            var db = _redis.GetDatabase();
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            
            await foreach (var key in server.KeysAsync(pattern: $"{PolicyKeyPrefix}*"))
            {
                await db.KeyDeleteAsync(key);
            }
            
            await foreach (var key in server.KeysAsync(pattern: $"{PermissionKeyPrefix}*"))
            {
                await db.KeyDeleteAsync(key);
            }

            await foreach (var key in server.KeysAsync(pattern: $"{ClientKeyPrefix}*"))
            {
                await db.KeyDeleteAsync(key);
            }

            await foreach (var key in server.KeysAsync(pattern: $"{UserProfileKeyPrefix}*"))
            {
                await db.KeyDeleteAsync(key);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to invalidate all Redis keys");
        }
    }
}
