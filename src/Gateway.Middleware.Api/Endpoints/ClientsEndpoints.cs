using System.Text.Json;
using Gateway.Core.Entities.Requests;
using Gateway.Core.Entities;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class ClientsEndpoints
{
    public static RouteGroupBuilder MapClientEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/clients", async (IClientEntityRepository repo, bool? enabledOnly) =>
        {
            var clients = await repo.GetAllAsync(enabledOnly);
            return Results.Ok(clients);
        })
        .WithTags("Clients");

        group.MapGet("/clients/{id:guid}", async (IClientEntityRepository repo, Guid id) =>
        {
            var client = await repo.GetByIdAsync(id);
            return client is null ? Results.NotFound() : Results.Ok(client);
        })
        .WithTags("Clients");

        group.MapPost("/clients", async (IClientEntityRepository repo, ClientCreateRequest request) =>
        {
            var allowedIpsJson = request.AllowedIpAddresses is null ? null : JsonSerializer.Serialize(request.AllowedIpAddresses);
            var created = await repo.CreateAsync(new Client
            {
                ClientId = request.ClientId,
                ClientName = request.ClientName,
                ClientSecret = request.ClientSecret,
                IsEnabled = request.IsEnabled ?? true,
                AllowedIpAddresses = allowedIpsJson
            });
            return Results.Created($"/admin/management/clients/{created.Id}", created);
        })
        .WithTags("Clients");

        group.MapPut("/clients/{id:guid}", async (IClientEntityRepository repo, Guid id, ClientUpdateRequest request) =>
        {
            var allowedIpsJson = request.AllowedIpAddresses is null ? null : JsonSerializer.Serialize(request.AllowedIpAddresses);
            var existing = await repo.GetByIdAsync(id);
            if (existing is null)
            {
                return Results.NotFound();
            }

            var updated = await repo.UpdateAsync(id, new Client
            {
                ClientId = request.ClientId ?? existing.ClientId,
                ClientName = request.ClientName ?? existing.ClientName,
                ClientSecret = request.ClientSecret ?? existing.ClientSecret,
                IsEnabled = request.IsEnabled ?? existing.IsEnabled,
                AllowedIpAddresses = allowedIpsJson ?? existing.AllowedIpAddresses
            });
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithTags("Clients");

        group.MapDelete("/clients/{id:guid}", async (IClientEntityRepository repo, Guid id) =>
        {
            var disabled = await repo.DisableAsync(id);
            return disabled ? Results.NoContent() : Results.NotFound();
        })
        .WithTags("Clients");

        return group;
    }
}
