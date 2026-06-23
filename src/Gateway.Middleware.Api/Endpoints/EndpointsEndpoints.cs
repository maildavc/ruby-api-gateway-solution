using System.Text.Json;
using Gateway.Core.Entities.Requests;
using EndpointEntity = Gateway.Core.Entities.Endpoint;
using Gateway.Core.Enums;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class EndpointsEndpoints
{
    public static RouteGroupBuilder MapEndpointsEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/endpoints", async (IEndpointEntityRepository repo, Guid? serviceId, bool? enabledOnly) =>
        {
            if (serviceId.HasValue)
            {
                var endpoints = await repo.GetByServiceIdAsync(serviceId.Value, enabledOnly);
                return Results.Ok(endpoints);
            }

            var all = await repo.GetAllAsync(enabledOnly);
            return Results.Ok(all);
        })
        .WithTags("Endpoints");

        group.MapGet("/endpoints/{id:guid}", async (IEndpointEntityRepository repo, Guid id) =>
        {
            var endpoint = await repo.GetByIdAsync(id);
            return endpoint is null ? Results.NotFound() : Results.Ok(endpoint);
        })
        .WithTags("Endpoints");

        group.MapPost("/endpoints", async (IEndpointEntityRepository repo, EndpointCreateRequest request) =>
        {
            var headersToAddJson = request.HeadersToAdd.HasValue ? request.HeadersToAdd.Value.GetRawText() : null;
            var headersToRemoveJson = request.HeadersToRemove is null ? null : JsonSerializer.Serialize(request.HeadersToRemove);
            var rateLimitJson = request.RateLimitPolicy.HasValue ? request.RateLimitPolicy.Value.GetRawText() : null;
            var created = await repo.CreateAsync(new EndpointEntity
            {
                ServiceId = request.ServiceId,
                EndpointName = request.EndpointName,
                HttpMethod = request.HttpMethod,
                RelativePath = request.RelativePath,
                UpstreamPathTemplate = request.UpstreamPathTemplate,
                IsEnabled = request.IsEnabled ?? true,
                TimeoutMs = request.TimeoutMs ?? 30000,
                MaxRetries = request.MaxRetries ?? 0,
                IdempotentOnly = request.IdempotentOnly ?? true,
                RequestSizeLimitBytes = request.RequestSizeLimitBytes ?? 1048576,
                ResponseSizeLimitBytes = request.ResponseSizeLimitBytes ?? 10485760,
                PayloadExpectation = ParseEnum(request.PayloadExpectation, PayloadExpectation.Encrypted),
                HeadersToAdd = headersToAddJson,
                HeadersToRemove = headersToRemoveJson,
                RateLimitPolicy = rateLimitJson,
                CryptoAlgorithm = ParseEnumOrNull<CryptoAlgorithm>(request.CryptoAlgorithm),
                KeySource = ParseEnumOrNull<KeySource>(request.KeySource),
                IvSource = ParseEnumOrNull<IvSource>(request.IvSource),
                Encoding = ParseEnumOrNull<Encoding>(request.Encoding),
                RequireIv = request.RequireIv,
                EncryptRequest = request.EncryptRequest ?? false,
                EncryptResponse = request.EncryptResponse ?? false
            });
            return Results.Created($"/admin/management/endpoints/{created.Id}", created);
        })
        .WithTags("Endpoints");

        group.MapPut("/endpoints/{id:guid}", async (IEndpointEntityRepository repo, Guid id, EndpointUpdateRequest request) =>
        {
            var headersToAddJson = request.HeadersToAdd.HasValue ? request.HeadersToAdd.Value.GetRawText() : null;
            var headersToRemoveJson = request.HeadersToRemove is null ? null : JsonSerializer.Serialize(request.HeadersToRemove);
            var rateLimitJson = request.RateLimitPolicy.HasValue ? request.RateLimitPolicy.Value.GetRawText() : null;
            var existing = await repo.GetByIdAsync(id);
            if (existing is null)
            {
                return Results.NotFound();
            }

            var updated = await repo.UpdateAsync(id, new EndpointEntity
            {
                ServiceId = request.ServiceId ?? existing.ServiceId,
                EndpointName = request.EndpointName ?? existing.EndpointName,
                HttpMethod = request.HttpMethod ?? existing.HttpMethod,
                RelativePath = request.RelativePath ?? existing.RelativePath,
                UpstreamPathTemplate = request.UpstreamPathTemplate ?? existing.UpstreamPathTemplate,
                IsEnabled = request.IsEnabled ?? existing.IsEnabled,
                TimeoutMs = request.TimeoutMs ?? existing.TimeoutMs,
                MaxRetries = request.MaxRetries ?? existing.MaxRetries,
                IdempotentOnly = request.IdempotentOnly ?? existing.IdempotentOnly,
                RequestSizeLimitBytes = request.RequestSizeLimitBytes ?? existing.RequestSizeLimitBytes,
                ResponseSizeLimitBytes = request.ResponseSizeLimitBytes ?? existing.ResponseSizeLimitBytes,
                PayloadExpectation = request.PayloadExpectation is null ? existing.PayloadExpectation : ParseEnum(request.PayloadExpectation, existing.PayloadExpectation),
                HeadersToAdd = headersToAddJson ?? existing.HeadersToAdd,
                HeadersToRemove = headersToRemoveJson ?? existing.HeadersToRemove,
                RateLimitPolicy = rateLimitJson ?? existing.RateLimitPolicy,
                CryptoAlgorithm = request.CryptoAlgorithm is null ? existing.CryptoAlgorithm : ParseEnumOrNull<CryptoAlgorithm>(request.CryptoAlgorithm),
                KeySource = request.KeySource is null ? existing.KeySource : ParseEnumOrNull<KeySource>(request.KeySource),
                IvSource = request.IvSource is null ? existing.IvSource : ParseEnumOrNull<IvSource>(request.IvSource),
                Encoding = request.Encoding is null ? existing.Encoding : ParseEnumOrNull<Encoding>(request.Encoding),
                RequireIv = request.RequireIv ?? existing.RequireIv,
                EncryptRequest = request.EncryptRequest ?? existing.EncryptRequest,
                EncryptResponse = request.EncryptResponse ?? existing.EncryptResponse
            });
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithTags("Endpoints");

        group.MapDelete("/endpoints/{id:guid}", async (IEndpointEntityRepository repo, Guid id) =>
        {
            var disabled = await repo.DisableAsync(id);
            return disabled ? Results.NoContent() : Results.NotFound();
        })
        .WithTags("Endpoints");

        return group;
    }

    private static TEnum ParseEnum<TEnum>(string? value, TEnum fallback) where TEnum : struct
    {
        return Enum.TryParse<TEnum>(value, true, out var parsed) ? parsed : fallback;
    }

    private static TEnum? ParseEnumOrNull<TEnum>(string? value) where TEnum : struct
    {
        return Enum.TryParse<TEnum>(value, true, out var parsed) ? parsed : null;
    }
}
