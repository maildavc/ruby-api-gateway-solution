namespace Gateway.Core.Entities;

/// <summary>
/// User-specific or client-specific crypto keys and IVs
/// </summary>
public class UserProfile
{
    public Guid Id { get; set; }
    public required string UserId { get; set; } // ClientId or user identifier
    public Guid? ServiceId { get; set; } // If null, applies globally
    public required string EncryptionKey { get; set; } // Base64 encoded key
    public string? EncryptionIv { get; set; } // Base64 encoded IV
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
