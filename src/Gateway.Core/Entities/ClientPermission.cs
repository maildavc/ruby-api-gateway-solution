namespace Gateway.Core.Entities;

public class ClientPermission
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public int EndpointId { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
