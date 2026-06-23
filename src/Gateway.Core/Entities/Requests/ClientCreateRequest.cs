namespace Gateway.Core.Entities.Requests;

public record ClientCreateRequest(string ClientId, string ClientName, string ClientSecret, bool? IsEnabled, string[]? AllowedIpAddresses);
