namespace Gateway.Core.Entities;

public class Client
{
    public int Id { get; set; }
    public required string ClientId { get; set; }
    public required string ClientName { get; set; }
    public required string ClientSecret { get; set; } // Hashed
    public bool IsEnabled { get; set; }
    public string? AllowedIpAddresses { get; set; } // JSON array
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastAccessedAt { get; set; }
}
