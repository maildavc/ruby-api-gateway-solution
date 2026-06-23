using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class OrgClientEntityRepository : IOrgClientEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<OrgClientEntityRepository> _logger;

    public OrgClientEntityRepository(string connectionString, ILogger<OrgClientEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<IEnumerable<Client>> GetClientsByTenantAsync(Guid tenantId)
    {
        const string sql = @"
            SELECT c.id, c.client_id, c.client_name, c.client_secret, c.is_enabled,
                   c.allowed_ip_addresses, c.created_at, c.updated_at, c.last_accessed_at
            FROM ""SeaBaasAPIGateway-Core"".org_clients oc
            JOIN ""SeaBaasAPIGateway-Core"".clients c ON c.id = oc.client_id
            WHERE oc.tenant_id = @TenantId
            ORDER BY c.created_at DESC;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Client>(sql, new { TenantId = tenantId });
    }

    public async Task<OrgClient> CreateAsync(OrgClient orgClient)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".org_clients (tenant_id, client_id, created_by)
            VALUES (@TenantId, @ClientId, @CreatedBy)
            RETURNING id, tenant_id, client_id, created_by, created_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<OrgClient>(sql, orgClient);
    }

    public async Task<bool> DeleteAsync(Guid tenantId, Guid clientId)
    {
        const string sql = @"
            DELETE FROM ""SeaBaasAPIGateway-Core"".org_clients
            WHERE tenant_id = @TenantId AND client_id = @ClientId;";

        await using var connection = new NpgsqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(sql, new { TenantId = tenantId, ClientId = clientId });
        return affected > 0;
    }
}
