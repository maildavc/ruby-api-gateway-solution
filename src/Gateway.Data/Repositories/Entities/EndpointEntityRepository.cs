using Dapper;
using Gateway.Core.Entities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Gateway.Data.Repositories.Entities;

public class EndpointEntityRepository : IEndpointEntityRepository
{
    private readonly string _connectionString;
    private readonly ILogger<EndpointEntityRepository> _logger;

    public EndpointEntityRepository(string connectionString, ILogger<EndpointEntityRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<IEnumerable<Endpoint>> GetAllAsync(bool? enabledOnly = null)
    {
        var whereClause = enabledOnly == true ? "WHERE is_enabled = true" : "";
        var sql = $@"
            SELECT id, service_id, endpoint_name, http_method, relative_path,
                   upstream_path_template, is_enabled, timeout_ms, max_retries,
                   idempotent_only, request_size_limit_bytes, response_size_limit_bytes,
                   payload_expectation, headers_to_add, headers_to_remove, rate_limit_policy,
                   crypto_algorithm, key_source, iv_source, encoding, require_iv,
                   encrypt_request, encrypt_response,
                   created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".endpoints {whereClause}";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Endpoint>(sql);
    }

    public async Task<IEnumerable<Endpoint>> GetByServiceIdAsync(Guid serviceId, bool? enabledOnly = null)
    {
        var whereClause = enabledOnly == true ? "WHERE service_id = @ServiceId AND is_enabled = true" : "WHERE service_id = @ServiceId";
        var sql = $@"
            SELECT id, service_id, endpoint_name, http_method, relative_path,
                   upstream_path_template, is_enabled, timeout_ms, max_retries,
                   idempotent_only, request_size_limit_bytes, response_size_limit_bytes,
                   payload_expectation, headers_to_add, headers_to_remove, rate_limit_policy,
                   crypto_algorithm, key_source, iv_source, encoding, require_iv,
                   encrypt_request, encrypt_response,
                   created_at, updated_at
            FROM ""SeaBaasAPIGateway-Core"".endpoints {whereClause}";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryAsync<Endpoint>(sql, new { ServiceId = serviceId });
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
            FROM ""SeaBaasAPIGateway-Core"".endpoints WHERE id = @Id";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QueryFirstOrDefaultAsync<Endpoint>(sql, new { Id = id });
    }

    public async Task<Endpoint> CreateAsync(Endpoint endpoint)
    {
        const string sql = @"
            INSERT INTO ""SeaBaasAPIGateway-Core"".endpoints (
                service_id, endpoint_name, http_method, relative_path, upstream_path_template,
                is_enabled, timeout_ms, max_retries, idempotent_only, request_size_limit_bytes, response_size_limit_bytes,
                payload_expectation, headers_to_add, headers_to_remove, rate_limit_policy,
                crypto_algorithm, key_source, iv_source, encoding, require_iv,
                encrypt_request, encrypt_response
            ) VALUES (
                @ServiceId, @EndpointName, @HttpMethod, @RelativePath, @UpstreamPathTemplate,
                @IsEnabled, @TimeoutMs, @MaxRetries, @IdempotentOnly, @RequestSizeLimitBytes, @ResponseSizeLimitBytes,
                @PayloadExpectation, @HeadersToAdd::jsonb, @HeadersToRemove::jsonb, @RateLimitPolicy::jsonb,
                @CryptoAlgorithm, @KeySource, @IvSource, @Encoding, @RequireIv,
                @EncryptRequest, @EncryptResponse
            ) RETURNING *;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleAsync<Endpoint>(sql, endpoint);
    }

    public async Task<Endpoint?> UpdateAsync(Guid id, Endpoint endpoint)
    {
        const string sql = @"
            UPDATE ""SeaBaasAPIGateway-Core"".endpoints SET
                service_id = COALESCE(@ServiceId, service_id),
                endpoint_name = COALESCE(@EndpointName, endpoint_name),
                http_method = COALESCE(@HttpMethod, http_method),
                relative_path = COALESCE(@RelativePath, relative_path),
                upstream_path_template = COALESCE(@UpstreamPathTemplate, upstream_path_template),
                is_enabled = COALESCE(@IsEnabled, is_enabled),
                timeout_ms = COALESCE(@TimeoutMs, timeout_ms),
                max_retries = COALESCE(@MaxRetries, max_retries),
                idempotent_only = COALESCE(@IdempotentOnly, idempotent_only),
                request_size_limit_bytes = COALESCE(@RequestSizeLimitBytes, request_size_limit_bytes),
                response_size_limit_bytes = COALESCE(@ResponseSizeLimitBytes, response_size_limit_bytes),
                payload_expectation = COALESCE(@PayloadExpectation, payload_expectation),
                headers_to_add = COALESCE(@HeadersToAdd::jsonb, headers_to_add),
                headers_to_remove = COALESCE(@HeadersToRemove::jsonb, headers_to_remove),
                rate_limit_policy = COALESCE(@RateLimitPolicy::jsonb, rate_limit_policy),
                crypto_algorithm = COALESCE(@CryptoAlgorithm, crypto_algorithm),
                key_source = COALESCE(@KeySource, key_source),
                iv_source = COALESCE(@IvSource, iv_source),
                encoding = COALESCE(@Encoding, encoding),
                require_iv = COALESCE(@RequireIv, require_iv),
                encrypt_request = COALESCE(@EncryptRequest, encrypt_request),
                encrypt_response = COALESCE(@EncryptResponse, encrypt_response)
            WHERE id = @Id
            RETURNING *;";

        await using var connection = new NpgsqlConnection(_connectionString);
        return await connection.QuerySingleOrDefaultAsync<Endpoint>(sql, new
        {
            Id = id,
            endpoint.ServiceId,
            endpoint.EndpointName,
            endpoint.HttpMethod,
            endpoint.RelativePath,
            endpoint.UpstreamPathTemplate,
            endpoint.IsEnabled,
            endpoint.TimeoutMs,
            endpoint.MaxRetries,
            endpoint.IdempotentOnly,
            endpoint.RequestSizeLimitBytes,
            endpoint.ResponseSizeLimitBytes,
            endpoint.PayloadExpectation,
            endpoint.HeadersToAdd,
            endpoint.HeadersToRemove,
            endpoint.RateLimitPolicy,
            endpoint.CryptoAlgorithm,
            endpoint.KeySource,
            endpoint.IvSource,
            endpoint.Encoding,
            endpoint.RequireIv,
            endpoint.EncryptRequest,
            endpoint.EncryptResponse
        });
    }

    public async Task<bool> DisableAsync(Guid id)
    {
        const string sql = @"UPDATE ""SeaBaasAPIGateway-Core"".endpoints SET is_enabled = false WHERE id = @Id";
        await using var connection = new NpgsqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(sql, new { Id = id });
        return affected > 0;
    }
}
