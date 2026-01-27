using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories;

public class ClientRepository : IClientRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ClientRepository> _logger;

    public ClientRepository(string connectionString, ILogger<ClientRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<Client?> GetByIdAsync(int id)
    {
        const string sql = @"
            SELECT id, client_id, client_name, client_secret, is_enabled,
                   allowed_ip_addresses, created_at, updated_at, last_accessed_at
            FROM clients 
            WHERE id = @Id";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Client>(sql, new { Id = id });
    }

    public async Task<Client?> GetByClientIdAsync(string clientId)
    {
        const string sql = @"
            SELECT id, client_id, client_name, client_secret, is_enabled,
                   allowed_ip_addresses, created_at, updated_at, last_accessed_at
            FROM clients 
            WHERE client_id = @ClientId AND is_enabled = true
            LIMIT 1";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Client>(
            sql, 
            new { ClientId = clientId },
            commandTimeout: 5
        );
    }

    public async Task UpdateLastAccessAsync(int id)
    {
        const string sql = @"
            UPDATE clients 
            SET last_accessed_at = CURRENT_TIMESTAMP 
            WHERE id = @Id";

        using var connection = new NpgsqlConnection(_connectionString);
        
        // Fire and forget - we don't want to slow down requests for this
        _ = connection.ExecuteAsync(sql, new { Id = id });
        
        await Task.CompletedTask;
    }
}
