namespace Gateway.Core.Entities.Requests;

public class OrgEndpointRequestCreateRequest
{
    public Guid EndpointId { get; set; }
    public Guid? RequestedBy { get; set; }
}
