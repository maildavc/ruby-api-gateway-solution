using Gateway.Core.Entities;

namespace Gateway.Data.Repositories;

public interface IClientPermissionRepository
{
    Task<IEnumerable<ClientPermission>> GetByClientIdAsync(int clientId);
    Task<bool> HasPermissionAsync(int clientId, int endpointId);
    Task<IEnumerable<int>> GetAuthorizedEndpointIdsAsync(int clientId);
}
