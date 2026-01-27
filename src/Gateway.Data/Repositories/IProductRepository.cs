using Gateway.Core.Entities;

namespace Gateway.Data.Repositories;

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(int id);
    Task<Product?> GetByNameAsync(string name);
    Task<IEnumerable<Product>> GetAllAsync(bool enabledOnly = true);
}
