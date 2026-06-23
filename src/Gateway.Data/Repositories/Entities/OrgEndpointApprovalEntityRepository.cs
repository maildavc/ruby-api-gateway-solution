using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class OrgEndpointApprovalEntityRepository : IOrgEndpointApprovalEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<OrgEndpointApprovalEntityRepository> _logger;

    public OrgEndpointApprovalEntityRepository(string connectionString, ILogger<OrgEndpointApprovalEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<IEnumerable<OrgEndpointApproval>> GetAllAsync(Guid? tenantId = null)
    {
        const string sql = @"
            SELECT id, tenant_id, endpoint_id, approved_by, approved_at,
                   admin_ip_allowlist, admin_ip_enforced, created_at
            FROM ""SeaBaasAPIGateway-Core"".org_endpoint_approvals
            WHERE (@TenantId IS NULL OR tenant_id = @TenantId)
            ORDER BY created_at DESC;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<OrgEndpointApproval>(sql, new { TenantId = tenantId });
    }

    public async Task<IEnumerable<OrgEndpointApproval>> GetByTenantAsync(Guid tenantId)
    {
        const string sql = @"
            SELECT id, tenant_id, endpoint_id, approved_by, approved_at,
                   admin_ip_allowlist, admin_ip_enforced, created_at
            FROM ""SeaBaasAPIGateway-Core"".org_endpoint_approvals
            WHERE tenant_id = @TenantId
            ORDER BY created_at DESC;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<OrgEndpointApproval>(sql, new { TenantId = tenantId });
    }

    public async Task<OrgEndpointApproval?> GetByTenantAndEndpointAsync(Guid tenantId, Guid endpointId)
    {
        const string sql = @"
            SELECT id, tenant_id, endpoint_id, approved_by, approved_at,
                   admin_ip_allowlist, admin_ip_enforced, created_at
            FROM ""SeaBaasAPIGateway-Core"".org_endpoint_approvals
            WHERE tenant_id = @TenantId AND endpoint_id = @EndpointId;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<OrgEndpointApproval>(sql, new { TenantId = tenantId, EndpointId = endpointId });
    }

    public async Task<OrgEndpointApproval> CreateAsync(OrgEndpointApproval approval)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".org_endpoint_approvals
              (tenant_id, endpoint_id, approved_by, admin_ip_allowlist, admin_ip_enforced)
            VALUES (@TenantId, @EndpointId, @ApprovedBy, @AdminIpAllowlist::jsonb, COALESCE(@AdminIpEnforced, false))
            RETURNING id, tenant_id, endpoint_id, approved_by, approved_at,
                      admin_ip_allowlist, admin_ip_enforced, created_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<OrgEndpointApproval>(sql, approval);
    }

    public async Task<OrgEndpointApproval?> UpdateAsync(Guid id, OrgEndpointApproval approval)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".org_endpoint_approvals
            SET admin_ip_allowlist = COALESCE(@AdminIpAllowlist::jsonb, admin_ip_allowlist),
                admin_ip_enforced = COALESCE(@AdminIpEnforced, admin_ip_enforced)
            WHERE id = @Id
            RETURNING id, tenant_id, endpoint_id, approved_by, approved_at,
                      admin_ip_allowlist, admin_ip_enforced, created_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<OrgEndpointApproval>(sql, new
        {
            Id = id,
            approval.AdminIpAllowlist,
            approval.AdminIpEnforced
        });
    }
}
