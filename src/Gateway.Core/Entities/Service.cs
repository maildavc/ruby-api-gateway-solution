using Gateway.Core.Enums;

namespace Gateway.Core.Entities;

public class Service
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public required string ServiceName { get; set; }
    public required string BasePath { get; set; }
    public required string Version { get; set; }
    public required string Description { get; set; }
    public required string OwnerTeam { get; set; }
    public bool IsEnabled { get; set; }
    public EnvironmentType Environment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Upstream configuration
    public required string ClusterId { get; set; }
    public required string Destinations { get; set; } // JSON array of URLs
    public LoadBalancingPolicy LoadBalancingPolicy { get; set; }
    public bool HealthCheckEnabled { get; set; }
    public string? HealthCheckPath { get; set; }
    public int HealthCheckIntervalSeconds { get; set; }

    // Observability
    public bool EnableTracing { get; set; }
    public bool EnableMetrics { get; set; }
    public double LogSampling { get; set; }

    // Security
    public bool RequiresJwt { get; set; }
    public string? RequiredScopes { get; set; } // JSON array
    public string? AllowedClients { get; set; } // JSON array

    // Caching
    public bool CacheEnabled { get; set; }
    public int CacheTtlSeconds { get; set; }
    public string? CacheKeyTemplate { get; set; }

    // Kafka Eventing
    public bool EmitEvents { get; set; }
    public string? TopicPrefix { get; set; }
    public string? EventSchemaVersion { get; set; }

    // Default Crypto Config
    public CryptoAlgorithm DefaultCryptoAlgorithm { get; set; }
    public KeySource DefaultKeySource { get; set; }
    public IvSource DefaultIvSource { get; set; }
    public Enums.Encoding DefaultEncoding { get; set; }
    public bool DefaultRequireIv { get; set; }
}
