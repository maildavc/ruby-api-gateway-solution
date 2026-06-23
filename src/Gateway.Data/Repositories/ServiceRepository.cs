using Dapper;
using Gateway.Core.Entities;
using Gateway.Core.Enums;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories;

/// <summary>
/// High-performance Dapper-based repository for Services
/// Uses column mapping to avoid allocations in hot path
/// </summary>
public class ServiceRepository : IServiceRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ServiceRepository> _logger;

    // All service columns including load balancing, session affinity, circuit breaker, retry, and health check
    private const string ServiceColumns = @"
        id, product_id, service_name, base_path, version, description, owner_team,
        is_enabled, environment, cluster_id, destinations, load_balancing_policy,
        health_check_enabled, health_check_path, health_check_interval_seconds,
        session_affinity_enabled, session_affinity_cookie_name, session_affinity_ttl_seconds,
        circuit_breaker_enabled, circuit_breaker_threshold, circuit_breaker_duration_seconds,
        retry_enabled, retry_count, retry_delay_ms,
        connection_timeout_seconds, request_timeout_seconds, max_connections_per_destination,
        passive_health_check_enabled, passive_health_failure_threshold, passive_health_reactivation_seconds,
        enable_tracing, enable_metrics, log_sampling,
        requires_jwt, required_scopes, allowed_clients,
        cache_enabled, cache_ttl_seconds, cache_key_template,
        emit_events, topic_prefix, event_schema_version,
        default_crypto_algorithm, default_key_source, default_iv_source,
        default_encoding, default_require_iv,
        created_at, updated_at";

    public ServiceRepository(string connectionString, ILogger<ServiceRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<Service?> GetByIdAsync(Guid id)
    {
        var sql = $@"
            SELECT {ServiceColumns}
            FROM ""SeaBaasAPIGateway-Core"".services 
            WHERE id = @Id";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Service>(
            sql, 
            new { Id = id },
            commandTimeout: 5 // Fast timeout for hot path
        );
    }

    public async Task<Service?> GetByBasePathAsync(string basePath)
    {
        var sql = $@"
            SELECT {ServiceColumns}
            FROM ""SeaBaasAPIGateway-Core"".services 
            WHERE base_path = @BasePath AND is_enabled = true
            LIMIT 1";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Service>(sql, new { BasePath = basePath });
    }

    public async Task<IEnumerable<Service>> GetAllAsync(bool enabledOnly = true)
    {
        var whereClause = enabledOnly ? "WHERE is_enabled = true" : "";
        var sql = $@"
            SELECT {ServiceColumns}
            FROM ""SeaBaasAPIGateway-Core"".services 
            {whereClause}";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Service>(sql);
    }

    public async Task<IEnumerable<Service>> GetByProductIdAsync(Guid productId, bool enabledOnly = true)
    {
        var whereClause = enabledOnly 
            ? "WHERE product_id = @ProductId AND is_enabled = true"
            : "WHERE product_id = @ProductId";
            
        var sql = $@"
            SELECT {ServiceColumns}
            FROM ""SeaBaasAPIGateway-Core"".services 
            {whereClause}";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Service>(sql, new { ProductId = productId });
    }

    /// <summary>
    /// Get all destinations for a service from the service_destinations table
    /// </summary>
    public async Task<IEnumerable<ServiceDestination>> GetDestinationsAsync(Guid serviceId)
    {
        const string sql = @"
            SELECT id, service_id, destination_name, address, weight, priority, 
                   is_enabled, health_status, last_health_check, metadata, created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".service_destinations 
            WHERE service_id = @ServiceId AND is_enabled = true
            ORDER BY priority ASC, weight DESC";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<ServiceDestination>(sql, new { ServiceId = serviceId });
    }

    /// <summary>
    /// Update the health status of a destination
    /// </summary>
    public async Task UpdateDestinationHealthAsync(Guid destinationId, string healthStatus)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".service_destinations 
            SET health_status = @HealthStatus, 
                last_health_check = CURRENT_TIMESTAMP, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @Id";

        using var connection = new NpgsqlConnection(_connectionString);
        await connection.ExecuteAsync(sql, new { Id = destinationId, HealthStatus = healthStatus });
    }
}
