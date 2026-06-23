using Gateway.Core.Entities;

namespace Gateway.Data.Repositories.Entities;

public interface IUserProfileEntityRepository
{
    Task<UserProfile?> GetByIdAsync(Guid id);
    Task<IEnumerable<UserProfile>> GetAllAsync(string? userId = null, Guid? serviceId = null);
    Task<UserProfile> CreateAsync(UserProfile profile);
    Task<UserProfile?> UpdateAsync(Guid id, UserProfile profile);
    Task<bool> DisableAsync(Guid id);
}
