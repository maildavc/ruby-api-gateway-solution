using System.Text;
using System.Text.Json;
using Gateway.Infrastructure.Caching;
using Gateway.Infrastructure.Crypto;
using Gateway.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Yarp.ReverseProxy.Transforms;

namespace Gateway.Infrastructure.Yarp;

/// <summary>
/// YARP response transform that encrypts upstream responses before returning them to callers.
/// Only active when the resolved endpoint policy has EncryptResponse = true.
/// Uses L1/L2 cache for user-profile lookup to avoid hitting Postgres on every response.
/// </summary>
public class EncryptResponseTransform : ResponseTransform
{
    private readonly IPolicyResolver _policyResolver;
    private readonly IPolicyCache _cache;
    private readonly ICryptoService _cryptoService;
    private readonly ILogger<EncryptResponseTransform> _logger;

    public EncryptResponseTransform(
        IPolicyResolver policyResolver,
        IPolicyCache cache,
        ICryptoService cryptoService,
        ILogger<EncryptResponseTransform> logger)
    {
        _policyResolver = policyResolver;
        _cache = cache;
        _cryptoService = cryptoService;
        _logger = logger;
    }

    public override async ValueTask ApplyAsync(ResponseTransformContext context)
    {
        var request = context.HttpContext.Request;
        var path    = request.Path.Value ?? "";
        var method  = request.Method;

        var policy = await _policyResolver.ResolvePolicyAsync(path, method);
        if (policy == null || !policy.EncryptResponse)
            return;

        // Skip encryption for upstream error responses — return errors as-is
        if (context.ProxyResponse == null || !context.ProxyResponse.IsSuccessStatusCode)
            return;

        // Client identity must come from the validated JWT only
        var clientId = context.HttpContext.User.FindFirst("sub")?.Value
                    ?? context.HttpContext.User.FindFirst("client_id")?.Value;

        if (string.IsNullOrEmpty(clientId))
        {
            _logger.LogWarning("No client ID in JWT claims — cannot encrypt response for {Path}", path);
            return;
        }

        try
        {
            // Cache-first lookup (L1 memory → L2 Redis → Postgres)
            var userProfile = await _cache.GetUserProfileAsync(clientId, policy.Service.Id);
            if (userProfile == null)
            {
                _logger.LogWarning("No crypto profile for client {ClientId} service {ServiceId}", clientId, policy.Service.Id);
                return;
            }

            context.SuppressResponseBody = true;

            var responseBody = await context.ProxyResponse!.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(responseBody))
                return;

            _logger.LogDebug("Encrypting response for client {ClientId}, algorithm={Algorithm}",
                clientId, policy.CryptoConfig.Algorithm);

            var encryptedData = _cryptoService.Encrypt(
                Encoding.UTF8.GetBytes(responseBody),
                policy.CryptoConfig.Algorithm,
                userProfile.EncryptionKey,
                userProfile.EncryptionIv,
                policy.CryptoConfig.Encoding
            );

            var wrapped = JsonSerializer.Serialize(new Dictionary<string, string>
            {
                [policy.CryptoConfig.PayloadWrapperFieldName] = encryptedData
            });

            var httpResponse = context.HttpContext.Response;
            httpResponse.ContentType   = "application/json";
            httpResponse.ContentLength = Encoding.UTF8.GetByteCount(wrapped);

            await httpResponse.WriteAsync(wrapped);

            _logger.LogDebug("Response encrypted successfully for client {ClientId}", clientId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to encrypt response for client {ClientId}", clientId);
            context.SuppressResponseBody = false;
        }
    }
}
