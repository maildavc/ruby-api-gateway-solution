namespace Gateway.Core.Entities.Requests;

public record ProductCreateRequest(string Name, string Description, string OwnerTeam, bool? IsEnabled);
