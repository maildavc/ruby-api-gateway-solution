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

    public ServiceRepository(string connectionString, ILogger<ServiceRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<Service?> GetByIdAsync(int id)
    {
        const string sql = @"
            SELECT id, product_id, service_name, base_path, version, description, owner_team,
                   is_enabled, environment, cluster_id, destinations, load_balancing_policy,
                   health_check_enabled, health_check_path, health_check_interval_seconds,
                   enable_tracing, enable_metrics, log_sampling,
                   requires_jwt, required_scopes, allowed_clients,
                   cache_enabled, cache_ttl_seconds, cache_key_template,
                   emit_events, topic_prefix, event_schema_version,
                   default_crypto_algorithm, default_key_source, default_iv_source,
                   default_encoding, default_require_iv,
                   created_at, updated_at
            FROM services 
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
        const string sql = @"
            SELECT id, product_id, service_name, base_path, version, description, owner_team,
                   is_enabled, environment, cluster_id, destinations, load_balancing_policy,
                   health_check_enabled, health_check_path, health_check_interval_seconds,
                   enable_tracing, enable_metrics, log_sampling,
                   requires_jwt, required_scopes, allowed_clients,
                   cache_enabled, cache_ttl_seconds, cache_key_template,
                   emit_events, topic_prefix, event_schema_version,
                   default_crypto_algorithm, default_key_source, default_iv_source,
                   default_encoding, default_require_iv,
                   created_at, updated_at
            FROM services 
            WHERE base_path = @BasePath AND is_enabled = true
            LIMIT 1";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Service>(sql, new { BasePath = basePath });
    }

    public async Task<IEnumerable<Service>> GetAllAsync(bool enabledOnly = true)
    {
        var whereClause = enabledOnly ? "WHERE is_enabled = true" : "";
        var sql = $@"
            SELECT id, product_id, service_name, base_path, version, description, owner_team,
                   is_enabled, environment, cluster_id, destinations, load_balancing_policy,
                   health_check_enabled, health_check_path, health_check_interval_seconds,
                   enable_tracing, enable_metrics, log_sampling,
                   requires_jwt, required_scopes, allowed_clients,
                   cache_enabled, cache_ttl_seconds, cache_key_template,
                   emit_events, topic_prefix, event_schema_version,
                   default_crypto_algorithm, default_key_source, default_iv_source,
                   default_encoding, default_require_iv,
                   created_at, updated_at
            FROM services 
            {whereClause}";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Service>(sql);
    }

    public async Task<IEnumerable<Service>> GetByProductIdAsync(int productId, bool enabledOnly = true)
    {
        var whereClause = enabledOnly 
            ? "WHERE product_id = @ProductId AND is_enabled = true"
            : "WHERE product_id = @ProductId";
            
        var sql = $@"
            SELECT id, product_id, service_name, base_path, version, description, owner_team,
                   is_enabled, environment, cluster_id, destinations, load_balancing_policy,
                   health_check_enabled, health_check_path, health_check_interval_seconds,
                   enable_tracing, enable_metrics, log_sampling,
                   requires_jwt, required_scopes, allowed_clients,
                   cache_enabled, cache_ttl_seconds, cache_key_template,
                   emit_events, topic_prefix, event_schema_version,
                   default_crypto_algorithm, default_key_source, default_iv_source,
                   default_encoding, default_require_iv,
                   created_at, updated_at
            FROM services 
            {whereClause}";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Service>(sql, new { ProductId = productId });
    }
}
