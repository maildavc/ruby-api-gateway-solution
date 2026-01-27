using System.Buffers;
using System.Security.Cryptography;
using Gateway.Core.Enums;
using Microsoft.Extensions.Logging;

namespace Gateway.Infrastructure.Crypto;

/// <summary>
/// High-performance crypto service using pooled buffers to minimize allocations
/// Supports AES-256-GCM and AES-256-CBC with HMAC
/// </summary>
public class CryptoService : ICryptoService
{
    private readonly ILogger<CryptoService> _logger;
    private const int MaxPayloadSize = 10 * 1024 * 1024; // 10MB safety limit

    public CryptoService(ILogger<CryptoService> logger)
    {
        _logger = logger;
    }

    public byte[] Decrypt(string encryptedData, CryptoAlgorithm algorithm, string key, string? iv, Encoding encoding)
    {
        if (algorithm == CryptoAlgorithm.NONE)
        {
            return System.Text.Encoding.UTF8.GetBytes(encryptedData);
        }

        var keyBytes = DecodeKey(key, encoding);
        var ivBytes = iv != null ? DecodeIv(iv, encoding) : null;
        var cipherBytes = DecodeData(encryptedData, encoding);

        if (cipherBytes.Length > MaxPayloadSize)
        {
            throw new InvalidOperationException($"Encrypted payload exceeds maximum size of {MaxPayloadSize} bytes");
        }

        return algorithm switch
        {
            CryptoAlgorithm.AES_256_GCM => DecryptAesGcm(cipherBytes, keyBytes, ivBytes!),
            CryptoAlgorithm.AES_256_CBC_HMAC => DecryptAesCbcHmac(cipherBytes, keyBytes, ivBytes!),
            _ => throw new NotSupportedException($"Algorithm {algorithm} not supported")
        };
    }

    public string Encrypt(byte[] plainData, CryptoAlgorithm algorithm, string key, string? iv, Encoding encoding)
    {
        if (algorithm == CryptoAlgorithm.NONE)
        {
            return System.Text.Encoding.UTF8.GetString(plainData);
        }

        var keyBytes = DecodeKey(key, encoding);
        var ivBytes = iv != null ? DecodeIv(iv, encoding) : null;

        if (plainData.Length > MaxPayloadSize)
        {
            throw new InvalidOperationException($"Plain payload exceeds maximum size of {MaxPayloadSize} bytes");
        }

        var cipherBytes = algorithm switch
        {
            CryptoAlgorithm.AES_256_GCM => EncryptAesGcm(plainData, keyBytes, ivBytes!),
            CryptoAlgorithm.AES_256_CBC_HMAC => EncryptAesCbcHmac(plainData, keyBytes, ivBytes!),
            _ => throw new NotSupportedException($"Algorithm {algorithm} not supported")
        };

        return EncodeData(cipherBytes, encoding);
    }

    public byte[] DecodeKey(string key, Encoding encoding)
    {
        return encoding switch
        {
            Encoding.Base64 => Convert.FromBase64String(key),
            Encoding.Hex => Convert.FromHexString(key),
            _ => throw new NotSupportedException($"Encoding {encoding} not supported")
        };
    }

    public byte[] DecodeIv(string? iv, Encoding encoding)
    {
        if (string.IsNullOrEmpty(iv))
        {
            throw new ArgumentException("IV is required but not provided", nameof(iv));
        }

        return encoding switch
        {
            Encoding.Base64 => Convert.FromBase64String(iv),
            Encoding.Hex => Convert.FromHexString(iv),
            _ => throw new NotSupportedException($"Encoding {encoding} not supported")
        };
    }

    private byte[] DecodeData(string data, Encoding encoding)
    {
        return encoding switch
        {
            Encoding.Base64 => Convert.FromBase64String(data),
            Encoding.Hex => Convert.FromHexString(data),
            _ => throw new NotSupportedException($"Encoding {encoding} not supported")
        };
    }

    private string EncodeData(byte[] data, Encoding encoding)
    {
        return encoding switch
        {
            Encoding.Base64 => Convert.ToBase64String(data),
            Encoding.Hex => Convert.ToHexString(data),
            _ => throw new NotSupportedException($"Encoding {encoding} not supported")
        };
    }

    private byte[] DecryptAesGcm(byte[] ciphertext, byte[] key, byte[] nonce)
    {
        // AES-GCM: last 16 bytes are tag
        if (ciphertext.Length < 16)
        {
            throw new CryptographicException("Ciphertext too short for AES-GCM");
        }

        var tagLength = 16;
        var cipherLength = ciphertext.Length - tagLength;
        
        var tag = ciphertext[cipherLength..];
        var cipher = ciphertext[..cipherLength];
        
        // Use ArrayPool to minimize allocations
        var plaintext = ArrayPool<byte>.Shared.Rent(cipherLength);
        try
        {
            using var aes = new AesGcm(key, tagLength);
            aes.Decrypt(nonce, cipher, tag, plaintext.AsSpan(0, cipherLength));
            
            // Copy to exact-sized array
            var result = new byte[cipherLength];
            Array.Copy(plaintext, result, cipherLength);
            return result;
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(plaintext, clearArray: true);
        }
    }

    private byte[] EncryptAesGcm(byte[] plaintext, byte[] key, byte[] nonce)
    {
        var tagLength = 16;
        var ciphertext = ArrayPool<byte>.Shared.Rent(plaintext.Length);
        var tag = ArrayPool<byte>.Shared.Rent(tagLength);
        
        try
        {
            using var aes = new AesGcm(key, tagLength);
            aes.Encrypt(nonce, plaintext, ciphertext.AsSpan(0, plaintext.Length), tag.AsSpan(0, tagLength));
            
            // Concatenate ciphertext + tag
            var result = new byte[plaintext.Length + tagLength];
            Array.Copy(ciphertext, 0, result, 0, plaintext.Length);
            Array.Copy(tag, 0, result, plaintext.Length, tagLength);
            
            return result;
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(ciphertext, clearArray: true);
            ArrayPool<byte>.Shared.Return(tag, clearArray: true);
        }
    }

    private byte[] DecryptAesCbcHmac(byte[] ciphertext, byte[] key, byte[] iv)
    {
        // Split key: first 32 bytes for AES, last 32 bytes for HMAC
        if (key.Length < 64)
        {
            throw new CryptographicException("Key must be at least 64 bytes for AES-CBC-HMAC");
        }

        var aesKey = key[..32];
        var hmacKey = key[32..64];
        
        // Last 32 bytes are HMAC
        if (ciphertext.Length < 32)
        {
            throw new CryptographicException("Ciphertext too short for HMAC verification");
        }

        var hmacLength = 32;
        var cipherLength = ciphertext.Length - hmacLength;
        var receivedHmac = ciphertext[cipherLength..];
        var cipher = ciphertext[..cipherLength];

        // Verify HMAC
        using var hmac = new HMACSHA256(hmacKey);
        var computedHmac = hmac.ComputeHash(cipher);
        
        if (!CryptographicOperations.FixedTimeEquals(receivedHmac, computedHmac))
        {
            throw new CryptographicException("HMAC verification failed");
        }

        // Decrypt with AES-CBC
        using var aes = Aes.Create();
        aes.Key = aesKey;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        return decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
    }

    private byte[] EncryptAesCbcHmac(byte[] plaintext, byte[] key, byte[] iv)
    {
        if (key.Length < 64)
        {
            throw new CryptographicException("Key must be at least 64 bytes for AES-CBC-HMAC");
        }

        var aesKey = key[..32];
        var hmacKey = key[32..64];

        // Encrypt with AES-CBC
        using var aes = Aes.Create();
        aes.Key = aesKey;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        byte[] ciphertext;
        using (var encryptor = aes.CreateEncryptor())
        {
            ciphertext = encryptor.TransformFinalBlock(plaintext, 0, plaintext.Length);
        }

        // Compute HMAC over ciphertext
        using var hmac = new HMACSHA256(hmacKey);
        var hmacValue = hmac.ComputeHash(ciphertext);

        // Concatenate ciphertext + HMAC
        var result = new byte[ciphertext.Length + hmacValue.Length];
        Array.Copy(ciphertext, 0, result, 0, ciphertext.Length);
        Array.Copy(hmacValue, 0, result, ciphertext.Length, hmacValue.Length);

        return result;
    }
}
