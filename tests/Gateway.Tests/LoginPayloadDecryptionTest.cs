using Gateway.Infrastructure.Crypto;
using Gateway.Core.Enums;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using SysEncoding = System.Text.Encoding;

namespace Gateway.Tests;

/// <summary>
/// Tests AES-128-CBC decryption using the current wire format:
///   [16-byte IV][ciphertext]
///
/// The old format passed IV as a separate parameter; it is no longer supported.
/// Clients must prepend a randomly generated 16-byte IV to each encrypted payload.
/// </summary>
public class LoginPayloadDecryptionTest
{
    private readonly ICryptoService _cryptoService;

    public LoginPayloadDecryptionTest()
    {
        _cryptoService = new CryptoService(NullLogger<CryptoService>.Instance);
    }

    [Fact]
    public void DecryptLoginPayload_NewFormat_RoundTrip_ReturnsCorrectJson()
    {
        // Arrange
        var secretKey = "zAL7X5AVRm8l4Ifs";  // 16 bytes for AES-128
        var keyBase64 = Convert.ToBase64String(SysEncoding.UTF8.GetBytes(secretKey));

        var knownPlaintext = SysEncoding.UTF8.GetBytes(
            """{"username":"oladeji.olanipekun@sterling.ng","password":"Password@123","bank":"jhfjfe"}""");

        // Act — Encrypt with new format (random IV prepended) then decrypt
        // iv parameter is ignored in the new implementation; a fresh random IV is generated each call
        var encrypted = _cryptoService.Encrypt(knownPlaintext, CryptoAlgorithm.AES_128_CBC, keyBase64, null, Encoding.Base64);
        var decryptedBytes = _cryptoService.Decrypt(encrypted, CryptoAlgorithm.AES_128_CBC, keyBase64, null, Encoding.Base64);
        var decryptedJson = SysEncoding.UTF8.GetString(decryptedBytes).Trim();

        // Assert
        Assert.Contains("oladeji.olanipekun@sterling.ng", decryptedJson);
        Assert.Contains("Password@123", decryptedJson);
        Assert.Contains("jhfjfe", decryptedJson);
    }

    [Fact]
    public void EncryptDecrypt_AES128CBC_RoundTrip()
    {
        // Arrange
        var plaintext = SysEncoding.UTF8.GetBytes("{\"username\":\"test@example.com\",\"password\":\"Test123\"}");
        var secretKey = "zAL7X5AVRm8l4Ifs";
        var keyBase64 = Convert.ToBase64String(SysEncoding.UTF8.GetBytes(secretKey));

        // Act
        var encrypted = _cryptoService.Encrypt(plaintext, CryptoAlgorithm.AES_128_CBC, keyBase64, null, Encoding.Base64);
        var decrypted = _cryptoService.Decrypt(encrypted, CryptoAlgorithm.AES_128_CBC, keyBase64, null, Encoding.Base64);

        // Assert
        Assert.Equal(plaintext, decrypted);
    }

    [Fact]
    public void Encrypt_AES128CBC_ProducesUniqueOutputEachCall()
    {
        // Each call generates a fresh random IV, so ciphertexts must differ
        var plaintext = SysEncoding.UTF8.GetBytes("same plaintext every time");
        var keyBase64 = Convert.ToBase64String(SysEncoding.UTF8.GetBytes("zAL7X5AVRm8l4Ifs"));

        var first  = _cryptoService.Encrypt(plaintext, CryptoAlgorithm.AES_128_CBC, keyBase64, null, Encoding.Base64);
        var second = _cryptoService.Encrypt(plaintext, CryptoAlgorithm.AES_128_CBC, keyBase64, null, Encoding.Base64);

        Assert.NotEqual(first, second);
    }
}
