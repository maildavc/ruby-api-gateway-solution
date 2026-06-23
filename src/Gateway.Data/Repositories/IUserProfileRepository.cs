using Gateway.Core.Entities;

namespace Gateway.Data.Repositories;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByUserIdAsync(string userId, Guid? serviceId = null);
    Task<IEnumerable<UserProfile>> GetByUserIdAllServicesAsync(string userId);
}
