using System.Text.Json;

namespace Gateway.Core.Entities.Requests;

public record EndpointUpdateRequest(
    Guid? ServiceId,
    string? EndpointName,
    string? HttpMethod,
    string? RelativePath,
    string? UpstreamPathTemplate,
    bool? IsEnabled,
    int? TimeoutMs,
    int? MaxRetries,
    bool? IdempotentOnly,
    int? RequestSizeLimitBytes,
    int? ResponseSizeLimitBytes,
    string? PayloadExpectation,
    JsonElement? HeadersToAdd,
    string[]? HeadersToRemove,
    JsonElement? RateLimitPolicy,
    string? CryptoAlgorithm,
    string? KeySource,
    string? IvSource,
    string? Encoding,
    bool? RequireIv,
    bool? EncryptRequest,
    bool? EncryptResponse
);
