using Gateway.Api.Configuration;
using Gateway.Api.Filters;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace Gateway.Api.Monitoring;

public static class OpenTelemetryExtensions
{
    public static IServiceCollection AddGatewayOpenTelemetry(this IServiceCollection services, GatewayAppConfiguration config)
    {
        services.AddOpenTelemetry()
            .WithTracing(tracerProviderBuilder =>
            {
                tracerProviderBuilder
                    .ConfigureResource(resource => resource
                        .AddService(config.OpenTelemetryServiceName, serviceVersion: config.OpenTelemetryServiceVersion))
                    .AddAspNetCoreInstrumentation(options =>
                    {
                        options.RecordException = true;
                        options.Filter = TelemetryFilters.ExcludeHealthChecks;
                    })
                    .AddHttpClientInstrumentation()
                    .AddSource("Gateway.*")
                    .AddConsoleExporter();
            })
            .WithMetrics(meterProviderBuilder =>
            {
                meterProviderBuilder
                    .ConfigureResource(resource => resource
                        .AddService(config.OpenTelemetryServiceName, serviceVersion: config.OpenTelemetryServiceVersion))
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddPrometheusExporter();
            });

        return services;
    }
}
