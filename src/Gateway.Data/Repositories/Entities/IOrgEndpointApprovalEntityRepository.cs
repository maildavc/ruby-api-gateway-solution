using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface IOrgEndpointApprovalEntityRepository
{
    Task<IEnumerable<OrgEndpointApproval>> GetAllAsync(Guid? tenantId = null);
    Task<IEnumerable<OrgEndpointApproval>> GetByTenantAsync(Guid tenantId);
    Task<OrgEndpointApproval?> GetByTenantAndEndpointAsync(Guid tenantId, Guid endpointId);
    Task<OrgEndpointApproval> CreateAsync(OrgEndpointApproval approval);
    Task<OrgEndpointApproval?> UpdateAsync(Guid id, OrgEndpointApproval approval);
}
