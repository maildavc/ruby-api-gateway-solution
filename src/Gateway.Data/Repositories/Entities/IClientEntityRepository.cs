using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface IClientEntityRepository
{
    Task<IEnumerable<Client>> GetAllAsync(bool? enabledOnly = null);
    Task<Client?> GetByIdAsync(Guid id);
    Task<Client> CreateAsync(Client client);
    Task<Client?> UpdateAsync(Guid id, Client client);
    Task<bool> DisableAsync(Guid id);
}
