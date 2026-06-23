using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface IEndpointEntityRepository
{
    Task<IEnumerable<Endpoint>> GetAllAsync(bool? enabledOnly = null);
    Task<IEnumerable<Endpoint>> GetByServiceIdAsync(Guid serviceId, bool? enabledOnly = null);
    Task<Endpoint?> GetByIdAsync(Guid id);
    Task<Endpoint> CreateAsync(Endpoint endpoint);
    Task<Endpoint?> UpdateAsync(Guid id, Endpoint endpoint);
    Task<bool> DisableAsync(Guid id);
}
