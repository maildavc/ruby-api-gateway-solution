using System.Text.Json;
using Gateway.Core.Entities.Requests;
using Gateway.Core.Entities;
using Gateway.Core.Enums;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class ServicesEndpoints
{
    public static RouteGroupBuilder MapServiceEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/services", async (IServiceEntityRepository repo, Guid? productId, bool? enabledOnly) =>
        {
            if (productId.HasValue)
            {
                var services = await repo.GetByProductIdAsync(productId.Value, enabledOnly);
                return Results.Ok(services);
            }

            var all = await repo.GetAllAsync(enabledOnly);
            return Results.Ok(all);
        })
        .WithTags("Services");

        group.MapGet("/services/{id:guid}", async (IServiceEntityRepository repo, Guid id) =>
        {
            var service = await repo.GetByIdAsync(id);
            return service is null ? Results.NotFound() : Results.Ok(service);
        })
        .WithTags("Services");

        group.MapPost("/services", async (IServiceEntityRepository repo, ServiceCreateRequest request) =>
        {
            var destinationsJson = JsonSerializer.Serialize(request.Destinations);
            var requiredScopesJson = request.RequiredScopes is null ? null : JsonSerializer.Serialize(request.RequiredScopes);
            var allowedClientsJson = request.AllowedClients is null ? null : JsonSerializer.Serialize(request.AllowedClients);
            var created = await repo.CreateAsync(new Service
            {
                ProductId = request.ProductId,
                ServiceName = request.ServiceName,
                BasePath = request.BasePath,
                Version = request.Version,
                Description = request.Description,
                OwnerTeam = request.OwnerTeam,
                IsEnabled = request.IsEnabled ?? true,
                Environment = ParseEnum(request.Environment, EnvironmentType.Dev),
                ClusterId = request.ClusterId,
                Destinations = destinationsJson,
                LoadBalancingPolicy = ParseEnum(request.LoadBalancingPolicy, LoadBalancingPolicy.RoundRobin),
                HealthCheckEnabled = request.HealthCheckEnabled ?? false,
                HealthCheckPath = request.HealthCheckPath,
                HealthCheckIntervalSeconds = request.HealthCheckIntervalSeconds ?? 30,
                SessionAffinityEnabled = request.SessionAffinityEnabled ?? false,
                SessionAffinityCookieName = request.SessionAffinityCookieName ?? "gateway_affinity",
                SessionAffinityTtlSeconds = request.SessionAffinityTtlSeconds ?? 1800,
                CircuitBreakerEnabled = request.CircuitBreakerEnabled ?? false,
                CircuitBreakerThreshold = request.CircuitBreakerThreshold ?? 5,
                CircuitBreakerDurationSeconds = request.CircuitBreakerDurationSeconds ?? 30,
                RetryEnabled = request.RetryEnabled ?? true,
                RetryCount = request.RetryCount ?? 3,
                RetryDelayMs = request.RetryDelayMs ?? 100,
                ConnectionTimeoutSeconds = request.ConnectionTimeoutSeconds ?? 30,
                RequestTimeoutSeconds = request.RequestTimeoutSeconds ?? 60,
                MaxConnectionsPerDestination = request.MaxConnectionsPerDestination ?? 100,
                PassiveHealthCheckEnabled = request.PassiveHealthCheckEnabled ?? true,
                PassiveHealthFailureThreshold = request.PassiveHealthFailureThreshold ?? 3,
                PassiveHealthReactivationSeconds = request.PassiveHealthReactivationSeconds ?? 30,
                EnableTracing = request.EnableTracing ?? true,
                EnableMetrics = request.EnableMetrics ?? true,
                LogSampling = Convert.ToDouble(request.LogSampling ?? 1.0m),
                RequiresJwt = request.RequiresJwt ?? true,
                RequiredScopes = requiredScopesJson,
                AllowedClients = allowedClientsJson,
                CacheEnabled = request.CacheEnabled ?? false,
                CacheTtlSeconds = request.CacheTtlSeconds ?? 60,
                CacheKeyTemplate = request.CacheKeyTemplate,
                EmitEvents = request.EmitEvents ?? false,
                TopicPrefix = request.TopicPrefix,
                EventSchemaVersion = request.EventSchemaVersion,
                DefaultCryptoAlgorithm = ParseEnum(request.DefaultCryptoAlgorithm, CryptoAlgorithm.AES_256_GCM),
                DefaultKeySource = ParseEnum(request.DefaultKeySource, KeySource.UserProfileKey),
                DefaultIvSource = ParseEnum(request.DefaultIvSource, IvSource.UserProfileIv),
                DefaultEncoding = ParseEnum(request.DefaultEncoding, Encoding.Base64),
                DefaultRequireIv = request.DefaultRequireIv ?? true
            });
            return Results.Created($"/admin/management/services/{created.Id}", created);
        })
        .WithTags("Services");

        group.MapPut("/services/{id:guid}", async (IServiceEntityRepository repo, Guid id, ServiceUpdateRequest request) =>
        {
            var destinationsJson = request.Destinations is null ? null : JsonSerializer.Serialize(request.Destinations);
            var requiredScopesJson = request.RequiredScopes is null ? null : JsonSerializer.Serialize(request.RequiredScopes);
            var allowedClientsJson = request.AllowedClients is null ? null : JsonSerializer.Serialize(request.AllowedClients);
            var existing = await repo.GetByIdAsync(id);
            if (existing is null)
            {
                return Results.NotFound();
            }

            var updated = await repo.UpdateAsync(id, new Service
            {
                ProductId = request.ProductId ?? existing.ProductId,
                ServiceName = request.ServiceName ?? existing.ServiceName,
                BasePath = request.BasePath ?? existing.BasePath,
                Version = request.Version ?? existing.Version,
                Description = request.Description ?? existing.Description,
                OwnerTeam = request.OwnerTeam ?? existing.OwnerTeam,
                IsEnabled = request.IsEnabled ?? existing.IsEnabled,
                Environment = request.Environment is null ? existing.Environment : ParseEnum(request.Environment, existing.Environment),
                ClusterId = request.ClusterId ?? existing.ClusterId,
                Destinations = destinationsJson ?? existing.Destinations,
                LoadBalancingPolicy = request.LoadBalancingPolicy is null ? existing.LoadBalancingPolicy : ParseEnum(request.LoadBalancingPolicy, existing.LoadBalancingPolicy),
                HealthCheckEnabled = request.HealthCheckEnabled ?? existing.HealthCheckEnabled,
                HealthCheckPath = request.HealthCheckPath ?? existing.HealthCheckPath,
                HealthCheckIntervalSeconds = request.HealthCheckIntervalSeconds ?? existing.HealthCheckIntervalSeconds,
                SessionAffinityEnabled = request.SessionAffinityEnabled ?? existing.SessionAffinityEnabled,
                SessionAffinityCookieName = request.SessionAffinityCookieName ?? existing.SessionAffinityCookieName,
                SessionAffinityTtlSeconds = request.SessionAffinityTtlSeconds ?? existing.SessionAffinityTtlSeconds,
                CircuitBreakerEnabled = request.CircuitBreakerEnabled ?? existing.CircuitBreakerEnabled,
                CircuitBreakerThreshold = request.CircuitBreakerThreshold ?? existing.CircuitBreakerThreshold,
                CircuitBreakerDurationSeconds = request.CircuitBreakerDurationSeconds ?? existing.CircuitBreakerDurationSeconds,
                RetryEnabled = request.RetryEnabled ?? existing.RetryEnabled,
                RetryCount = request.RetryCount ?? existing.RetryCount,
                RetryDelayMs = request.RetryDelayMs ?? existing.RetryDelayMs,
                ConnectionTimeoutSeconds = request.ConnectionTimeoutSeconds ?? existing.ConnectionTimeoutSeconds,
                RequestTimeoutSeconds = request.RequestTimeoutSeconds ?? existing.RequestTimeoutSeconds,
                MaxConnectionsPerDestination = request.MaxConnectionsPerDestination ?? existing.MaxConnectionsPerDestination,
                PassiveHealthCheckEnabled = request.PassiveHealthCheckEnabled ?? existing.PassiveHealthCheckEnabled,
                PassiveHealthFailureThreshold = request.PassiveHealthFailureThreshold ?? existing.PassiveHealthFailureThreshold,
                PassiveHealthReactivationSeconds = request.PassiveHealthReactivationSeconds ?? existing.PassiveHealthReactivationSeconds,
                EnableTracing = request.EnableTracing ?? existing.EnableTracing,
                EnableMetrics = request.EnableMetrics ?? existing.EnableMetrics,
                LogSampling = request.LogSampling.HasValue ? Convert.ToDouble(request.LogSampling.Value) : existing.LogSampling,
                RequiresJwt = request.RequiresJwt ?? existing.RequiresJwt,
                RequiredScopes = requiredScopesJson ?? existing.RequiredScopes,
                AllowedClients = allowedClientsJson ?? existing.AllowedClients,
                CacheEnabled = request.CacheEnabled ?? existing.CacheEnabled,
                CacheTtlSeconds = request.CacheTtlSeconds ?? existing.CacheTtlSeconds,
                CacheKeyTemplate = request.CacheKeyTemplate ?? existing.CacheKeyTemplate,
                EmitEvents = request.EmitEvents ?? existing.EmitEvents,
                TopicPrefix = request.TopicPrefix ?? existing.TopicPrefix,
                EventSchemaVersion = request.EventSchemaVersion ?? existing.EventSchemaVersion,
                DefaultCryptoAlgorithm = request.DefaultCryptoAlgorithm is null ? existing.DefaultCryptoAlgorithm : ParseEnum(request.DefaultCryptoAlgorithm, existing.DefaultCryptoAlgorithm),
                DefaultKeySource = request.DefaultKeySource is null ? existing.DefaultKeySource : ParseEnum(request.DefaultKeySource, existing.DefaultKeySource),
                DefaultIvSource = request.DefaultIvSource is null ? existing.DefaultIvSource : ParseEnum(request.DefaultIvSource, existing.DefaultIvSource),
                DefaultEncoding = request.DefaultEncoding is null ? existing.DefaultEncoding : ParseEnum(request.DefaultEncoding, existing.DefaultEncoding),
                DefaultRequireIv = request.DefaultRequireIv ?? existing.DefaultRequireIv
            });
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithTags("Services");

        group.MapDelete("/services/{id:guid}", async (IServiceEntityRepository repo, Guid id) =>
        {
            var disabled = await repo.DisableAsync(id);
            return disabled ? Results.NoContent() : Results.NotFound();
        })
        .WithTags("Services");

        return group;
    }

    private static TEnum ParseEnum<TEnum>(string? value, TEnum fallback) where TEnum : struct
    {
        return Enum.TryParse<TEnum>(value, true, out var parsed) ? parsed : fallback;
    }
}
