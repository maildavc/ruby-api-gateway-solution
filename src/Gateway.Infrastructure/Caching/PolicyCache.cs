using System.Text.Json;
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
    private readonly TimeSpan _memoryCacheTtl = TimeSpan.FromMinutes(5);
    private const string PolicyKeyPrefix = "policy:";
    private const string PermissionKeyPrefix = "perm:";

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
                    _memoryCache.Set(cacheKey, policy, _memoryCacheTtl);
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

        // Set in L1 cache (in-memory)
        _memoryCache.Set(cacheKey, policy, _memoryCacheTtl);

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

    public async Task<HashSet<int>?> GetClientPermissionsAsync(int clientId)
    {
        var cacheKey = $"{PermissionKeyPrefix}{clientId}";

        // Try L1 cache first
        if (_memoryCache.TryGetValue<HashSet<int>>(cacheKey, out var cachedPerms))
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
                var permissions = JsonSerializer.Deserialize<HashSet<int>>(json!, _jsonOptions);
                
                if (permissions != null)
                {
                    _memoryCache.Set(cacheKey, permissions, _memoryCacheTtl);
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

    public async Task SetClientPermissionsAsync(int clientId, HashSet<int> endpointIds, TimeSpan ttl)
    {
        var cacheKey = $"{PermissionKeyPrefix}{clientId}";

        // Set in L1 cache
        _memoryCache.Set(cacheKey, endpointIds, _memoryCacheTtl);

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
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to invalidate all Redis keys");
        }
    }
}
