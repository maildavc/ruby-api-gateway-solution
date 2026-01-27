using Gateway.Core.Enums;

namespace Gateway.Core.Models;

/// <summary>
/// Runtime crypto configuration resolved for a specific request
/// </summary>
public class CryptoConfig
{
    public CryptoAlgorithm Algorithm { get; set; }
    public KeySource KeySource { get; set; }
    public IvSource IvSource { get; set; }
    public Enums.Encoding Encoding { get; set; }
    public bool RequireIv { get; set; }
    public string PayloadWrapperFieldName { get; set; } = "data";

    // Resolved values
    public string? EncryptionKey { get; set; }
    public string? EncryptionIv { get; set; }
}
