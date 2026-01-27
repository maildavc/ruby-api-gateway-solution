using Gateway.Core.Entities;

namespace Gateway.Data.Repositories;

public interface IServiceRepository
{
    Task<Service?> GetByIdAsync(int id);
    Task<Service?> GetByBasePathAsync(string basePath);
    Task<IEnumerable<Service>> GetAllAsync(bool enabledOnly = true);
    Task<IEnumerable<Service>> GetByProductIdAsync(int productId, bool enabledOnly = true);
}
