using Gateway.Core.Enums;

namespace Gateway.Infrastructure.Crypto;

/// <summary>
/// Interface for encryption/decryption services
/// </summary>
public interface ICryptoService
{
    byte[] Decrypt(string encryptedData, CryptoAlgorithm algorithm, string key, string? iv, Encoding encoding);
    string Encrypt(byte[] plainData, CryptoAlgorithm algorithm, string key, string? iv, Encoding encoding);
    byte[] DecodeKey(string key, Encoding encoding);
    byte[] DecodeIv(string? iv, Encoding encoding);
}
