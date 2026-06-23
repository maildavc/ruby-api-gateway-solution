using Gateway.Api.Mapper;
using Serilog;

namespace Gateway.Api.Log;

public static class LoggingExtensions
{
    public static WebApplicationBuilder ConfigureGatewayLogging(this WebApplicationBuilder builder)
    {
        Serilog.Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "ApiGateway")
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
            .CreateLogger();

        builder.Host.UseSerilog();
        return builder;
    }

    public static WebApplication UseGatewaySerilogRequestLogging(this WebApplication app)
    {
        app.UseSerilogRequestLogging(options =>
        {
            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
            {
                diagnosticContext.Set("ClientId", ClaimsMapper.GetClientId(httpContext.User));
                diagnosticContext.Set("CorrelationId", httpContext.TraceIdentifier);
                diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
            };
        });

        return app;
    }
}
