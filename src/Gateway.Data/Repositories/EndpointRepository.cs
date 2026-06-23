using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories;

/// <summary>
/// High-performance Dapper-based repository for Endpoints
/// Critical for request routing - optimized for minimal latency
/// </summary>
public class EndpointRepository : IEndpointRepository
{
    private readonly string _connectionString;
    private readonly ILogger<EndpointRepository> _logger;

    public EndpointRepository(string connectionString, ILogger<EndpointRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<Endpoint?> GetByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT id, service_id, endpoint_name, http_method, relative_path,
                   upstream_path_template, is_enabled, timeout_ms, max_retries,
                   idempotent_only, request_size_limit_bytes, response_size_limit_bytes,
                   payload_expectation, headers_to_add, headers_to_remove, rate_limit_policy,
                   crypto_algorithm, key_source, iv_source, encoding, require_iv,
                   encrypt_request, encrypt_response,
                   created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".endpoints 
            WHERE id = @Id";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Endpoint>(
            sql, 
            new { Id = id },
            commandTimeout: 5
        );
    }

    public async Task<IEnumerable<Endpoint>> GetByServiceIdAsync(Guid serviceId, bool enabledOnly = true)
    {
        var whereClause = enabledOnly
            ? "WHERE service_id = @ServiceId AND is_enabled = true"
            : "WHERE service_id = @ServiceId";

        var sql = $@"
            SELECT id, service_id, endpoint_name, http_method, relative_path,
                   upstream_path_template, is_enabled, timeout_ms, max_retries,
                   idempotent_only, request_size_limit_bytes, response_size_limit_bytes,
                   payload_expectation, headers_to_add, headers_to_remove, rate_limit_policy,
                   crypto_algorithm, key_source, iv_source, encoding, require_iv,
                   encrypt_request, encrypt_response,
                   created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".endpoints 
            {whereClause}";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Endpoint>(sql, new { ServiceId = serviceId });
    }

    public async Task<IEnumerable<Endpoint>> GetAllAsync(bool enabledOnly = true)
    {
        var whereClause = enabledOnly ? "WHERE is_enabled = true" : "";
        var sql = $@"
            SELECT id, service_id, endpoint_name, http_method, relative_path,
                   upstream_path_template, is_enabled, timeout_ms, max_retries,
                   idempotent_only, request_size_limit_bytes, response_size_limit_bytes,
                   payload_expectation, headers_to_add, headers_to_remove, rate_limit_policy,
                   crypto_algorithm, key_source, iv_source, encoding, require_iv,
                   encrypt_request, encrypt_response,
                   created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".endpoints 
            {whereClause}";

        using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Endpoint>(sql);
    }
}
