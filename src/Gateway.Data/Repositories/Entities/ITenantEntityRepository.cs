using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface ITenantEntityRepository
{
    Task<IEnumerable<Tenant>> GetAllAsync();
    Task<Tenant?> GetByIdAsync(Guid id);
    Task<Tenant> CreateAsync(Tenant tenant);
    Task<Tenant?> UpdateStatusAsync(Guid id, string status);
}
