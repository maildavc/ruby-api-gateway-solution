using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface IServiceEntityRepository
{
    Task<IEnumerable<Service>> GetAllAsync(bool? enabledOnly = null);
    Task<IEnumerable<Service>> GetByProductIdAsync(Guid productId, bool? enabledOnly = null);
    Task<Service?> GetByIdAsync(Guid id);
    Task<Service> CreateAsync(Service service);
    Task<Service?> UpdateAsync(Guid id, Service service);
    Task<bool> DisableAsync(Guid id);
}
