namespace Gateway.Core.Entities.Requests;

public record ClientPermissionUpdateRequest(bool? IsEnabled, DateTime? ExpiresAt);
