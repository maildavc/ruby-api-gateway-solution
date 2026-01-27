using System.Diagnostics;
using Gateway.Data.Repositories;
using Gateway.Infrastructure.BackgroundServices;
using Gateway.Infrastructure.Caching;
using Gateway.Infrastructure.Crypto;
using Gateway.Infrastructure.Events;
using Gateway.Infrastructure.Middleware;
using Gateway.Infrastructure.Services;
using Gateway.Infrastructure.Yarp;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// ===== Logging with Serilog =====
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "ApiGateway")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// ===== Configuration =====
var postgresConnection = builder.Configuration.GetConnectionString("PostgreSQL")!;
var redisConnection = builder.Configuration.GetConnectionString("Redis")!;
var kafkaBootstrap = builder.Configuration.GetValue<string>("Kafka:BootstrapServers")!;

// ===== Data Access Layer (Dapper) =====
builder.Services.AddSingleton<IProductRepository>(sp => 
    new ProductRepository(postgresConnection, sp.GetRequiredService<ILogger<ProductRepository>>()));
builder.Services.AddSingleton<IServiceRepository>(sp => 
    new ServiceRepository(postgresConnection, sp.GetRequiredService<ILogger<ServiceRepository>>()));
builder.Services.AddSingleton<IEndpointRepository>(sp => 
    new EndpointRepository(postgresConnection, sp.GetRequiredService<ILogger<EndpointRepository>>()));
builder.Services.AddSingleton<IClientRepository>(sp => 
    new ClientRepository(postgresConnection, sp.GetRequiredService<ILogger<ClientRepository>>()));
builder.Services.AddSingleton<IClientPermissionRepository>(sp => 
    new ClientPermissionRepository(postgresConnection, sp.GetRequiredService<ILogger<ClientPermissionRepository>>()));
builder.Services.AddSingleton<IUserProfileRepository>(sp => 
    new UserProfileRepository(postgresConnection, sp.GetRequiredService<ILogger<UserProfileRepository>>()));

// ===== Redis/ValKey Cache =====
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = ConfigurationOptions.Parse(redisConnection);
    configuration.AbortOnConnectFail = false;
    configuration.ConnectTimeout = 5000;
    configuration.SyncTimeout = 5000;
    return ConnectionMultiplexer.Connect(configuration);
});

builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1000; // Limit L1 cache size
    options.CompactionPercentage = 0.25;
});

builder.Services.AddSingleton<IPolicyCache, PolicyCache>();

// ===== Infrastructure Services =====
builder.Services.AddSingleton<ICryptoService, CryptoService>();
builder.Services.AddSingleton<IPolicyResolver, PolicyResolver>();
builder.Services.AddSingleton<IEventProducer>(sp => 
    new KafkaEventProducer(kafkaBootstrap, sp.GetRequiredService<ILogger<KafkaEventProducer>>()));

// ===== YARP Reverse Proxy =====
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// ===== JWT Authentication =====
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Jwt:Authority"];
        options.Audience = builder.Configuration["Jwt:Audience"];
        options.RequireHttpsMetadata = builder.Configuration.GetValue<bool>("Jwt:RequireHttpsMetadata");
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = builder.Configuration.GetValue<bool>("Jwt:ValidateIssuer"),
            ValidateAudience = builder.Configuration.GetValue<bool>("Jwt:ValidateAudience"),
            ValidateLifetime = builder.Configuration.GetValue<bool>("Jwt:ValidateLifetime"),
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
        
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogWarning("JWT authentication failed: {Exception}", context.Exception.Message);
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ===== OpenTelemetry =====
var serviceName = builder.Configuration["OpenTelemetry:ServiceName"] ?? "ApiGateway";
var serviceVersion = builder.Configuration["OpenTelemetry:ServiceVersion"] ?? "1.0.0";

builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .ConfigureResource(resource => resource
                .AddService(serviceName, serviceVersion: serviceVersion))
            .AddAspNetCoreInstrumentation(options =>
            {
                options.RecordException = true;
                options.Filter = httpContext =>
                {
                    // Don't trace health checks
                    return !httpContext.Request.Path.StartsWithSegments("/health");
                };
            })
            .AddHttpClientInstrumentation()
            .AddSource("Gateway.*")
            .AddConsoleExporter();
    })
    .WithMetrics(meterProviderBuilder =>
    {
        meterProviderBuilder
            .ConfigureResource(resource => resource
                .AddService(serviceName, serviceVersion: serviceVersion))
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddPrometheusExporter();
    });

// ===== Background Services =====
builder.Services.AddHostedService<PolicyRefreshService>();

// ===== Health Checks =====
builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

var app = builder.Build();

// ===== Middleware Pipeline =====
app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("ClientId", httpContext.User.FindFirst("sub")?.Value ?? "anonymous");
        diagnosticContext.Set("CorrelationId", httpContext.TraceIdentifier);
        diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
    };
});

// Add correlation ID to all responses
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Correlation-Id"] = Activity.Current?.Id ?? context.TraceIdentifier;
        return Task.CompletedTask;
    });
    await next();
});

app.UseAuthentication();
app.UseAuthorization();

// Custom gateway authorization middleware
app.UseMiddleware<GatewayAuthorizationMiddleware>();

// OpenTelemetry Prometheus metrics endpoint
app.MapPrometheusScrapingEndpoint();

// Health check endpoint
app.MapHealthChecks("/health");

// Admin endpoint to manually trigger policy refresh
app.MapPost("/admin/refresh-policies", async (IPolicyResolver policyResolver) =>
{
    await policyResolver.RefreshPoliciesAsync();
    return Results.Ok(new { message = "Policies refreshed successfully" });
})
.RequireAuthorization(); // Protect with JWT

// YARP Reverse Proxy
app.MapReverseProxy(proxyPipeline =>
{
    // Add custom transforms
    proxyPipeline.Use(async (context, next) =>
    {
        // Decrypt transform is handled in middleware based on policy
        await next();
    });
});

// Start the application
Log.Information("Starting API Gateway...");
app.Run();

Log.Information("API Gateway stopped.");
Log.CloseAndFlush();
