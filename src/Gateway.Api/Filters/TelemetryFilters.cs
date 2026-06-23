namespace Gateway.Api.Filters;

public static class TelemetryFilters
{
    public static bool ExcludeHealthChecks(HttpContext httpContext)
    {
        return !httpContext.Request.Path.StartsWithSegments("/health");
    }
}
