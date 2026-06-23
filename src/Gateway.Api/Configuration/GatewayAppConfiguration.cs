namespace Gateway.Api.Configuration;

public sealed class GatewayAppConfiguration
{
    public string PostgresConnection { get; init; } = string.Empty;
    public string RedisConnection { get; init; } = string.Empty;
    public string KafkaBootstrapServers { get; init; } = string.Empty;
    public string OpenTelemetryServiceName { get; init; } = "ApiGateway";
    public string OpenTelemetryServiceVersion { get; init; } = "1.0.0";
}
