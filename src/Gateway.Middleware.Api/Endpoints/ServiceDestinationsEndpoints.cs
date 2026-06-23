using System.Text.Json;
using Gateway.Core.Entities.Requests;
using Gateway.Core.Entities;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class ServiceDestinationsEndpoints
{
    public static RouteGroupBuilder MapServiceDestinationEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/service-destinations", async (IServiceDestinationEntityRepository repo, Guid? serviceId) =>
        {
            if (!serviceId.HasValue)
            {
                return Results.BadRequest("serviceId is required.");
            }
            var destinations = await repo.GetByServiceIdAsync(serviceId.Value);
            return Results.Ok(destinations);
        })
        .WithTags("ServiceDestinations");

        group.MapPost("/service-destinations", async (IServiceDestinationEntityRepository repo, ServiceDestinationCreateRequest request) =>
        {
            var metadataJson = request.Metadata.HasValue ? request.Metadata.Value.GetRawText() : null;
            var created = await repo.CreateAsync(new ServiceDestination
            {
                ServiceId = request.ServiceId,
                DestinationName = request.DestinationName,
                Address = request.Address,
                Weight = request.Weight ?? 1,
                Priority = request.Priority ?? 0,
                IsEnabled = request.IsEnabled ?? true,
                Metadata = metadataJson
            });
            return Results.Created($"/admin/management/service-destinations/{created.Id}", created);
        })
        .WithTags("ServiceDestinations");

        group.MapPut("/service-destinations/{id:guid}", async (IServiceDestinationEntityRepository repo, Guid id, ServiceDestinationUpdateRequest request) =>
        {
            var metadataJson = request.Metadata.HasValue ? request.Metadata.Value.GetRawText() : null;
            var existing = await repo.GetByIdAsync(id);
            if (existing is null)
            {
                return Results.NotFound();
            }

            var updated = await repo.UpdateAsync(id, new ServiceDestination
            {
                ServiceId = request.ServiceId ?? existing.ServiceId,
                DestinationName = request.DestinationName ?? existing.DestinationName,
                Address = request.Address ?? existing.Address,
                Weight = request.Weight ?? existing.Weight,
                Priority = request.Priority ?? existing.Priority,
                IsEnabled = request.IsEnabled ?? existing.IsEnabled,
                Metadata = metadataJson ?? existing.Metadata
            });
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithTags("ServiceDestinations");

        group.MapDelete("/service-destinations/{id:guid}", async (IServiceDestinationEntityRepository repo, Guid id) =>
        {
            var disabled = await repo.DisableAsync(id);
            return disabled ? Results.NoContent() : Results.NotFound();
        })
        .WithTags("ServiceDestinations");

        return group;
    }
}
