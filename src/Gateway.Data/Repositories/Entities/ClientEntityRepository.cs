using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class ClientEntityRepository : IClientEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ClientEntityRepository> _logger;

    public ClientEntityRepository(string connectionString, ILogger<ClientEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<IEnumerable<Client>> GetAllAsync(bool? enabledOnly = null)
    {
        const string sql = @"
            SELECT id, client_id, client_name, client_secret, is_enabled,
                   allowed_ip_addresses, created_at, updated_at, last_accessed_at
            FROM ""SeaBaasAPIGateway-Core"".clients
            WHERE (@EnabledOnly IS NULL) OR (is_enabled = @EnabledOnly);";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Client>(sql, new { EnabledOnly = enabledOnly });
    }

    public async Task<Client?> GetByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT id, client_id, client_name, client_secret, is_enabled,
                   allowed_ip_addresses, created_at, updated_at, last_accessed_at
            FROM ""SeaBaasAPIGateway-Core"".clients
            WHERE id = @Id;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Client>(sql, new { Id = id });
    }

    public async Task<Client> CreateAsync(Client client)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".clients (client_id, client_name, client_secret, is_enabled, allowed_ip_addresses)
            VALUES (@ClientId, @ClientName, @ClientSecret, COALESCE(@IsEnabled, true), @AllowedIpAddresses::jsonb)
            RETURNING id, client_id, client_name, client_secret, is_enabled, allowed_ip_addresses, created_at, updated_at, last_accessed_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<Client>(sql, client);
    }

    public async Task<Client?> UpdateAsync(Guid id, Client client)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".clients SET
                client_id = COALESCE(@ClientId, client_id),
                client_name = COALESCE(@ClientName, client_name),
                client_secret = COALESCE(@ClientSecret, client_secret),
                is_enabled = COALESCE(@IsEnabled, is_enabled),
                allowed_ip_addresses = COALESCE(@AllowedIpAddresses::jsonb, allowed_ip_addresses)
            WHERE id = @Id
            RETURNING id, client_id, client_name, client_secret, is_enabled, allowed_ip_addresses, created_at, updated_at, last_accessed_at;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleOrDefaultAsync<Client>(sql, new
        {
            Id = id,
            client.ClientId,
            client.ClientName,
            client.ClientSecret,
            client.IsEnabled,
            client.AllowedIpAddresses
        });
    }

    public async Task<bool> DisableAsync(Guid id)
    {
        const string sql = @"UPDATE ""SeaBaasAPIGateway-Core"".clients SET is_enabled = false WHERE id = @Id";
        await using var connection = new NpgsqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(sql, new { Id = id });
        return affected > 0;
    }
}
