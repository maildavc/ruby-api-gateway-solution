using System.Buffers;
using System.Security.Cryptography;
using Gateway.Core.Enums;
using Microsoft.Extensions.Logging;

namespace Gateway.Infrastructure.Crypto;

/// <summary>
/// High-performance crypto service using pooled buffers to minimize allocations.
///
/// Wire format (all algorithms prepend the IV/nonce so it can be randomly generated per call):
///   AES-128-CBC       → [16-byte IV][ciphertext]
///   AES-256-GCM       → [12-byte nonce][ciphertext][16-byte tag]
///   AES-256-CBC-HMAC  → [16-byte IV][ciphertext][32-byte HMAC-SHA256(IV || ciphertext)]
/// </summary>
public class CryptoService : ICryptoService
{
    private readonly ILogger<CryptoService> _logger;
    private const int MaxPayloadSize = 10 * 1024 * 1024; // 10 MB

    private const int AesGcmNonceSize = 12;
    private const int AesGcmTagSize   = 16;
    private const int AesCbcIvSize    = 16;
    private const int HmacSize        = 32;

    public CryptoService(ILogger<CryptoService> logger)
    {
        _logger = logger;
    }

    public byte[] Decrypt(string encryptedData, CryptoAlgorithm algorithm, string key, string? iv, Encoding encoding)
    {
        _logger.LogDebug("Decryption start. Algorithm={Algorithm}, Encoding={Encoding}, DataLength={Length}",
            algorithm, encoding, encryptedData.Length);

        if (algorithm == CryptoAlgorithm.NONE)
            return System.Text.Encoding.UTF8.GetBytes(encryptedData);

        var keyBytes    = DecodeKey(key, encoding);
        var cipherBytes = DecodeData(encryptedData, encoding);

        if (cipherBytes.Length > MaxPayloadSize)
            throw new InvalidOperationException($"Encrypted payload exceeds maximum size of {MaxPayloadSize} bytes");

        return algorithm switch
        {
            CryptoAlgorithm.AES_128_CBC      => DecryptAesCbc(cipherBytes, keyBytes),
            CryptoAlgorithm.AES_256_GCM      => DecryptAesGcm(cipherBytes, keyBytes),
            CryptoAlgorithm.AES_256_CBC_HMAC => DecryptAesCbcHmac(cipherBytes, keyBytes),
            _ => throw new NotSupportedException($"Algorithm {algorithm} not supported")
        };
    }

    public string Encrypt(byte[] plainData, CryptoAlgorithm algorithm, string key, string? iv, Encoding encoding)
    {
        _logger.LogDebug("Encryption start. Algorithm={Algorithm}, Encoding={Encoding}, PlainLength={Length}",
            algorithm, encoding, plainData.Length);

        if (algorithm == CryptoAlgorithm.NONE)
            return System.Text.Encoding.UTF8.GetString(plainData);

        var keyBytes = DecodeKey(key, encoding);

        if (plainData.Length > MaxPayloadSize)
            throw new InvalidOperationException($"Plain payload exceeds maximum size of {MaxPayloadSize} bytes");

        var cipherBytes = algorithm switch
        {
            CryptoAlgorithm.AES_128_CBC      => EncryptAesCbc(plainData, keyBytes),
            CryptoAlgorithm.AES_256_GCM      => EncryptAesGcm(plainData, keyBytes),
            CryptoAlgorithm.AES_256_CBC_HMAC => EncryptAesCbcHmac(plainData, keyBytes),
            _ => throw new NotSupportedException($"Algorithm {algorithm} not supported")
        };

        return EncodeData(cipherBytes, encoding);
    }

    public byte[] DecodeKey(string key, Encoding encoding) =>
        encoding switch
        {
            Encoding.Base64 => Convert.FromBase64String(key),
            Encoding.Hex    => Convert.FromHexString(key),
            _ => throw new NotSupportedException($"Encoding {encoding} not supported")
        };

    public byte[] DecodeIv(string? iv, Encoding encoding)
    {
        if (string.IsNullOrEmpty(iv))
            throw new ArgumentException("IV is required but not provided", nameof(iv));

        return encoding switch
        {
            Encoding.Base64 => Convert.FromBase64String(iv),
            Encoding.Hex    => Convert.FromHexString(iv),
            _ => throw new NotSupportedException($"Encoding {encoding} not supported")
        };
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private byte[] DecodeData(string data, Encoding encoding) =>
        encoding switch
        {
            Encoding.Base64 => Convert.FromBase64String(data),
            Encoding.Hex    => Convert.FromHexString(data),
            _ => throw new NotSupportedException($"Encoding {encoding} not supported")
        };

    private string EncodeData(byte[] data, Encoding encoding) =>
        encoding switch
        {
            Encoding.Base64 => Convert.ToBase64String(data),
            Encoding.Hex    => Convert.ToHexString(data),
            _ => throw new NotSupportedException($"Encoding {encoding} not supported")
        };

    // ── AES-256-GCM ─────────────────────────────────────────────────────────
    // Wire format: [12-byte nonce][ciphertext][16-byte tag]

    private byte[] EncryptAesGcm(byte[] plaintext, byte[] key)
    {
        var nonce     = new byte[AesGcmNonceSize];
        var cipherBuf = ArrayPool<byte>.Shared.Rent(plaintext.Length);
        var tagBuf    = ArrayPool<byte>.Shared.Rent(AesGcmTagSize);

        RandomNumberGenerator.Fill(nonce);

        try
        {
            using var aes = new AesGcm(key, AesGcmTagSize);
            aes.Encrypt(nonce, plaintext,
                        cipherBuf.AsSpan(0, plaintext.Length),
                        tagBuf.AsSpan(0, AesGcmTagSize));

            // [nonce][ciphertext][tag]
            var result = new byte[AesGcmNonceSize + plaintext.Length + AesGcmTagSize];
            nonce.CopyTo(result, 0);
            Array.Copy(cipherBuf, 0, result, AesGcmNonceSize, plaintext.Length);
            Array.Copy(tagBuf,    0, result, AesGcmNonceSize + plaintext.Length, AesGcmTagSize);
            return result;
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(cipherBuf, clearArray: true);
            ArrayPool<byte>.Shared.Return(tagBuf,    clearArray: true);
        }
    }

    private byte[] DecryptAesGcm(byte[] ciphertext, byte[] key)
    {
        var minLen = AesGcmNonceSize + AesGcmTagSize;
        if (ciphertext.Length < minLen)
            throw new CryptographicException("Ciphertext too short for AES-GCM");

        var nonce       = ciphertext[..AesGcmNonceSize];
        var tagOffset   = ciphertext.Length - AesGcmTagSize;
        var tag         = ciphertext[tagOffset..];
        var cipher      = ciphertext[AesGcmNonceSize..tagOffset];
        var plaintextBuf = ArrayPool<byte>.Shared.Rent(cipher.Length);

        try
        {
            using var aes = new AesGcm(key, AesGcmTagSize);
            aes.Decrypt(nonce, cipher, tag, plaintextBuf.AsSpan(0, cipher.Length));

            var result = new byte[cipher.Length];
            Array.Copy(plaintextBuf, result, cipher.Length);
            return result;
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(plaintextBuf, clearArray: true);
        }
    }

    // ── AES-128-CBC ──────────────────────────────────────────────────────────
    // Wire format: [16-byte IV][ciphertext]

    private byte[] EncryptAesCbc(byte[] plaintext, byte[] key)
    {
        var iv = new byte[AesCbcIvSize];
        RandomNumberGenerator.Fill(iv);

        using var aes = Aes.Create();
        aes.Key     = key;
        aes.IV      = iv;
        aes.Mode    = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var encryptor = aes.CreateEncryptor();
        var ciphertext = encryptor.TransformFinalBlock(plaintext, 0, plaintext.Length);

        // [IV][ciphertext]
        var result = new byte[AesCbcIvSize + ciphertext.Length];
        iv.CopyTo(result, 0);
        Array.Copy(ciphertext, 0, result, AesCbcIvSize, ciphertext.Length);
        return result;
    }

    private byte[] DecryptAesCbc(byte[] ciphertext, byte[] key)
    {
        if (ciphertext.Length < AesCbcIvSize)
            throw new CryptographicException("Ciphertext too short for AES-CBC");

        var iv     = ciphertext[..AesCbcIvSize];
        var cipher = ciphertext[AesCbcIvSize..];

        using var aes = Aes.Create();
        aes.Key     = key;
        aes.IV      = iv;
        aes.Mode    = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        return decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
    }

    // ── AES-256-CBC-HMAC ─────────────────────────────────────────────────────
    // Wire format: [16-byte IV][ciphertext][32-byte HMAC-SHA256(IV || ciphertext)]
    // Key split: first 32 bytes = AES key, next 32 bytes = HMAC key

    private byte[] EncryptAesCbcHmac(byte[] plaintext, byte[] key)
    {
        if (key.Length < 64)
            throw new CryptographicException("Key must be at least 64 bytes for AES-256-CBC-HMAC");

        var aesKey  = key[..32];
        var hmacKey = key[32..64];

        var iv = new byte[AesCbcIvSize];
        RandomNumberGenerator.Fill(iv);

        using var aes = Aes.Create();
        aes.Key     = aesKey;
        aes.IV      = iv;
        aes.Mode    = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        byte[] ciphertext;
        using (var encryptor = aes.CreateEncryptor())
            ciphertext = encryptor.TransformFinalBlock(plaintext, 0, plaintext.Length);

        // HMAC covers IV + ciphertext to prevent IV tampering
        using var hmac = new HMACSHA256(hmacKey);
        hmac.TransformBlock(iv,         0, iv.Length,         null, 0);
        hmac.TransformFinalBlock(ciphertext, 0, ciphertext.Length);
        var hmacValue = hmac.Hash!;

        // [IV][ciphertext][HMAC]
        var result = new byte[AesCbcIvSize + ciphertext.Length + HmacSize];
        iv.CopyTo(result, 0);
        Array.Copy(ciphertext, 0, result, AesCbcIvSize, ciphertext.Length);
        Array.Copy(hmacValue,  0, result, AesCbcIvSize + ciphertext.Length, HmacSize);
        return result;
    }

    private byte[] DecryptAesCbcHmac(byte[] ciphertext, byte[] key)
    {
        if (key.Length < 64)
            throw new CryptographicException("Key must be at least 64 bytes for AES-256-CBC-HMAC");

        var minLen = AesCbcIvSize + HmacSize;
        if (ciphertext.Length < minLen)
            throw new CryptographicException("Ciphertext too short for AES-256-CBC-HMAC");

        var aesKey  = key[..32];
        var hmacKey = key[32..64];

        var iv           = ciphertext[..AesCbcIvSize];
        var hmacOffset   = ciphertext.Length - HmacSize;
        var receivedHmac = ciphertext[hmacOffset..];
        var cipher       = ciphertext[AesCbcIvSize..hmacOffset];

        // Verify HMAC(IV || ciphertext) in constant time
        using var hmac = new HMACSHA256(hmacKey);
        hmac.TransformBlock(iv,     0, iv.Length,     null, 0);
        hmac.TransformFinalBlock(cipher, 0, cipher.Length);
        var computedHmac = hmac.Hash!;

        if (!CryptographicOperations.FixedTimeEquals(receivedHmac, computedHmac))
            throw new CryptographicException("HMAC verification failed");

        using var aes = Aes.Create();
        aes.Key     = aesKey;
        aes.IV      = iv;
        aes.Mode    = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        return decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
    }
}
