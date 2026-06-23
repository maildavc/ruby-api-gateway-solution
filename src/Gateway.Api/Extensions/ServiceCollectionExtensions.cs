using System.Threading.RateLimiting;
using Gateway.Api.Configuration;
using Gateway.Data.Repositories;
using Gateway.Infrastructure.BackgroundServices;
using Gateway.Infrastructure.Caching;
using Gateway.Infrastructure.Crypto;
using Gateway.Infrastructure.Events;
using Gateway.Infrastructure.Services;
using Gateway.Infrastructure.Yarp;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;
using StackExchange.Redis;
using Yarp.ReverseProxy.Configuration;

namespace Gateway.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddGatewayDataAccess(this IServiceCollection services, GatewayAppConfiguration config)
    {
        services.AddSingleton<IProductRepository>(sp =>
            new ProductRepository(config.PostgresConnection, sp.GetRequiredService<ILogger<ProductRepository>>()));
        services.AddSingleton<IServiceRepository>(sp =>
            new ServiceRepository(config.PostgresConnection, sp.GetRequiredService<ILogger<ServiceRepository>>()));
        services.AddSingleton<IEndpointRepository>(sp =>
            new EndpointRepository(config.PostgresConnection, sp.GetRequiredService<ILogger<EndpointRepository>>()));
        services.AddSingleton<IClientRepository>(sp =>
            new ClientRepository(config.PostgresConnection, sp.GetRequiredService<ILogger<ClientRepository>>()));
        services.AddSingleton<IClientPermissionRepository>(sp =>
            new ClientPermissionRepository(config.PostgresConnection, sp.GetRequiredService<ILogger<ClientPermissionRepository>>()));
        services.AddSingleton<IUserProfileRepository>(sp =>
            new UserProfileRepository(config.PostgresConnection, sp.GetRequiredService<ILogger<UserProfileRepository>>()));

        return services;
    }

    public static IServiceCollection AddGatewayCaching(this IServiceCollection services, GatewayAppConfiguration config)
    {
        services.AddSingleton<IConnectionMultiplexer>(_ =>
        {
            var configuration = ConfigurationOptions.Parse(config.RedisConnection);
            configuration.AbortOnConnectFail = false;
            configuration.ConnectTimeout = 5000;
            configuration.SyncTimeout = 5000;
            return ConnectionMultiplexer.Connect(configuration);
        });

        services.AddMemoryCache(options =>
        {
            options.SizeLimit = 1000;
            options.CompactionPercentage = 0.25;
        });

        services.AddSingleton<IPolicyCache, PolicyCache>();
        return services;
    }

    public static IServiceCollection AddGatewayInfrastructure(this IServiceCollection services, GatewayAppConfiguration config)
    {
        services.AddSingleton<ICryptoService, CryptoService>();
        services.AddSingleton<PolicyResolver>();
        services.AddSingleton<IPolicyResolver>(sp => sp.GetRequiredService<PolicyResolver>());
        services.AddSingleton<IEventProducer>(sp =>
            new KafkaEventProducer(config.KafkaBootstrapServers, sp.GetRequiredService<ILogger<KafkaEventProducer>>()));

        return services;
    }

    public static IServiceCollection AddGatewayReverseProxy(this IServiceCollection services)
    {
        services.AddSingleton<DatabaseProxyConfigProvider>();
        services.AddSingleton<IProxyConfigProvider>(sp => sp.GetRequiredService<DatabaseProxyConfigProvider>());
        services.AddSingleton<DecryptTransform>();
        services.AddSingleton<HeaderTransform>();
        services.AddSingleton<EncryptResponseTransform>();
        services.AddReverseProxy()
            .AddTransforms(context =>
            {
                // HeaderTransform — adds correlation/gateway headers to outgoing proxy request
                var headerTransform = context.Services.GetRequiredService<HeaderTransform>();
                context.RequestTransforms.Add(headerTransform);

                // DecryptTransform is intentionally NOT added here.
                // It is applied inside the YARP proxy pipeline (ReverseProxyEndpoints.cs)
                // where it can safely replace HttpContext.Request.Body before forwarding.

                // EncryptResponseTransform — wraps upstream response in encrypted JSON envelope
                var encryptTransform = context.Services.GetRequiredService<EncryptResponseTransform>();
                context.ResponseTransforms.Add(encryptTransform);
            });

        return services;
    }

    public static IServiceCollection AddGatewayBackgroundServices(this IServiceCollection services)
    {
        services.AddHostedService<StartupCacheWarmupService>();
        services.AddHostedService<PolicyRefreshService>();
        return services;
    }

    /// <summary>
    /// Per-client fixed-window rate limiter (1 000 req/min by default, configurable).
    /// Falls back to remote IP for unauthenticated requests.
    /// </summary>
    public static IServiceCollection AddGatewayRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        var permitLimit = configuration.GetValue<int>("RateLimit:PermitLimit", 1000);
        var windowSeconds = configuration.GetValue<int>("RateLimit:WindowSeconds", 60);

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var partitionKey =
                    context.User.FindFirst("sub")?.Value
                    ?? context.User.FindFirst("client_id")?.Value
                    ?? context.Connection.RemoteIpAddress?.ToString()
                    ?? "anonymous";

                return RateLimitPartition.GetFixedWindowLimiter(partitionKey,
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit          = permitLimit,
                        Window               = TimeSpan.FromSeconds(windowSeconds),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit           = 0,   // no queuing — reject immediately when limit hit
                        AutoReplenishment     = true
                    });
            });
        });

        return services;
    }
}
