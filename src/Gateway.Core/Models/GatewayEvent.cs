namespace Gateway.Core.Models;

/// <summary>
/// Kafka event for audit/telemetry
/// </summary>
public class GatewayEvent
{
    public required string CorrelationId { get; set; }
    public required string ProductName { get; set; }
    public required string ServiceName { get; set; }
    public required string EndpointName { get; set; }
    public required string ClientId { get; set; }
    public required string Method { get; set; }
    public required string Path { get; set; }
    public int UpstreamStatusCode { get; set; }
    public long LatencyMs { get; set; }
    public DateTime Timestamp { get; set; }
    public string? ErrorMessage { get; set; }
}
