using System.Buffers;
using System.Text;
using System.Text.Json;
using Gateway.Core.Enums;
using Gateway.Data.Repositories;
using Gateway.Infrastructure.Caching;
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
    private readonly IPolicyCache _cache;
    private readonly ICryptoService _cryptoService;
    private readonly ILogger<DecryptTransform> _logger;

    public DecryptTransform(
        IPolicyResolver policyResolver,
        IUserProfileRepository userProfileRepo,
        IPolicyCache cache,
        ICryptoService cryptoService,
        ILogger<DecryptTransform> logger)
    {
        _policyResolver = policyResolver;
        _userProfileRepo = userProfileRepo;
        _cache = cache;
        _cryptoService = cryptoService;
        _logger = logger;
    }

    public override async ValueTask ApplyAsync(RequestTransformContext context)
    {
        var request = context.HttpContext.Request;
        var path = request.Path.Value ?? "";
        var method = request.Method;

        _logger.LogDebug("DECRYPT TRANSFORM - Request: {Method} {Path}", method, path);

        // Resolve policy
        _logger.LogDebug("Step 1: Resolving policy...");
        var policy = await _policyResolver.ResolvePolicyAsync(path, method);
        if (policy == null)
        {
            _logger.LogWarning("No policy found for {Method} {Path}", method, path);
            return;
        }
        _logger.LogDebug("Policy found: Service={ServiceName}, PayloadExpectation={Expectation}", 
            policy.Service.ServiceName, policy.PayloadExpectation);

        // Only decrypt if endpoint expects decrypted payload
        if (policy.PayloadExpectation != PayloadExpectation.Decrypted)
        {
            _logger.LogDebug("Endpoint expects {Expectation}, skipping decryption", policy.PayloadExpectation);
            return;
        }

        // Client identity must come from the validated JWT only
        _logger.LogDebug("Step 2: Extracting client ID from JWT...");
        var clientId = context.HttpContext.User.FindFirst("sub")?.Value
                    ?? context.HttpContext.User.FindFirst("client_id")?.Value;

        if (string.IsNullOrEmpty(clientId))
        {
            _logger.LogWarning("No client ID in JWT claims — skipping decryption for {Path}", path);
            return;
        }
        _logger.LogDebug("Client ID: {ClientId}", clientId);

        try
        {
            // Read encrypted payload
            _logger.LogDebug("Step 3: Reading request body...");
            using var reader = new StreamReader(request.Body, leaveOpen: false);
            var body = await reader.ReadToEndAsync();

            if (string.IsNullOrWhiteSpace(body))
            {
                _logger.LogWarning("Request body is empty");
                return;
            }
            _logger.LogDebug("Request body received (length={Length})", body.Length);

            // Parse wrapper: { "data": "<encrypted>" }
            _logger.LogDebug("Step 4: Parsing JSON wrapper (field name: '{FieldName}')...", 
                policy.CryptoConfig.PayloadWrapperFieldName);
            var wrapper = JsonDocument.Parse(body);
            if (!wrapper.RootElement.TryGetProperty(policy.CryptoConfig.PayloadWrapperFieldName, out var dataElement))
            {
                _logger.LogWarning("Payload wrapper field '{Field}' not found", policy.CryptoConfig.PayloadWrapperFieldName);
                return;
            }

            var encryptedData = dataElement.GetString();
            if (string.IsNullOrEmpty(encryptedData))
            {
                _logger.LogWarning("Encrypted data field is empty");
                return;
            }
            _logger.LogDebug("Encrypted data extracted (length={Length})", encryptedData.Length);

            // Resolve crypto keys
            _logger.LogDebug("Step 5: Fetching user crypto profile...");
            var userProfile = await _cache.GetUserProfileAsync(clientId, policy.Service.Id);
            if (userProfile == null)
            {
                userProfile = await _userProfileRepo.GetByUserIdAsync(clientId, policy.Service.Id);
                if (userProfile != null)
                {
                    await _cache.SetUserProfileAsync(clientId, policy.Service.Id, userProfile, TimeSpan.FromHours(1));
                }
            }
            if (userProfile == null)
            {
                _logger.LogWarning("No crypto profile found for user {ClientId} and service {ServiceId}", 
                    clientId, policy.Service.Id);
                context.HttpContext.Response.StatusCode = 400;
                await context.HttpContext.Response.WriteAsync("Crypto configuration not found for client");
                return;
            }
            _logger.LogDebug("User profile found for {ClientId}", clientId);

            // Decrypt
            _logger.LogDebug("Step 6: Decrypting payload with CryptoService...");
            _logger.LogDebug("Crypto config - Algorithm: {Algorithm}, Encoding: {Encoding}", 
                policy.CryptoConfig.Algorithm, policy.CryptoConfig.Encoding);
            var decryptedBytes = _cryptoService.Decrypt(
                encryptedData,
                policy.CryptoConfig.Algorithm,
                userProfile.EncryptionKey,
                userProfile.EncryptionIv,
                policy.CryptoConfig.Encoding
            );

            // Replace request body with decrypted payload
            _logger.LogDebug("Step 7: Replacing request body with decrypted payload...");
            var decryptedText = System.Text.Encoding.UTF8.GetString(decryptedBytes);
            _logger.LogDebug("Decrypted payload (length={Length})", decryptedText.Length);

            var decryptedStream = new MemoryStream(decryptedBytes);
            decryptedStream.Position = 0;
            context.HttpContext.Request.Body = decryptedStream;
            context.HttpContext.Request.ContentLength = decryptedBytes.Length;
            context.HttpContext.Request.ContentType ??= "application/json";

            _logger.LogDebug("Successfully decrypted payload for {ClientId}", clientId);
            _logger.LogDebug("Step 8: Forwarding to upstream");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decrypt payload for {ClientId}", clientId);
            context.HttpContext.Response.StatusCode = 400;
            await context.HttpContext.Response.WriteAsync("Failed to decrypt payload");
        }
    }
}
