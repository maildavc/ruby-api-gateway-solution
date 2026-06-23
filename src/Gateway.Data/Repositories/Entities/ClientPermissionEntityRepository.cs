using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class ClientPermissionEntityRepository : IClientPermissionEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ClientPermissionEntityRepository> _logger;

    public ClientPermissionEntityRepository(string connectionString, ILogger<ClientPermissionEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<ClientPermission?> GetByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT id, client_id, endpoint_id, is_enabled, created_at, expires_at
            FROM ""SeaBaasAPIGateway-Core"".client_permissions
            WHERE id = @Id;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<ClientPermission>(sql, new { Id = id });
    }

    public async Task<IEnumerable<ClientPermission>> GetAllAsync(Guid? clientId = null)
    {
        const string sql = @"
            SELECT id, client_id, endpoint_id, is_enabled, created_at, expires_at
            FROM ""SeaBaasAPIGateway-Core"".client_permissions
            WHERE (@ClientId IS NULL OR client_id = @ClientId);";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<ClientPermission>(sql, new { ClientId = clientId });
    }

    public async Task<ClientPermission> CreateAsync(ClientPermission permission)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".client_permissions (client_id, endpoint_id, is_enabled, expires_at)
            VALUES (@ClientId, @EndpointId, COALESCE(@IsEnabled, true), @ExpiresAt)
            RETURNING *;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<ClientPermission>(sql, permission);
    }

    public async Task<ClientPermission?> UpdateAsync(Guid id, ClientPermission permission)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".client_permissions SET
                is_enabled = COALESCE(@IsEnabled, is_enabled),
                expires_at = COALESCE(@ExpiresAt, expires_at)
            WHERE id = @Id
            RETURNING *;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleOrDefaultAsync<ClientPermission>(sql, new
        {
            Id = id,
            permission.IsEnabled,
            permission.ExpiresAt
        });
    }

    public async Task<bool> DisableAsync(Guid id)
    {
        const string sql = @"UPDATE ""SeaBaasAPIGateway-Core"".client_permissions SET is_enabled = false WHERE id = @Id";
        await using var connection = new NpgsqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(sql, new { Id = id });
        return affected > 0;
    }
}
