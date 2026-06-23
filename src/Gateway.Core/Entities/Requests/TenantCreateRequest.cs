namespace Gateway.Core.Entities.Requests;

public class TenantCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Domain { get; set; }
}
