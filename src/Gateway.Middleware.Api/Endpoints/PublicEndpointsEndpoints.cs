using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class PublicEndpointsEndpoints
{
    public static IEndpointRouteBuilder MapPublicEndpoints(this IEndpointRouteBuilder app, string _)
    {
        // Public endpoint to list all available APIs for discovery
        app.MapGet("/public/endpoints", GetAllEndpoints)
            .WithName("GetPublicEndpoints")
            .Produces<IEnumerable<PublicEndpointDto>>(200)
            .WithTags("Public");

        return app;
    }

    private static async Task<IResult> GetAllEndpoints(
        IEndpointEntityRepository endpointRepo,
        IServiceEntityRepository serviceRepo,
        IProductEntityRepository productRepo)
    {
        try
        {
            // Only expose enabled catalog entries in public discovery.
            var endpoints = await endpointRepo.GetAllAsync(true);
            var services = await serviceRepo.GetAllAsync(true);
            var products = await productRepo.GetAllAsync(true);

            // Build a hierarchical structure
            var result = products
                .Select(p => new
                {
                    Product = p,
                    Services = services
                        .Where(s => s.ProductId == p.Id)
                        .Select(s => new
                        {
                            Service = s,
                            Endpoints = endpoints
                                .Where(e => e.ServiceId == s.Id)
                                .Select(e => new PublicEndpointDto
                                {
                                    Id = e.Id,
                                    ProductName = p.Name,
                                    ServiceName = s.ServiceName,
                                    HttpMethod = e.HttpMethod,
                                    RelativePath = e.RelativePath,
                                    Description = e.EndpointName,
                                    RequiresJwt = s.RequiresJwt,
                                    PayloadExpectation = e.PayloadExpectation.ToString(),
                                })
                                .ToList()
                        })
                        .ToList()
                })
                .ToList();

            // Flatten for easier consumption
            var flatResult = result
                .SelectMany(p => p.Services
                    .SelectMany(s => s.Endpoints))
                .ToList();

            return Results.Ok(flatResult);
        }
        catch
        {
            return Results.StatusCode(500);
        }
    }
}

public class PublicEndpointDto
{
    public Guid Id { get; set; }
    public string ProductName { get; set; } = "";
    public string ServiceName { get; set; } = "";
    public string HttpMethod { get; set; } = "";
    public string RelativePath { get; set; } = "";
    public string? Description { get; set; }
    public bool RequiresJwt { get; set; }
    public string? PayloadExpectation { get; set; }
}
