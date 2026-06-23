namespace Gateway.Core.Entities.Requests;

public record ClientPermissionCreateRequest(Guid ClientId, Guid EndpointId, bool? IsEnabled, DateTime? ExpiresAt);
