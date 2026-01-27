namespace Gateway.Core.Models;

/// <summary>
/// Route key used for fast endpoint lookup
/// </summary>
public class RouteKey
{
    public required string Path { get; set; }
    public required string Method { get; set; }

    public string ToKey() => $"{Method}:{Path}";

    public static RouteKey FromRequest(string path, string method)
    {
        return new RouteKey { Path = path, Method = method.ToUpperInvariant() };
    }
}
