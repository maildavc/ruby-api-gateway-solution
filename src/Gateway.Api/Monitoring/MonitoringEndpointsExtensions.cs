namespace Gateway.Api.Monitoring;

public static class MonitoringEndpointsExtensions
{
    public static WebApplication MapMonitoringEndpoints(this WebApplication app)
    {
        app.MapPrometheusScrapingEndpoint();
        return app;
    }
}
