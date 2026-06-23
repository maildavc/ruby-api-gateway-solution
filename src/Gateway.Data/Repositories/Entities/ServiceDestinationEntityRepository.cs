using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class ServiceDestinationEntityRepository : IServiceDestinationEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ServiceDestinationEntityRepository> _logger;

    public ServiceDestinationEntityRepository(string connectionString, ILogger<ServiceDestinationEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<ServiceDestination?> GetByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT id, service_id, destination_name, address, weight, priority,
                   is_enabled, health_status, last_health_check, metadata, created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".service_destinations
            WHERE id = @Id";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<ServiceDestination>(sql, new { Id = id });
    }

    public async Task<IEnumerable<ServiceDestination>> GetByServiceIdAsync(Guid serviceId)
    {
        const string sql = @"
            SELECT id, service_id, destination_name, address, weight, priority,
                   is_enabled, health_status, last_health_check, metadata, created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".service_destinations
            WHERE service_id = @ServiceId AND is_enabled = true
            ORDER BY priority ASC, weight DESC";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<ServiceDestination>(sql, new { ServiceId = serviceId });
    }

    public async Task<ServiceDestination> CreateAsync(ServiceDestination destination)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".service_destinations (service_id, destination_name, address, weight, priority, is_enabled, metadata)
            VALUES (@ServiceId, @DestinationName, @Address, COALESCE(@Weight, 1), COALESCE(@Priority, 0), COALESCE(@IsEnabled, true), @Metadata::jsonb)
            RETURNING *;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<ServiceDestination>(sql, destination);
    }

    public async Task<ServiceDestination?> UpdateAsync(Guid id, ServiceDestination destination)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".service_destinations SET
                service_id = COALESCE(@ServiceId, service_id),
                destination_name = COALESCE(@DestinationName, destination_name),
                address = COALESCE(@Address, address),
                weight = COALESCE(@Weight, weight),
                priority = COALESCE(@Priority, priority),
                is_enabled = COALESCE(@IsEnabled, is_enabled),
                metadata = COALESCE(@Metadata::jsonb, metadata)
            WHERE id = @Id
            RETURNING *;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleOrDefaultAsync<ServiceDestination>(sql, new
        {
            Id = id,
            destination.ServiceId,
            destination.DestinationName,
            destination.Address,
            destination.Weight,
            destination.Priority,
            destination.IsEnabled,
            destination.Metadata
        });
    }

    public async Task<bool> DisableAsync(Guid id)
    {
        const string sql = @"UPDATE ""SeaBaasAPIGateway-Core"".service_destinations SET is_enabled = false WHERE id = @Id";
        await using var connection = new NpgsqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(sql, new { Id = id });
        return affected > 0;
    }
}
