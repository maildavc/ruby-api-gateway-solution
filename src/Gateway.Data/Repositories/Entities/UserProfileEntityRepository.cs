using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class UserProfileEntityRepository : IUserProfileEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<UserProfileEntityRepository> _logger;

    public UserProfileEntityRepository(string connectionString, ILogger<UserProfileEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<UserProfile?> GetByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT id, user_id, service_id, encryption_key, encryption_iv, is_enabled, created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".user_profiles
            WHERE id = @Id;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<UserProfile>(sql, new { Id = id });
    }

    public async Task<IEnumerable<UserProfile>> GetAllAsync(string? userId = null, Guid? serviceId = null)
    {
        const string sql = @"
            SELECT id, user_id, service_id, encryption_key, encryption_iv, is_enabled, created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".user_profiles
            WHERE (@UserId IS NULL OR user_id = @UserId)
              AND (@ServiceId IS NULL OR service_id = @ServiceId);";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<UserProfile>(sql, new { UserId = userId, ServiceId = serviceId });
    }

    public async Task<UserProfile> CreateAsync(UserProfile profile)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".user_profiles (user_id, service_id, encryption_key, encryption_iv, is_enabled)
            VALUES (@UserId, @ServiceId, @EncryptionKey, @EncryptionIv, COALESCE(@IsEnabled, true))
            RETURNING *;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<UserProfile>(sql, profile);
    }

    public async Task<UserProfile?> UpdateAsync(Guid id, UserProfile profile)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".user_profiles SET
                user_id = COALESCE(@UserId, user_id),
                service_id = COALESCE(@ServiceId, service_id),
                encryption_key = COALESCE(@EncryptionKey, encryption_key),
                encryption_iv = COALESCE(@EncryptionIv, encryption_iv),
                is_enabled = COALESCE(@IsEnabled, is_enabled)
            WHERE id = @Id
            RETURNING *;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleOrDefaultAsync<UserProfile>(sql, new
        {
            Id = id,
            profile.UserId,
            profile.ServiceId,
            profile.EncryptionKey,
            profile.EncryptionIv,
            profile.IsEnabled
        });
    }

    public async Task<bool> DisableAsync(Guid id)
    {
        const string sql = @"UPDATE ""SeaBaasAPIGateway-Core"".user_profiles SET is_enabled = false WHERE id = @Id";
        await using var connection = new NpgsqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(sql, new { Id = id });
        return affected > 0;
    }
}
