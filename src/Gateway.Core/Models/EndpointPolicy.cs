using Gateway.Core.Entities;
using Gateway.Core.Enums;

namespace Gateway.Core.Models;

/// <summary>
/// Complete runtime policy for an endpoint including resolved crypto config
/// </summary>
public class EndpointPolicy
{
    public required Endpoint Endpoint { get; set; }
    public required Service Service { get; set; }
    public required Product Product { get; set; }
    public required CryptoConfig CryptoConfig { get; set; }
    public PayloadExpectation PayloadExpectation { get; set; }
    public int TimeoutMs { get; set; }
    public int MaxRetries { get; set; }
    public bool RequiresJwt { get; set; }
    public List<string> RequiredScopes { get; set; } = new();
    public List<string> AllowedClients { get; set; } = new();
    public Dictionary<string, string> HeadersToAdd { get; set; } = new();
    public List<string> HeadersToRemove { get; set; } = new();
    public bool EmitEvents { get; set; }
    public string? TopicPrefix { get; set; }
    
    // Encryption direction
    public bool EncryptRequest { get; set; }   // Whether to encrypt request before forwarding
    public bool EncryptResponse { get; set; }  // Whether to encrypt response back to caller
}
