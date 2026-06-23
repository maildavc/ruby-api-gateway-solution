namespace Gateway.Core.Entities.Requests;

public record ClientUpdateRequest(string? ClientId, string? ClientName, string? ClientSecret, bool? IsEnabled, string[]? AllowedIpAddresses);
