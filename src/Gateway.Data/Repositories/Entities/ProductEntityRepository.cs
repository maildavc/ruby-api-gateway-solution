using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class ProductEntityRepository : IProductEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ProductEntityRepository> _logger;

    public ProductEntityRepository(string connectionString, ILogger<ProductEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<IEnumerable<Product>> GetAllAsync(bool? enabledOnly = null)
    {
        var sql = enabledOnly == true
            ? @"SELECT id, name, description, owner_team, is_enabled, created_at, updated_at FROM ""SeaBaasAPIGateway-Core"".products WHERE is_enabled = true"
            : @"SELECT id, name, description, owner_team, is_enabled, created_at, updated_at FROM ""SeaBaasAPIGateway-Core"".products";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Product>(sql);
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT id, name, description, owner_team, is_enabled, created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".products WHERE id = @Id";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Product>(sql, new { Id = id });
    }

    public async Task<Product> CreateAsync(Product product)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".products (name, description, owner_team, is_enabled)
            VALUES (@Name, @Description, @OwnerTeam, COALESCE(@IsEnabled, true))
            RETURNING id, name, description, owner_team, is_enabled, created_at, updated_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<Product>(sql, product);
    }

    public async Task<Product?> UpdateAsync(Guid id, Product product)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".products
            SET name = COALESCE(@Name, name),
                description = COALESCE(@Description, description),
                owner_team = COALESCE(@OwnerTeam, owner_team),
                is_enabled = COALESCE(@IsEnabled, is_enabled)
            WHERE id = @Id
            RETURNING id, name, description, owner_team, is_enabled, created_at, updated_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleOrDefaultAsync<Product>(sql, new
        {
            Id = id,
            product.Name,
            product.Description,
            product.OwnerTeam,
            product.IsEnabled
        });
    }

    public async Task<bool> DisableAsync(Guid id)
    {
        const string sql = @"UPDATE ""SeaBaasAPIGateway-Core"".products SET is_enabled = false WHERE id = @Id";

        await using var connection = new NpgsqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(sql, new { Id = id });
        return affected > 0;
    }
}
