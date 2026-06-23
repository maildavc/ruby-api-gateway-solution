using Gateway.Api.Auth;
using Gateway.Api.Configuration;
using Gateway.Api.Endpoints;
using Gateway.Api.Extensions;
using Gateway.Api.Health;
using Gateway.Api.Log;
using Gateway.Api.Middlewares;
using Gateway.Api.Monitoring;
using Gateway.Infrastructure.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args)
    .ConfigureGatewayLogging();

var appConfig = builder.AddGatewayConfiguration();

builder.Services.AddGatewayDataAccess(appConfig);
builder.Services.AddGatewayCaching(appConfig);
builder.Services.AddGatewayInfrastructure(appConfig);
builder.Services.AddGatewayReverseProxy();
builder.Services.AddGatewayAuthentication(builder.Configuration);
builder.Services.AddAuthorization();
builder.Services.AddGatewayOpenTelemetry(appConfig);
builder.Services.AddGatewayBackgroundServices();
builder.Services.AddGatewayHealthChecks();
builder.Services.AddGatewayRateLimiting(builder.Configuration);

var app = builder.Build();

app.UseGatewaySerilogRequestLogging();
app.UseCorrelationId();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseMiddleware<GatewayAuthorizationMiddleware>();

app.MapMonitoringEndpoints();
app.MapGatewayHealthChecks();
app.MapGatewayEndpoints();
app.MapGatewayReverseProxy();

Log.Information("Starting API Gateway...");
app.Run();

Log.Information("API Gateway stopped.");
Log.CloseAndFlush();
