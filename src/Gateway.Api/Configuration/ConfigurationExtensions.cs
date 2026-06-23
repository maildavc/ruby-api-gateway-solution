using Dapper;
using Npgsql;

namespace Gateway.Api.Configuration;

public static class ConfigurationExtensions
{
    public static GatewayAppConfiguration AddGatewayConfiguration(this WebApplicationBuilder builder)
    {
        DefaultTypeMap.MatchNamesWithUnderscores = true;

        var postgresConnection = builder.Configuration.GetConnectionString("PostgreSQL");
        if (string.IsNullOrWhiteSpace(postgresConnection))
        {
            throw new InvalidOperationException("PostgreSQL connection string is missing.");
        }

        var connectionBuilder = new NpgsqlConnectionStringBuilder(postgresConnection);
        if (string.IsNullOrWhiteSpace(connectionBuilder.SearchPath))
        {
            connectionBuilder.SearchPath = "\"SeaBaasAPIGateway-Core\"";
        }

        postgresConnection = connectionBuilder.ConnectionString;

        var redisConnection = builder.Configuration.GetConnectionString("Redis");
        if (string.IsNullOrWhiteSpace(redisConnection))
        {
            throw new InvalidOperationException("Redis connection string is missing.");
        }

        var kafkaBootstrap = builder.Configuration.GetValue<string>("Kafka:BootstrapServers");
        if (string.IsNullOrWhiteSpace(kafkaBootstrap))
        {
            throw new InvalidOperationException("Kafka:BootstrapServers is missing.");
        }

        var serviceName = builder.Configuration["OpenTelemetry:ServiceName"] ?? "SeaBaasAPIGateway";
        var serviceVersion = builder.Configuration["OpenTelemetry:ServiceVersion"] ?? "1.0.0";

        var appConfig = new GatewayAppConfiguration
        {
            PostgresConnection = postgresConnection,
            RedisConnection = redisConnection,
            KafkaBootstrapServers = kafkaBootstrap,
            OpenTelemetryServiceName = serviceName,
            OpenTelemetryServiceVersion = serviceVersion
        };

        builder.Services.AddSingleton(appConfig);
        return appConfig;
    }
}
