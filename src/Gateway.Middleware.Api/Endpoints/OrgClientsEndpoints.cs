using Gateway.Core.Entities;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class OrgClientsEndpoints
{
    public static RouteGroupBuilder MapOrgClientEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/tenants/{tenantId:guid}/clients", async (IOrgClientEntityRepository repo, Guid tenantId) =>
        {
            var clients = await repo.GetClientsByTenantAsync(tenantId);
            return Results.Ok(clients);
        })
        .WithTags("Org Clients");

        group.MapPost("/tenants/{tenantId:guid}/clients", async (IOrgClientEntityRepository repo, Guid tenantId, OrgClientCreateRequest request) =>
        {
            var created = await repo.CreateAsync(new OrgClient
            {
                TenantId = tenantId,
                ClientId = request.ClientId,
                CreatedBy = request.CreatedById
            });
            return Results.Created($"/admin/management/tenants/{tenantId}/clients/{created.ClientId}", created);
        })
        .WithTags("Org Clients");

        group.MapDelete("/tenants/{tenantId:guid}/clients/{clientId:guid}", async (IOrgClientEntityRepository repo, Guid tenantId, Guid clientId) =>
        {
            var deleted = await repo.DeleteAsync(tenantId, clientId);
            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithTags("Org Clients");

        return group;
    }
}

public class OrgClientCreateRequest
{
    public Guid ClientId { get; set; }
    public Guid? CreatedById { get; set; }
}
