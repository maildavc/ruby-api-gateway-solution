using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Gateway.Api.Auth;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddGatewayAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                var authority = configuration["Jwt:Authority"];
                var audience = configuration["Jwt:Audience"];
                var secretKey = configuration["Jwt:SecretKey"]; // optional symmetric key fallback

                options.RequireHttpsMetadata = configuration.GetValue<bool>("Jwt:RequireHttpsMetadata", true);

                if (!string.IsNullOrWhiteSpace(authority))
                {
                    // OIDC discovery — fetches JWKS automatically from {authority}/.well-known/openid-configuration
                    options.Authority = authority;
                }

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = configuration.GetValue<bool>("Jwt:ValidateIssuer", true),
                    ValidateAudience = configuration.GetValue<bool>("Jwt:ValidateAudience", true),
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = authority,
                    ValidAudience = audience,
                    ClockSkew = TimeSpan.FromMinutes(1),

                    // Symmetric key fallback for internal / dev environments
                    IssuerSigningKey = string.IsNullOrWhiteSpace(secretKey)
                        ? null
                        : new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
                };

                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        var loggerFactory = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>();
                        var logger = loggerFactory.CreateLogger("JwtAuthentication");
                        logger.LogWarning("JWT authentication failed: {Message}", context.Exception.Message);
                        return Task.CompletedTask;
                    }
                };
            });

        return services;
    }
}
