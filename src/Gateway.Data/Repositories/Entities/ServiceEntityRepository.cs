using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class ServiceEntityRepository : IServiceEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ServiceEntityRepository> _logger;

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

    public ServiceEntityRepository(string connectionString, ILogger<ServiceEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<IEnumerable<Service>> GetAllAsync(bool? enabledOnly = null)
    {
        var whereClause = enabledOnly == true ? "WHERE is_enabled = true" : "";
        var sql = $@"SELECT {ServiceColumns} FROM ""SeaBaasAPIGateway-Core"".services {whereClause}";
        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Service>(sql);
    }

    public async Task<IEnumerable<Service>> GetByProductIdAsync(Guid productId, bool? enabledOnly = null)
    {
        var whereClause = enabledOnly == true ? "WHERE product_id = @ProductId AND is_enabled = true" : "WHERE product_id = @ProductId";
        var sql = $@"SELECT {ServiceColumns} FROM ""SeaBaasAPIGateway-Core"".services {whereClause}";
        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Service>(sql, new { ProductId = productId });
    }

    public async Task<Service?> GetByIdAsync(Guid id)
    {
        var sql = $@"SELECT {ServiceColumns} FROM ""SeaBaasAPIGateway-Core"".services WHERE id = @Id";
        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Service>(sql, new { Id = id });
    }

    public async Task<Service> CreateAsync(Service service)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".services (
                product_id, service_name, base_path, version, description, owner_team,
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
                default_crypto_algorithm, default_key_source, default_iv_source, default_encoding, default_require_iv
            ) VALUES (
                @ProductId, @ServiceName, @BasePath, @Version, @Description, @OwnerTeam,
                @IsEnabled, @Environment, @ClusterId, @Destinations::jsonb, @LoadBalancingPolicy,
                @HealthCheckEnabled, @HealthCheckPath, @HealthCheckIntervalSeconds,
                @SessionAffinityEnabled, @SessionAffinityCookieName, @SessionAffinityTtlSeconds,
                @CircuitBreakerEnabled, @CircuitBreakerThreshold, @CircuitBreakerDurationSeconds,
                @RetryEnabled, @RetryCount, @RetryDelayMs,
                @ConnectionTimeoutSeconds, @RequestTimeoutSeconds, @MaxConnectionsPerDestination,
                @PassiveHealthCheckEnabled, @PassiveHealthFailureThreshold, @PassiveHealthReactivationSeconds,
                @EnableTracing, @EnableMetrics, @LogSampling,
                @RequiresJwt, @RequiredScopes::jsonb, @AllowedClients::jsonb,
                @CacheEnabled, @CacheTtlSeconds, @CacheKeyTemplate,
                @EmitEvents, @TopicPrefix, @EventSchemaVersion,
                @DefaultCryptoAlgorithm, @DefaultKeySource, @DefaultIvSource, @DefaultEncoding, @DefaultRequireIv
            )
            RETURNING *;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<Service>(sql, service);
    }

    public async Task<Service?> UpdateAsync(Guid id, Service service)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".services SET
                product_id = COALESCE(@ProductId, product_id),
                service_name = COALESCE(@ServiceName, service_name),
                base_path = COALESCE(@BasePath, base_path),
                version = COALESCE(@Version, version),
                description = COALESCE(@Description, description),
                owner_team = COALESCE(@OwnerTeam, owner_team),
                is_enabled = COALESCE(@IsEnabled, is_enabled),
                environment = COALESCE(@Environment, environment),
                cluster_id = COALESCE(@ClusterId, cluster_id),
                destinations = COALESCE(@Destinations::jsonb, destinations),
                load_balancing_policy = COALESCE(@LoadBalancingPolicy, load_balancing_policy),
                health_check_enabled = COALESCE(@HealthCheckEnabled, health_check_enabled),
                health_check_path = COALESCE(@HealthCheckPath, health_check_path),
                health_check_interval_seconds = COALESCE(@HealthCheckIntervalSeconds, health_check_interval_seconds),
                session_affinity_enabled = COALESCE(@SessionAffinityEnabled, session_affinity_enabled),
                session_affinity_cookie_name = COALESCE(@SessionAffinityCookieName, session_affinity_cookie_name),
                session_affinity_ttl_seconds = COALESCE(@SessionAffinityTtlSeconds, session_affinity_ttl_seconds),
                circuit_breaker_enabled = COALESCE(@CircuitBreakerEnabled, circuit_breaker_enabled),
                circuit_breaker_threshold = COALESCE(@CircuitBreakerThreshold, circuit_breaker_threshold),
                circuit_breaker_duration_seconds = COALESCE(@CircuitBreakerDurationSeconds, circuit_breaker_duration_seconds),
                retry_enabled = COALESCE(@RetryEnabled, retry_enabled),
                retry_count = COALESCE(@RetryCount, retry_count),
                retry_delay_ms = COALESCE(@RetryDelayMs, retry_delay_ms),
                connection_timeout_seconds = COALESCE(@ConnectionTimeoutSeconds, connection_timeout_seconds),
                request_timeout_seconds = COALESCE(@RequestTimeoutSeconds, request_timeout_seconds),
                max_connections_per_destination = COALESCE(@MaxConnectionsPerDestination, max_connections_per_destination),
                passive_health_check_enabled = COALESCE(@PassiveHealthCheckEnabled, passive_health_check_enabled),
                passive_health_failure_threshold = COALESCE(@PassiveHealthFailureThreshold, passive_health_failure_threshold),
                passive_health_reactivation_seconds = COALESCE(@PassiveHealthReactivationSeconds, passive_health_reactivation_seconds),
                enable_tracing = COALESCE(@EnableTracing, enable_tracing),
                enable_metrics = COALESCE(@EnableMetrics, enable_metrics),
                log_sampling = COALESCE(@LogSampling, log_sampling),
                requires_jwt = COALESCE(@RequiresJwt, requires_jwt),
                required_scopes = COALESCE(@RequiredScopes::jsonb, required_scopes),
                allowed_clients = COALESCE(@AllowedClients::jsonb, allowed_clients),
                cache_enabled = COALESCE(@CacheEnabled, cache_enabled),
                cache_ttl_seconds = COALESCE(@CacheTtlSeconds, cache_ttl_seconds),
                cache_key_template = COALESCE(@CacheKeyTemplate, cache_key_template),
                emit_events = COALESCE(@EmitEvents, emit_events),
                topic_prefix = COALESCE(@TopicPrefix, topic_prefix),
                event_schema_version = COALESCE(@EventSchemaVersion, event_schema_version),
                default_crypto_algorithm = COALESCE(@DefaultCryptoAlgorithm, default_crypto_algorithm),
                default_key_source = COALESCE(@DefaultKeySource, default_key_source),
                default_iv_source = COALESCE(@DefaultIvSource, default_iv_source),
                default_encoding = COALESCE(@DefaultEncoding, default_encoding),
                default_require_iv = COALESCE(@DefaultRequireIv, default_require_iv)
            WHERE id = @Id
            RETURNING *;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleOrDefaultAsync<Service>(sql, new
        {
            Id = id,
            service.ProductId,
            service.ServiceName,
            service.BasePath,
            service.Version,
            service.Description,
            service.OwnerTeam,
            service.IsEnabled,
            service.Environment,
            service.ClusterId,
            service.Destinations,
            service.LoadBalancingPolicy,
            service.HealthCheckEnabled,
            service.HealthCheckPath,
            service.HealthCheckIntervalSeconds,
            service.SessionAffinityEnabled,
            service.SessionAffinityCookieName,
            service.SessionAffinityTtlSeconds,
            service.CircuitBreakerEnabled,
            service.CircuitBreakerThreshold,
            service.CircuitBreakerDurationSeconds,
            service.RetryEnabled,
            service.RetryCount,
            service.RetryDelayMs,
            service.ConnectionTimeoutSeconds,
            service.RequestTimeoutSeconds,
            service.MaxConnectionsPerDestination,
            service.PassiveHealthCheckEnabled,
            service.PassiveHealthFailureThreshold,
            service.PassiveHealthReactivationSeconds,
            service.EnableTracing,
            service.EnableMetrics,
            service.LogSampling,
            service.RequiresJwt,
            service.RequiredScopes,
            service.AllowedClients,
            service.CacheEnabled,
            service.CacheTtlSeconds,
            service.CacheKeyTemplate,
            service.EmitEvents,
            service.TopicPrefix,
            service.EventSchemaVersion,
            service.DefaultCryptoAlgorithm,
            service.DefaultKeySource,
            service.DefaultIvSource,
            service.DefaultEncoding,
            service.DefaultRequireIv
        });
    }

    public async Task<bool> DisableAsync(Guid id)
    {
        const string sql = @"UPDATE ""SeaBaasAPIGateway-Core"".services SET is_enabled = false WHERE id = @Id";
        await using var connection = new NpgsqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(sql, new { Id = id });
        return affected > 0;
    }
}
