namespace Gateway.Core.Entities;

public class OrgEndpointRequest
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid EndpointId { get; set; }
    public string Status { get; set; } = "pending";
    public Guid? RequestedBy { get; set; }
    public Guid? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
