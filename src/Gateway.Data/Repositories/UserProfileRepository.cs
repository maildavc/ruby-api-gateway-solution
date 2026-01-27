using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories;

/// <summary>
/// Repository for user-specific crypto keys and IVs
/// </summary>
public class UserProfileRepository : IUserProfileRepository
{
    private readonly string _connectionString;
    private readonly ILogger<UserProfileRepository> _logger;

    public UserProfileRepository(string connectionString, ILogger<UserProfileRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<UserProfile?> GetByUserIdAsync(string userId, int? serviceId = null)
    {
        // Try service-specific first, then fall back to global
        const string sql = @"
            SELECT id, user_id, service_id, encryption_key, encryption_iv,
                   is_enabled, created_at, updated_at
            FROM user_profiles 
            WHERE user_id = @UserId 
              AND (service_id = @ServiceId OR (service_id IS NULL AND @ServiceId IS NOT NULL))
              AND is_enabled = true
            ORDER BY service_id DESC NULLS LAST
            LIMIT 1";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<UserProfile>(
            sql, 
            new { UserId = userId, ServiceId = serviceId },
            commandTimeout: 5
        );
    }

    public async Task<IEnumerable<UserProfile>> GetByUserIdAllServicesAsync(string userId)
    {
        const string sql = @"
            SELECT id, user_id, service_id, encryption_key, encryption_iv,
                   is_enabled, created_at, updated_at
            FROM user_profiles 
            WHERE user_id = @UserId AND is_enabled = true
            ORDER BY service_id NULLS LAST";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<UserProfile>(sql, new { UserId = userId });
    }
}
