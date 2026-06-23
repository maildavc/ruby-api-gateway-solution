using Gateway.Core.Entities;

namespace Gateway.Data.Repositories;

public interface IServiceRepository
{
    Task<Service?> GetByIdAsync(Guid id);
    Task<Service?> GetByBasePathAsync(string basePath);
    Task<IEnumerable<Service>> GetAllAsync(bool enabledOnly = true);
    Task<IEnumerable<Service>> GetByProductIdAsync(Guid productId, bool enabledOnly = true);
    Task<IEnumerable<ServiceDestination>> GetDestinationsAsync(Guid serviceId);
    Task UpdateDestinationHealthAsync(Guid destinationId, string healthStatus);
}
