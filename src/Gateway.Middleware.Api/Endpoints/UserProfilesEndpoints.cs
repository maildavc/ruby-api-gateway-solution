using Gateway.Core.Entities.Requests;
using Gateway.Core.Entities;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class UserProfilesEndpoints
{
    public static RouteGroupBuilder MapUserProfileEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/user-profiles", async (IUserProfileEntityRepository repo, string? userId, Guid? serviceId) =>
        {
            var profiles = await repo.GetAllAsync(userId, serviceId);
            return Results.Ok(profiles);
        })
        .WithTags("UserProfiles");

        group.MapPost("/user-profiles", async (IUserProfileEntityRepository repo, UserProfileCreateRequest request) =>
        {
            var created = await repo.CreateAsync(new UserProfile
            {
                UserId = request.UserId,
                ServiceId = request.ServiceId,
                EncryptionKey = request.EncryptionKey,
                EncryptionIv = request.EncryptionIv,
                IsEnabled = request.IsEnabled ?? true
            });
            return Results.Created($"/admin/management/user-profiles/{created.Id}", created);
        })
        .WithTags("UserProfiles");

        group.MapPut("/user-profiles/{id:guid}", async (IUserProfileEntityRepository repo, Guid id, UserProfileUpdateRequest request) =>
        {
            var existing = await repo.GetByIdAsync(id);
            if (existing is null)
            {
                return Results.NotFound();
            }

            var updated = await repo.UpdateAsync(id, new UserProfile
            {
                UserId = request.UserId ?? existing.UserId,
                ServiceId = request.ServiceId ?? existing.ServiceId,
                EncryptionKey = request.EncryptionKey ?? existing.EncryptionKey,
                EncryptionIv = request.EncryptionIv ?? existing.EncryptionIv,
                IsEnabled = request.IsEnabled ?? existing.IsEnabled
            });
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithTags("UserProfiles");

        group.MapDelete("/user-profiles/{id:guid}", async (IUserProfileEntityRepository repo, Guid id) =>
        {
            var disabled = await repo.DisableAsync(id);
            return disabled ? Results.NoContent() : Results.NotFound();
        })
        .WithTags("UserProfiles");

        return group;
    }
}
