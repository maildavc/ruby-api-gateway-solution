using Gateway.Core.Entities;
using Gateway.Core.Entities.Requests;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class TenantsEndpoints
{
    public static RouteGroupBuilder MapTenantEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/tenants", async (ITenantEntityRepository repo) =>
        {
            var tenants = await repo.GetAllAsync();
            return Results.Ok(tenants);
        })
        .WithTags("Tenants");

        group.MapGet("/tenants/{id:guid}", async (ITenantEntityRepository repo, Guid id) =>
        {
            var tenant = await repo.GetByIdAsync(id);
            return tenant is null ? Results.NotFound() : Results.Ok(tenant);
        })
        .WithTags("Tenants");

        group.MapPost("/tenants", async (ITenantEntityRepository repo, TenantCreateRequest request) =>
        {
            var created = await repo.CreateAsync(new Tenant
            {
                Name = request.Name,
                Domain = request.Domain,
                Status = "pending"
            });
            return Results.Created($"/admin/management/tenants/{created.Id}", created);
        })
        .WithTags("Tenants");

        group.MapPut("/tenants/{id:guid}/status", async (ITenantEntityRepository repo, Guid id, TenantStatusUpdateRequest request) =>
        {
            var existing = await repo.GetByIdAsync(id);
            if (existing is null)
            {
                return Results.NotFound();
            }

            var updated = await repo.UpdateStatusAsync(id, request.Status);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithTags("Tenants");

        return group;
    }
}
