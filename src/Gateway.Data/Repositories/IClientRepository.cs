using Gateway.Core.Entities;

namespace Gateway.Data.Repositories;

public interface IClientRepository
{
    Task<Client?> GetByIdAsync(Guid id);
    Task<Client?> GetByClientIdAsync(string clientId);
    Task<IEnumerable<Client>> GetAllEnabledAsync();
    Task UpdateLastAccessAsync(Guid id);
}
