using Gateway.Core.Entities;

namespace Gateway.Data.Repositories;

public interface IClientRepository
{
    Task<Client?> GetByIdAsync(int id);
    Task<Client?> GetByClientIdAsync(string clientId);
    Task UpdateLastAccessAsync(int id);
}
