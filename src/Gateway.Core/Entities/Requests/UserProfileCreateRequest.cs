namespace Gateway.Core.Entities.Requests;

public record UserProfileCreateRequest(string UserId, Guid? ServiceId, string EncryptionKey, string? EncryptionIv, bool? IsEnabled);
