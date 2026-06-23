using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface IServiceDestinationEntityRepository
{
    Task<ServiceDestination?> GetByIdAsync(Guid id);
    Task<IEnumerable<ServiceDestination>> GetByServiceIdAsync(Guid serviceId);
    Task<ServiceDestination> CreateAsync(ServiceDestination destination);
    Task<ServiceDestination?> UpdateAsync(Guid id, ServiceDestination destination);
    Task<bool> DisableAsync(Guid id);
}
