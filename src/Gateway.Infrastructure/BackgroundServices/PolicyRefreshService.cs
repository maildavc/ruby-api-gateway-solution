using Gateway.Data.Repositories;
using Gateway.Infrastructure.Caching;
using Gateway.Infrastructure.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Gateway.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that periodically refreshes both endpoint policies and client
/// permission caches so the hot request path never hits the database.
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

        await RefreshAllAsync();

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
            _logger.LogDebug("Starting policy and permission refresh...");

            await _policyResolver.RefreshPoliciesAsync();
            await RefreshClientPermissionsAsync();

            _logger.LogDebug("Policy and permission refresh completed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during policy refresh cycle");
        }
    }

    /// <summary>
    /// Pre-warms permission cache for every enabled client so the first request
    /// for each client never has to hit Postgres.
    /// </summary>
    private async Task RefreshClientPermissionsAsync()
    {
        IEnumerable<Gateway.Core.Entities.Client> clients;
        try
        {
            clients = await _clientRepo.GetAllEnabledAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load enabled clients for permission pre-warm");
            return;
        }

        var refreshed = 0;
        var failed = 0;

        foreach (var client in clients)
        {
            try
            {
                var endpointIds = await _permissionRepo.GetAuthorizedEndpointIdsAsync(client.Id);
                var permSet = new HashSet<Guid>(endpointIds);

                await _cache.SetClientPermissionsAsync(client.Id, permSet, TimeSpan.FromHours(1));
                await _cache.SetClientAsync(client.ClientId, client, TimeSpan.FromHours(1));

                refreshed++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to refresh permissions for client {ClientId}", client.ClientId);
                failed++;
            }
        }

        _logger.LogInformation(
            "Permission pre-warm complete: {Refreshed} clients refreshed, {Failed} failed",
            refreshed, failed);
    }
}
