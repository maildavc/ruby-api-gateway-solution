using Gateway.Infrastructure.Crypto;
using Gateway.Core.Enums;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Gateway.Tests;

public class CryptoServiceTests
{
    private readonly ICryptoService _cryptoService;

    public CryptoServiceTests()
    {
        _cryptoService = new CryptoService(NullLogger<CryptoService>.Instance);
    }

    [Fact]
    public void AesGcm_EncryptDecrypt_ReturnsOriginalData()
    {
        // Arrange
        var plaintext = System.Text.Encoding.UTF8.GetBytes("Hello, World!");
        var key = Convert.ToBase64String(new byte[32]); // 256-bit key
        var nonce = Convert.ToBase64String(new byte[12]); // 96-bit nonce

        // Act
        var encrypted = _cryptoService.Encrypt(plaintext, CryptoAlgorithm.AES_256_GCM, key, nonce, Encoding.Base64);
        var decrypted = _cryptoService.Decrypt(encrypted, CryptoAlgorithm.AES_256_GCM, key, nonce, Encoding.Base64);

        // Assert
        Assert.Equal(plaintext, decrypted);
    }

    [Fact]
    public void AesCbcHmac_EncryptDecrypt_ReturnsOriginalData()
    {
        // Arrange
        var plaintext = System.Text.Encoding.UTF8.GetBytes("Secure payment data");
        var key = Convert.ToBase64String(new byte[64]); // 512-bit key (32 for AES, 32 for HMAC)
        var iv = Convert.ToBase64String(new byte[16]); // 128-bit IV

        // Act
        var encrypted = _cryptoService.Encrypt(plaintext, CryptoAlgorithm.AES_256_CBC_HMAC, key, iv, Encoding.Base64);
        var decrypted = _cryptoService.Decrypt(encrypted, CryptoAlgorithm.AES_256_CBC_HMAC, key, iv, Encoding.Base64);

        // Assert
        Assert.Equal(plaintext, decrypted);
    }

    [Fact]
    public void DecodeKey_Base64_ReturnsCorrectBytes()
    {
        // Arrange
        var expectedBytes = new byte[32];
        new Random().NextBytes(expectedBytes);
        var base64Key = Convert.ToBase64String(expectedBytes);

        // Act
        var decodedBytes = _cryptoService.DecodeKey(base64Key, Encoding.Base64);

        // Assert
        Assert.Equal(expectedBytes, decodedBytes);
    }

    [Fact]
    public void Decrypt_WithWrongKey_ThrowsException()
    {
        // Arrange
        var plaintext = System.Text.Encoding.UTF8.GetBytes("Secret data");
        var correctKey = Convert.ToBase64String(new byte[32]);
        var wrongKey = Convert.ToBase64String(new byte[32]);
        var nonce = Convert.ToBase64String(new byte[12]);

        var encrypted = _cryptoService.Encrypt(plaintext, CryptoAlgorithm.AES_256_GCM, correctKey, nonce, Encoding.Base64);

        // Act & Assert
        Assert.Throws<System.Security.Cryptography.CryptographicException>(() =>
        {
            _cryptoService.Decrypt(encrypted, CryptoAlgorithm.AES_256_GCM, wrongKey, nonce, Encoding.Base64);
        });
    }
}
