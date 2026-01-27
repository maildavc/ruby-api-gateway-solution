using Gateway.Core.Models;

namespace Gateway.Infrastructure.Services;

/// <summary>
/// Resolves complete endpoint policy for a given request
/// Handles crypto config resolution, permission checks, etc.
/// </summary>
public interface IPolicyResolver
{
    Task<EndpointPolicy?> ResolvePolicyAsync(string path, string method);
    Task RefreshPoliciesAsync();
}
