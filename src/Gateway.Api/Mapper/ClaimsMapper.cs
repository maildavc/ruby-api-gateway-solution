using System.Security.Claims;

namespace Gateway.Api.Mapper;

public static class ClaimsMapper
{
    public static string GetClientId(ClaimsPrincipal user)
    {
        return user.FindFirst("sub")?.Value ?? "anonymous";
    }
}
