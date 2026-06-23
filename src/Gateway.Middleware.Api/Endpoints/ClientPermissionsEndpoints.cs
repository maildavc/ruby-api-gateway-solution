using Gateway.Core.Entities.Requests;
using Gateway.Core.Entities;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class ClientPermissionsEndpoints
{
    public static RouteGroupBuilder MapClientPermissionEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/client-permissions", async (IClientPermissionEntityRepository repo, Guid? clientId) =>
        {
            var permissions = await repo.GetAllAsync(clientId);
            return Results.Ok(permissions);
        })
        .WithTags("ClientPermissions");

        group.MapPost("/client-permissions", async (IClientPermissionEntityRepository repo, ClientPermissionCreateRequest request) =>
        {
            var created = await repo.CreateAsync(new ClientPermission
            {
                ClientId = request.ClientId,
                EndpointId = request.EndpointId,
                IsEnabled = request.IsEnabled ?? true,
                ExpiresAt = request.ExpiresAt
            });
            return Results.Created($"/admin/management/client-permissions/{created.Id}", created);
        })
        .WithTags("ClientPermissions");

        group.MapPut("/client-permissions/{id:guid}", async (IClientPermissionEntityRepository repo, Guid id, ClientPermissionUpdateRequest request) =>
        {
            var existing = await repo.GetByIdAsync(id);
            if (existing is null)
            {
                return Results.NotFound();
            }

            var updated = await repo.UpdateAsync(id, new ClientPermission
            {
                ClientId = existing.ClientId,
                EndpointId = existing.EndpointId,
                IsEnabled = request.IsEnabled ?? existing.IsEnabled,
                ExpiresAt = request.ExpiresAt ?? existing.ExpiresAt
            });
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithTags("ClientPermissions");

        group.MapDelete("/client-permissions/{id:guid}", async (IClientPermissionEntityRepository repo, Guid id) =>
        {
            var disabled = await repo.DisableAsync(id);
            return disabled ? Results.NoContent() : Results.NotFound();
        })
        .WithTags("ClientPermissions");

        return group;
    }
}
