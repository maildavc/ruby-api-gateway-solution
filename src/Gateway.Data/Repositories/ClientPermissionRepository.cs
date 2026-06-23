using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories;

/// <summary>
/// Repository for client permissions - critical for authorization
/// </summary>
public class ClientPermissionRepository : IClientPermissionRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ClientPermissionRepository> _logger;

    public ClientPermissionRepository(string connectionString, ILogger<ClientPermissionRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<IEnumerable<ClientPermission>> GetByClientIdAsync(Guid clientId)
    {
        const string sql = @"
            SELECT id, client_id, endpoint_id, is_enabled, created_at, expires_at
            FROM ""SeaBaasAPIGateway-Core"".client_permissions 
            WHERE client_id = @ClientId 
              AND is_enabled = true
              AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<ClientPermission>(sql, new { ClientId = clientId });
    }

    public async Task<bool> HasPermissionAsync(Guid clientId, Guid endpointId)
    {
        const string sql = @"
            SELECT EXISTS(
                SELECT 1 
                FROM ""SeaBaasAPIGateway-Core"".client_permissions 
                WHERE client_id = @ClientId 
                  AND endpoint_id = @EndpointId
                  AND is_enabled = true
                  AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            )";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.ExecuteScalarAsync<bool>(
            sql, 
            new { ClientId = clientId, EndpointId = endpointId },
            commandTimeout: 5
        );
    }

    public async Task<IEnumerable<Guid>> GetAuthorizedEndpointIdsAsync(Guid clientId)
    {
        const string sql = @"
            SELECT endpoint_id
            FROM ""SeaBaasAPIGateway-Core"".client_permissions 
            WHERE client_id = @ClientId 
              AND is_enabled = true
              AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Guid>(sql, new { ClientId = clientId });
    }
}
