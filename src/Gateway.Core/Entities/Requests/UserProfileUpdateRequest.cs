namespace Gateway.Core.Entities.Requests;

public record UserProfileUpdateRequest(string? UserId, Guid? ServiceId, string? EncryptionKey, string? EncryptionIv, bool? IsEnabled);
