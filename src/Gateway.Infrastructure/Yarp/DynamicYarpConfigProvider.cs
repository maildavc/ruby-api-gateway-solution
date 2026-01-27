using Gateway.Infrastructure.Services;
using Microsoft.Extensions.Primitives;
using Yarp.ReverseProxy.Configuration;

namespace Gateway.Infrastructure.Yarp;

/// <summary>
/// Dynamic YARP configuration provider that builds routes from database
/// Integrates with PolicyResolver for hot reload
/// </summary>
public class DynamicYarpConfigProvider : IProxyConfigProvider
{
    private readonly IPolicyResolver _policyResolver;
    private volatile DynamicProxyConfig _config = new DynamicProxyConfig(
        Array.Empty<RouteConfig>(),
        Array.Empty<ClusterConfig>()
    );

    public DynamicYarpConfigProvider(IPolicyResolver policyResolver)
    {
        _policyResolver = policyResolver;
    }

    public IProxyConfig GetConfig() => _config;

    public async Task RefreshConfigAsync()
    {
        // Trigger policy refresh first
        await _policyResolver.RefreshPoliciesAsync();
        
        // Signal config change
        var oldConfig = _config;
        _config = new DynamicProxyConfig(oldConfig.Routes, oldConfig.Clusters);
    }

    private class DynamicProxyConfig : IProxyConfig
    {
        private readonly CancellationTokenSource _cts = new();

        public DynamicProxyConfig(IReadOnlyList<RouteConfig> routes, IReadOnlyList<ClusterConfig> clusters)
        {
            Routes = routes;
            Clusters = clusters;
            ChangeToken = new CancellationChangeToken(_cts.Token);
        }

        public IReadOnlyList<RouteConfig> Routes { get; }
        public IReadOnlyList<ClusterConfig> Clusters { get; }
        public IChangeToken ChangeToken { get; }
    }
}
