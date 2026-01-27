using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories;

/// <summary>
/// High-performance Dapper-based repository for Products
/// </summary>
public class ProductRepository : IProductRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ProductRepository> _logger;

    public ProductRepository(string connectionString, ILogger<ProductRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        const string sql = @"
            SELECT id AS Id, name AS Name, description AS Description, 
                   owner_team AS OwnerTeam, is_enabled AS IsEnabled,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM products 
            WHERE id = @Id";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Product>(sql, new { Id = id });
    }

    public async Task<Product?> GetByNameAsync(string name)
    {
        const string sql = @"
            SELECT id AS Id, name AS Name, description AS Description, 
                   owner_team AS OwnerTeam, is_enabled AS IsEnabled,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM products 
            WHERE name = @Name AND is_enabled = true";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Product>(sql, new { Name = name });
    }

    public async Task<IEnumerable<Product>> GetAllAsync(bool enabledOnly = true)
    {
        var sql = enabledOnly
            ? @"SELECT id AS Id, name AS Name, description AS Description, 
                       owner_team AS OwnerTeam, is_enabled AS IsEnabled,
                       created_at AS CreatedAt, updated_at AS UpdatedAt
                FROM products WHERE is_enabled = true"
            : @"SELECT id AS Id, name AS Name, description AS Description, 
                       owner_team AS OwnerTeam, is_enabled AS IsEnabled,
                       created_at AS CreatedAt, updated_at AS UpdatedAt
                FROM products";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Product>(sql);
    }
}
