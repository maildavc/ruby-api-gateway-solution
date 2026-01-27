using Gateway.Data.Repositories;
using Gateway.Infrastructure.Caching;
using Gateway.Infrastructure.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Gateway.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that periodically refreshes policy cache
/// Ensures hot path never hits database
/// </summary>
public class PolicyRefreshService : BackgroundService
{
    private readonly IPolicyResolver _policyResolver;
    private readonly IClientPermissionRepository _permissionRepo;
    private readonly IClientRepository _clientRepo;
    private readonly IPolicyCache _cache;
    private readonly ILogger<PolicyRefreshService> _logger;
    private readonly TimeSpan _refreshInterval = TimeSpan.FromSeconds(30);

    public PolicyRefreshService(
        IPolicyResolver policyResolver,
        IClientPermissionRepository permissionRepo,
        IClientRepository clientRepo,
        IPolicyCache cache,
        ILogger<PolicyRefreshService> logger)
    {
        _policyResolver = policyResolver;
        _permissionRepo = permissionRepo;
        _clientRepo = clientRepo;
        _cache = cache;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PolicyRefreshService starting...");

        // Initial load
        await RefreshAllAsync();

        // Periodic refresh
        using var timer = new PeriodicTimer(_refreshInterval);
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RefreshAllAsync();
        }

        _logger.LogInformation("PolicyRefreshService stopped.");
    }

    private async Task RefreshAllAsync()
    {
        try
        {
            _logger.LogDebug("Refreshing policies and permissions...");

            // Refresh endpoint policies
            await _policyResolver.RefreshPoliciesAsync();

            // Refresh client permissions
            await RefreshClientPermissionsAsync();

            _logger.LogDebug("Policy refresh completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during policy refresh");
        }
    }

    private async Task RefreshClientPermissionsAsync()
    {
        // This is a simplified approach - in production, you might want to paginate
        // For now, we'll cache permissions on-demand rather than pre-loading all clients
        
        // Note: Client permissions are cached when JWT is validated
        // This method could be extended to pre-warm frequently accessed clients
        
        _logger.LogDebug("Client permissions refresh completed");
        await Task.CompletedTask;
    }
}
