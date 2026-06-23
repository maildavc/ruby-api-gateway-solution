using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Gateway.Api.Health;

public static class HealthCheckExtensions
{
    public static IServiceCollection AddGatewayHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy());

        return services;
    }

    public static WebApplication MapGatewayHealthChecks(this WebApplication app)
    {
        app.MapHealthChecks("/health");
        return app;
    }
}
