using Gateway.Infrastructure.Services;
using Gateway.Infrastructure.Yarp;

namespace Gateway.Api.Endpoints;

public static class GatewayEndpoints
{
    public static WebApplication MapGatewayEndpoints(this WebApplication app)
    {
        app.MapPost("/admin/refresh-policies", async (IPolicyResolver policyResolver) =>
        {
            await policyResolver.RefreshPoliciesAsync();
            return Results.Ok(new { message = "Policies refreshed successfully" });
        })
        .RequireAuthorization();

        app.MapPost("/api/cache/refresh/outbound-rules", async (DatabaseProxyConfigProvider configProvider) =>
        {
            await configProvider.RefreshConfigAsync();
            return Results.Ok(new { message = "Outbound rules refreshed from database" });
        })
        .RequireAuthorization();

        return app;
    }
}
