using Gateway.Core.Entities;

namespace Gateway.Data.Repositories;

public interface IEndpointRepository
{
    Task<Endpoint?> GetByIdAsync(Guid id);
    Task<IEnumerable<Endpoint>> GetByServiceIdAsync(Guid serviceId, bool enabledOnly = true);
    Task<IEnumerable<Endpoint>> GetAllAsync(bool enabledOnly = true);
}
