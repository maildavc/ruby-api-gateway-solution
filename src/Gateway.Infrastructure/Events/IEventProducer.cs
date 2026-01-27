using Gateway.Core.Models;

namespace Gateway.Infrastructure.Events;

public interface IEventProducer
{
    Task PublishAsync(GatewayEvent gatewayEvent, string topic);
    Task PublishAsync(GatewayEvent gatewayEvent); // Uses default topic from config
}
