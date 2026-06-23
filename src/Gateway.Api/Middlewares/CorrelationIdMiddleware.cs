using System.Diagnostics;

namespace Gateway.Api.Middlewares;

public sealed class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["X-Correlation-Id"] = Activity.Current?.Id ?? context.TraceIdentifier;
            return Task.CompletedTask;
        });

        await _next(context);
    }
}
