using System.Text.Json;

namespace Gateway.Core.Entities.Requests;

public record ServiceDestinationCreateRequest(Guid ServiceId, string DestinationName, string Address, int? Weight, int? Priority, bool? IsEnabled, JsonElement? Metadata);
