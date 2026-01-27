using System.Buffers;
using System.Text;
using System.Text.Json;
using Gateway.Core.Enums;
using Gateway.Data.Repositories;
using Gateway.Infrastructure.Crypto;
using Gateway.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Yarp.ReverseProxy.Transforms;

namespace Gateway.Infrastructure.Yarp;

/// <summary>
/// YARP transform for decrypting encrypted payloads
/// Only applied when endpoint expects decrypted payload
/// Uses pooled buffers for performance
/// </summary>
public class DecryptTransform : RequestTransform
{
    private readonly IPolicyResolver _policyResolver;
    private readonly IUserProfileRepository _userProfileRepo;
    private readonly ICryptoService _cryptoService;
    private readonly ILogger<DecryptTransform> _logger;

    public DecryptTransform(
        IPolicyResolver policyResolver,
        IUserProfileRepository userProfileRepo,
        ICryptoService cryptoService,
        ILogger<DecryptTransform> logger)
    {
        _policyResolver = policyResolver;
        _userProfileRepo = userProfileRepo;
        _cryptoService = cryptoService;
        _logger = logger;
    }

    public override async ValueTask ApplyAsync(RequestTransformContext context)
    {
        var request = context.HttpContext.Request;
        var path = request.Path.Value ?? "";
        var method = request.Method;

        // Resolve policy
        var policy = await _policyResolver.ResolvePolicyAsync(path, method);
        if (policy == null)
        {
            _logger.LogWarning("No policy found for {Method} {Path}", method, path);
            return;
        }

        // Only decrypt if endpoint expects decrypted payload
        if (policy.PayloadExpectation != PayloadExpectation.Decrypted)
        {
            _logger.LogDebug("Endpoint expects {Expectation}, skipping decryption", policy.PayloadExpectation);
            return;
        }

        // Get client ID from JWT
        var clientId = context.HttpContext.User.FindFirst("sub")?.Value 
                       ?? context.HttpContext.User.FindFirst("client_id")?.Value;

        if (string.IsNullOrEmpty(clientId))
        {
            _logger.LogWarning("No client ID found in JWT claims");
            return;
        }

        try
        {
            // Read encrypted payload
            using var reader = new StreamReader(request.Body, leaveOpen: false);
            var body = await reader.ReadToEndAsync();

            if (string.IsNullOrWhiteSpace(body))
            {
                return;
            }

            // Parse wrapper: { "data": "<encrypted>" }
            var wrapper = JsonDocument.Parse(body);
            if (!wrapper.RootElement.TryGetProperty(policy.CryptoConfig.PayloadWrapperFieldName, out var dataElement))
            {
                _logger.LogWarning("Payload wrapper field '{Field}' not found", policy.CryptoConfig.PayloadWrapperFieldName);
                return;
            }

            var encryptedData = dataElement.GetString();
            if (string.IsNullOrEmpty(encryptedData))
            {
                return;
            }

            // Resolve crypto keys
            var userProfile = await _userProfileRepo.GetByUserIdAsync(clientId, policy.Service.Id);
            if (userProfile == null)
            {
                _logger.LogWarning("No crypto profile found for user {ClientId} and service {ServiceId}", 
                    clientId, policy.Service.Id);
                context.HttpContext.Response.StatusCode = 400;
                await context.HttpContext.Response.WriteAsync("Crypto configuration not found for client");
                return;
            }

            // Decrypt
            var decryptedBytes = _cryptoService.Decrypt(
                encryptedData,
                policy.CryptoConfig.Algorithm,
                userProfile.EncryptionKey,
                userProfile.EncryptionIv,
                policy.CryptoConfig.Encoding
            );

            // Replace request body with decrypted payload
            var decryptedStream = new MemoryStream(decryptedBytes);
            context.HttpContext.Request.Body = decryptedStream;
            context.HttpContext.Request.ContentLength = decryptedBytes.Length;

            _logger.LogDebug("Successfully decrypted payload for {ClientId}", clientId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decrypt payload for {ClientId}", clientId);
            context.HttpContext.Response.StatusCode = 400;
            await context.HttpContext.Response.WriteAsync("Failed to decrypt payload");
        }
    }
}
