using Dapper;
using FluentValidation;
using FluentValidation.AspNetCore;
using Gateway.Data.Repositories.Entities;
using Gateway.Middleware.Api.Endpoints;
using Gateway.Middleware.Api.Validation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

// Configure Dapper to map snake_case PostgreSQL columns to PascalCase C# properties
DefaultTypeMap.MatchNamesWithUnderscores = true;

var builder = WebApplication.CreateBuilder(args);

var postgresConnection = builder.Configuration.GetConnectionString("PostgreSQL")!;
var connectionBuilder = new NpgsqlConnectionStringBuilder(postgresConnection);
if (string.IsNullOrWhiteSpace(connectionBuilder.SearchPath))
{
	connectionBuilder.SearchPath = "\"SeaBaasAPIGateway-Core\"";
}
postgresConnection = connectionBuilder.ConnectionString;

// ===== Authentication/Authorization =====
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		var authority = builder.Configuration["Jwt:Authority"];
		var audience = builder.Configuration["Jwt:Audience"];
		var secretKey = builder.Configuration["Jwt:SecretKey"];

		options.RequireHttpsMetadata = builder.Configuration.GetValue<bool>("Jwt:RequireHttpsMetadata", true);

		if (!string.IsNullOrWhiteSpace(authority))
		{
			options.Authority = authority;
		}

		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateIssuer = builder.Configuration.GetValue<bool>("Jwt:ValidateIssuer", true),
			ValidateAudience = builder.Configuration.GetValue<bool>("Jwt:ValidateAudience", true),
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			ValidIssuer = authority,
			ValidAudience = audience,
			ClockSkew = TimeSpan.FromMinutes(1),
			IssuerSigningKey = string.IsNullOrWhiteSpace(secretKey)
				? null
				: new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secretKey))
		};
	});

builder.Services.AddAuthorization();

// ===== Validation =====
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<ProductCreateRequestValidator>();

// ===== Entity Repositories =====
builder.Services.AddSingleton<IProductEntityRepository>(sp =>
	new ProductEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<ProductEntityRepository>>()));
builder.Services.AddSingleton<IServiceEntityRepository>(sp =>
	new ServiceEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<ServiceEntityRepository>>()));
builder.Services.AddSingleton<IEndpointEntityRepository>(sp =>
	new EndpointEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<EndpointEntityRepository>>()));
builder.Services.AddSingleton<IClientEntityRepository>(sp =>
	new ClientEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<ClientEntityRepository>>()));
builder.Services.AddSingleton<IClientPermissionEntityRepository>(sp =>
	new ClientPermissionEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<ClientPermissionEntityRepository>>()));
builder.Services.AddSingleton<IUserProfileEntityRepository>(sp =>
	new UserProfileEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<UserProfileEntityRepository>>()));
builder.Services.AddSingleton<IServiceDestinationEntityRepository>(sp =>
	new ServiceDestinationEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<ServiceDestinationEntityRepository>>()));
builder.Services.AddSingleton<ITenantEntityRepository>(sp =>
	new TenantEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<TenantEntityRepository>>()));
builder.Services.AddSingleton<IOrgClientEntityRepository>(sp =>
	new OrgClientEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<OrgClientEntityRepository>>()));
builder.Services.AddSingleton<IOrgEndpointRequestEntityRepository>(sp =>
	new OrgEndpointRequestEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<OrgEndpointRequestEntityRepository>>()));
builder.Services.AddSingleton<IOrgEndpointApprovalEntityRepository>(sp =>
	new OrgEndpointApprovalEntityRepository(postgresConnection, sp.GetRequiredService<ILogger<OrgEndpointApprovalEntityRepository>>()));

// ===== Health Checks =====
builder.Services.AddHealthChecks()
	.AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

// ===== CORS (Admin & Developer Portals) =====
builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowPortals", policy =>
		policy.WithOrigins(
			"http://localhost:3000", "http://127.0.0.1:3000",
			"http://localhost:3001", "http://127.0.0.1:3001",
			"http://localhost:3002", "http://127.0.0.1:3002",
			"http://localhost:3030", "http://127.0.0.1:3030")
			.AllowAnyHeader()
			.AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
	app.UseCors("AllowPortals");
}

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");

// Public endpoints (no auth required)
app.MapPublicEndpoints(postgresConnection);

// Admin management endpoints
var requireAdminAuth = !app.Environment.IsDevelopment();
app.MapAdminManagementEndpoints(postgresConnection, requireAdminAuth);

app.Run();
