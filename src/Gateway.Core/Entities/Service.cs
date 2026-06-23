using Gateway.Core.Enums;

namespace Gateway.Core.Entities;

public class Service
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
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

    // Session Affinity (Sticky Sessions)
    public bool SessionAffinityEnabled { get; set; }
    public string SessionAffinityCookieName { get; set; } = "gateway_affinity";
    public int SessionAffinityTtlSeconds { get; set; } = 1800;

    // Circuit Breaker
    public bool CircuitBreakerEnabled { get; set; }
    public int CircuitBreakerThreshold { get; set; } = 5;
    public int CircuitBreakerDurationSeconds { get; set; } = 30;

    // Retry Policy
    public bool RetryEnabled { get; set; } = true;
    public int RetryCount { get; set; } = 3;
    public int RetryDelayMs { get; set; } = 100;

    // Connection Settings
    public int ConnectionTimeoutSeconds { get; set; } = 30;
    public int RequestTimeoutSeconds { get; set; } = 60;
    public int MaxConnectionsPerDestination { get; set; } = 100;

    // Passive Health Check
    public bool PassiveHealthCheckEnabled { get; set; } = true;
    public int PassiveHealthFailureThreshold { get; set; } = 3;
    public int PassiveHealthReactivationSeconds { get; set; } = 30;

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

/// <summary>
/// Represents an individual destination for a service with weight and priority for advanced load balancing
/// </summary>
public class ServiceDestination
{
    public Guid Id { get; set; }
    public Guid ServiceId { get; set; }
    public required string DestinationName { get; set; }
    public required string Address { get; set; }
    public int Weight { get; set; } = 1;
    public int Priority { get; set; } = 0;
    public bool IsEnabled { get; set; } = true;
    public string HealthStatus { get; set; } = "Unknown";
    public DateTime? LastHealthCheck { get; set; }
    public string? Metadata { get; set; } // JSON
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
