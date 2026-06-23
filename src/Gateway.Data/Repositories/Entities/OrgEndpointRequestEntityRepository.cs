using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class OrgEndpointRequestEntityRepository : IOrgEndpointRequestEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<OrgEndpointRequestEntityRepository> _logger;

    public OrgEndpointRequestEntityRepository(string connectionString, ILogger<OrgEndpointRequestEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<IEnumerable<OrgEndpointRequest>> GetAllAsync(Guid? tenantId = null, string? status = null)
    {
        const string sql = @"
            SELECT id, tenant_id, endpoint_id, status, requested_by, reviewed_by, reviewed_at, created_at
            FROM ""SeaBaasAPIGateway-Core"".org_endpoint_requests
            WHERE (@TenantId IS NULL OR tenant_id = @TenantId)
              AND (@Status IS NULL OR status = @Status)
            ORDER BY created_at DESC;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<OrgEndpointRequest>(sql, new { TenantId = tenantId, Status = status });
    }

    public async Task<IEnumerable<OrgEndpointRequest>> GetByTenantAsync(Guid tenantId)
    {
        const string sql = @"
            SELECT id, tenant_id, endpoint_id, status, requested_by, reviewed_by, reviewed_at, created_at
            FROM ""SeaBaasAPIGateway-Core"".org_endpoint_requests
            WHERE tenant_id = @TenantId
            ORDER BY created_at DESC;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<OrgEndpointRequest>(sql, new { TenantId = tenantId });
    }

    public async Task<OrgEndpointRequest?> GetByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT id, tenant_id, endpoint_id, status, requested_by, reviewed_by, reviewed_at, created_at
            FROM ""SeaBaasAPIGateway-Core"".org_endpoint_requests
            WHERE id = @Id;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<OrgEndpointRequest>(sql, new { Id = id });
    }

    public async Task<OrgEndpointRequest> CreateAsync(OrgEndpointRequest request)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".org_endpoint_requests
              (tenant_id, endpoint_id, status, requested_by)
            VALUES (@TenantId, @EndpointId, COALESCE(@Status, 'pending'), @RequestedBy)
            RETURNING id, tenant_id, endpoint_id, status, requested_by, reviewed_by, reviewed_at, created_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<OrgEndpointRequest>(sql, request);
    }

    public async Task<OrgEndpointRequest?> UpdateStatusAsync(Guid id, string status, Guid? reviewedBy)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".org_endpoint_requests
            SET status = @Status,
                reviewed_by = @ReviewedBy,
                reviewed_at = now()
            WHERE id = @Id
            RETURNING id, tenant_id, endpoint_id, status, requested_by, reviewed_by, reviewed_at, created_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<OrgEndpointRequest>(sql, new { Id = id, Status = status, ReviewedBy = reviewedBy });
    }
}
