namespace Gateway.Core.Entities;

public class OrgEndpointApproval
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid EndpointId { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime ApprovedAt { get; set; }
    public string? AdminIpAllowlist { get; set; }
    public bool AdminIpEnforced { get; set; }
    public DateTime CreatedAt { get; set; }
}
