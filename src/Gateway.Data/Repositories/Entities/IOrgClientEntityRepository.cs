using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface IOrgClientEntityRepository
{
    Task<IEnumerable<Client>> GetClientsByTenantAsync(Guid tenantId);
    Task<OrgClient> CreateAsync(OrgClient orgClient);
    Task<bool> DeleteAsync(Guid tenantId, Guid clientId);
}
