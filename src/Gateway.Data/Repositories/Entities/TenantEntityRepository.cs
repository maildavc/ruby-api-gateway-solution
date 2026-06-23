using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class TenantEntityRepository : ITenantEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<TenantEntityRepository> _logger;

    public TenantEntityRepository(string connectionString, ILogger<TenantEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<IEnumerable<Tenant>> GetAllAsync()
    {
        const string sql = @"
            SELECT id, name, domain, status, created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".tenants
            ORDER BY created_at DESC;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Tenant>(sql);
    }

    public async Task<Tenant?> GetByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT id, name, domain, status, created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".tenants
            WHERE id = @Id;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Tenant>(sql, new { Id = id });
    }

    public async Task<Tenant> CreateAsync(Tenant tenant)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".tenants (name, domain, status)
            VALUES (@Name, @Domain, COALESCE(@Status, 'pending'))
            RETURNING id, name, domain, status, created_at, updated_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<Tenant>(sql, tenant);
    }

    public async Task<Tenant?> UpdateStatusAsync(Guid id, string status)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".tenants
            SET status = @Status
            WHERE id = @Id
            RETURNING id, name, domain, status, created_at, updated_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Tenant>(sql, new { Id = id, Status = status });
    }
}
