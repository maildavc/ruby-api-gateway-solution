namespace Gateway.Core.Entities;

public class ClientPermission
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public Guid EndpointId { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
