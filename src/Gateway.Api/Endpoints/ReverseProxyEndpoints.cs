using Gateway.Infrastructure.Yarp;
using Yarp.ReverseProxy.Transforms;

namespace Gateway.Api.Endpoints;

public static class ReverseProxyEndpoints
{
    public static WebApplication MapGatewayReverseProxy(this WebApplication app)
    {
        app.MapReverseProxy(proxyPipeline =>
        {
            var decryptTransform = app.Services.GetRequiredService<DecryptTransform>();

            proxyPipeline.Use(async (context, next) =>
            {
                await decryptTransform.ApplyAsync(new RequestTransformContext
                {
                    HttpContext = context
                });

                await next();
            });
        });

        return app;
    }
}
