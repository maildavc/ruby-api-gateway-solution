namespace Gateway.Api.Middlewares;

public static class MiddlewareExtensions
{
    public static WebApplication UseCorrelationId(this WebApplication app)
    {
        app.UseMiddleware<CorrelationIdMiddleware>();
        return app;
    }
}
