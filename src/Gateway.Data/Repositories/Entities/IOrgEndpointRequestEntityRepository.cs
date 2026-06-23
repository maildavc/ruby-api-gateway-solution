using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface IOrgEndpointRequestEntityRepository
{
    Task<IEnumerable<OrgEndpointRequest>> GetAllAsync(Guid? tenantId = null, string? status = null);
    Task<IEnumerable<OrgEndpointRequest>> GetByTenantAsync(Guid tenantId);
    Task<OrgEndpointRequest?> GetByIdAsync(Guid id);
    Task<OrgEndpointRequest> CreateAsync(OrgEndpointRequest request);
    Task<OrgEndpointRequest?> UpdateStatusAsync(Guid id, string status, Guid? reviewedBy);
}
