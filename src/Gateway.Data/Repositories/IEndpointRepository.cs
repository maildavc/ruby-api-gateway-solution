using Gateway.Core.Entities;

namespace Gateway.Data.Repositories;

public interface IEndpointRepository
{
    Task<Endpoint?> GetByIdAsync(int id);
    Task<IEnumerable<Endpoint>> GetByServiceIdAsync(int serviceId, bool enabledOnly = true);
    Task<IEnumerable<Endpoint>> GetAllAsync(bool enabledOnly = true);
}
