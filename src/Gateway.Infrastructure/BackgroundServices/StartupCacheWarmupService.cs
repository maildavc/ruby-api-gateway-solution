using Gateway.Infrastructure.Services;
using Gateway.Infrastructure.Yarp;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Gateway.Infrastructure.BackgroundServices;

/// <summary>
/// One-time startup service that refreshes policy cache and YARP config
/// when the Gateway.Api process starts or restarts.
/// </summary>
public class StartupCacheWarmupService : IHostedService
{
    private readonly IPolicyResolver _policyResolver;
    private readonly DatabaseProxyConfigProvider _configProvider;
    private readonly ILogger<StartupCacheWarmupService> _logger;

    public StartupCacheWarmupService(
        IPolicyResolver policyResolver,
        DatabaseProxyConfigProvider configProvider,
        ILogger<StartupCacheWarmupService> logger)
    {
        _policyResolver = policyResolver;
        _configProvider = configProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Startup cache warmup started...");

        try
        {
            await _policyResolver.RefreshPoliciesAsync();
            await _configProvider.RefreshConfigAsync();

            _logger.LogInformation("Startup cache warmup completed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Startup cache warmup failed.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
