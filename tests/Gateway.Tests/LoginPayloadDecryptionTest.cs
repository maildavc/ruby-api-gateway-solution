using Gateway.Infrastructure.Crypto;
using Gateway.Core.Enums;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using SysEncoding = System.Text.Encoding;

namespace Gateway.Tests;

public class LoginPayloadDecryptionTest
{
    private readonly ICryptoService _cryptoService;

    public LoginPayloadDecryptionTest()
    {
        _cryptoService = new CryptoService(NullLogger<CryptoService>.Instance);
    }

    [Fact]
    public void DecryptLoginPayload_WithProvidedKeysAndIV_ReturnsCorrectJson()
    {
        // Arrange - The exact data from the user
        var encryptedData = "I2nafHFXYj0PW/HYYgd4md23/tuPR8PZmvtuZGrJMI8RQC+o22SGWJh7bpkkj6WqdPDp+Y11EmQ5sGQtJWqHl3H/v8uTC09I5GFd8tDJqJ5JCFLSZwo3iz91u8EUjPgb";
        var secretKey = "zAL7X5AVRm8l4Ifs";  // 16 bytes for AES-128
        var iv = "BE/s3V0HtpPsE+1x";         // 16 bytes
        
        // Convert key and IV to Base64 for the crypto service
        var keyBase64 = Convert.ToBase64String(SysEncoding.UTF8.GetBytes(secretKey));
        var ivBase64 = Convert.ToBase64String(SysEncoding.UTF8.GetBytes(iv));

        // Expected decrypted payload
        // Not used but shown for clarity

        // Act
        var decryptedBytes = _cryptoService.Decrypt(
            encryptedData,
            CryptoAlgorithm.AES_128_CBC,
            keyBase64,
            ivBase64,
            Encoding.Base64
        );

        var decryptedJson = SysEncoding.UTF8.GetString(decryptedBytes).Trim();

        // Assert
        Assert.Contains("oladeji.olanipekun@sterling.ng", decryptedJson);
        Assert.Contains("Password@123", decryptedJson);
        Assert.Contains("jhfjfe", decryptedJson);

        // Print for verification
        System.Diagnostics.Debug.WriteLine($"Decrypted: {decryptedJson}");
    }

    [Fact]
    public void EncryptDecrypt_AES128CBC_RoundTrip()
    {
        // Arrange
        var plaintext = SysEncoding.UTF8.GetBytes("{\"username\":\"test@example.com\",\"password\":\"Test123\"}");
        var secretKey = "zAL7X5AVRm8l4Ifs";
        var iv = "BE/s3V0HtpPsE+1x";
        
        var keyBase64 = Convert.ToBase64String(SysEncoding.UTF8.GetBytes(secretKey));
        var ivBase64 = Convert.ToBase64String(SysEncoding.UTF8.GetBytes(iv));

        // Act - Encrypt
        var encrypted = _cryptoService.Encrypt(plaintext, CryptoAlgorithm.AES_128_CBC, keyBase64, ivBase64, Encoding.Base64);
        
        // Act - Decrypt
        var decrypted = _cryptoService.Decrypt(encrypted, CryptoAlgorithm.AES_128_CBC, keyBase64, ivBase64, Encoding.Base64);

        // Assert
        Assert.Equal(plaintext, decrypted);
    }
}
