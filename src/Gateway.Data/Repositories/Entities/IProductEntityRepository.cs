using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface IProductEntityRepository
{
    Task<IEnumerable<Product>> GetAllAsync(bool? enabledOnly = null);
    Task<Product?> GetByIdAsync(Guid id);
    Task<Product> CreateAsync(Product product);
    Task<Product?> UpdateAsync(Guid id, Product product);
    Task<bool> DisableAsync(Guid id);
}
