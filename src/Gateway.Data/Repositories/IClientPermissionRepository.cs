using Gateway.Core.Entities;

namespace Gateway.Data.Repositories;

public interface IClientPermissionRepository
{
    Task<IEnumerable<ClientPermission>> GetByClientIdAsync(Guid clientId);
    Task<bool> HasPermissionAsync(Guid clientId, Guid endpointId);
    Task<IEnumerable<Guid>> GetAuthorizedEndpointIdsAsync(Guid clientId);
}
