namespace Gateway.Core.Entities.Requests;

public record ProductUpdateRequest(string? Name, string? Description, string? OwnerTeam, bool? IsEnabled);
