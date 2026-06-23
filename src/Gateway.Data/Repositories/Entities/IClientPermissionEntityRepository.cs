using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface IClientPermissionEntityRepository
{
    Task<ClientPermission?> GetByIdAsync(Guid id);
    Task<IEnumerable<ClientPermission>> GetAllAsync(Guid? clientId = null);
    Task<ClientPermission> CreateAsync(ClientPermission permission);
    Task<ClientPermission?> UpdateAsync(Guid id, ClientPermission permission);
    Task<bool> DisableAsync(Guid id);
}
