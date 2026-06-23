using Microsoft.AspNetCore.Builder;

namespace Gateway.Middleware.Api.Endpoints;

public static class AdminManagementEndpoints
{
    public static IEndpointRouteBuilder MapAdminManagementEndpoints(this IEndpointRouteBuilder app, string postgresConnection, bool requireAuthorization)
    {
        var adminManagement = app.MapGroup("/admin/management");

        if (requireAuthorization)
        {
            adminManagement.RequireAuthorization();
        }

        adminManagement
            .MapProductEndpoints(postgresConnection)
            .MapServiceEndpoints(postgresConnection)
            .MapServiceDestinationEndpoints(postgresConnection)
            .MapEndpointsEndpoints(postgresConnection)
            .MapClientEndpoints(postgresConnection)
            .MapClientPermissionEndpoints(postgresConnection)
            .MapUserProfileEndpoints(postgresConnection)
            .MapTenantEndpoints(postgresConnection)
            .MapOrgClientEndpoints(postgresConnection)
            .MapOrgEndpointRequestEndpoints(postgresConnection)
            .MapOrgEndpointApprovalEndpoints(postgresConnection);

        return app;
    }
}
