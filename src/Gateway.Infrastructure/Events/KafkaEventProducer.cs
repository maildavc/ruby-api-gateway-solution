using System.Text.Json;
using Confluent.Kafka;
using Gateway.Core.Models;
using Microsoft.Extensions.Logging;

namespace Gateway.Infrastructure.Events;

/// <summary>
/// High-performance Kafka event producer for audit/telemetry
/// Fire-and-forget pattern to avoid blocking request pipeline
/// </summary>
public class KafkaEventProducer : IEventProducer, IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<KafkaEventProducer> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public KafkaEventProducer(string bootstrapServers, ILogger<KafkaEventProducer> logger)
    {
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = false
        };

        var config = new ProducerConfig
        {
            BootstrapServers = bootstrapServers,
            Acks = Acks.Leader, // Balance between durability and performance
            EnableIdempotence = true,
            MaxInFlight = 5,
            LingerMs = 10, // Small batching for better throughput
            CompressionType = CompressionType.Snappy,
            MessageSendMaxRetries = 3
        };

        _producer = new ProducerBuilder<string, string>(config)
            .SetErrorHandler((_, e) => _logger.LogError("Kafka producer error: {Reason}", e.Reason))
            .Build();
    }

    public async Task PublishAsync(GatewayEvent gatewayEvent, string topic)
    {
        try
        {
            var json = JsonSerializer.Serialize(gatewayEvent, _jsonOptions);
            var message = new Message<string, string>
            {
                Key = gatewayEvent.CorrelationId,
                Value = json,
                Headers = new Headers
                {
                    { "correlation-id", System.Text.Encoding.UTF8.GetBytes(gatewayEvent.CorrelationId) },
                    { "product", System.Text.Encoding.UTF8.GetBytes(gatewayEvent.ProductName) },
                    { "service", System.Text.Encoding.UTF8.GetBytes(gatewayEvent.ServiceName) }
                }
            };

            // Fire and forget - don't wait for acknowledgment to avoid blocking
            _ = _producer.ProduceAsync(topic, message, CancellationToken.None);
        }
        catch (Exception ex)
        {
            // Log but don't throw - event publishing should never fail a request
            _logger.LogWarning(ex, "Failed to publish event to Kafka topic {Topic}", topic);
        }
    }

    public Task PublishAsync(GatewayEvent gatewayEvent)
    {
        var topic = $"{gatewayEvent.ProductName}.{gatewayEvent.ServiceName}".ToLowerInvariant();
        return PublishAsync(gatewayEvent, topic);
    }

    public void Dispose()
    {
        _producer?.Flush(TimeSpan.FromSeconds(10));
        _producer?.Dispose();
    }
}
