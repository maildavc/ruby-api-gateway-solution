using Gateway.Core.Enums;

namespace Gateway.Core.Entities;

public class Endpoint
{
    public int Id { get; set; }
    public int ServiceId { get; set; }
    public required string EndpointName { get; set; }
    public required string HttpMethod { get; set; } // Comma-separated: GET,POST
    public required string RelativePath { get; set; }
    public string? UpstreamPathTemplate { get; set; }
    public bool IsEnabled { get; set; }
    public int TimeoutMs { get; set; }
    public int MaxRetries { get; set; }
    public bool IdempotentOnly { get; set; }
    public int RequestSizeLimitBytes { get; set; }
    public int ResponseSizeLimitBytes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Endpoint-specific policies
    public PayloadExpectation PayloadExpectation { get; set; }
    public string? HeadersToAdd { get; set; } // JSON object
    public string? HeadersToRemove { get; set; } // JSON array
    public string? RateLimitPolicy { get; set; } // JSON object

    // Crypto override (if null, use service default)
    public CryptoAlgorithm? CryptoAlgorithm { get; set; }
    public KeySource? KeySource { get; set; }
    public IvSource? IvSource { get; set; }
    public Enums.Encoding? Encoding { get; set; }
    public bool? RequireIv { get; set; }
}
