using Gateway.Core.Entities.Requests;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class ProductsEndpoints
{
    public static RouteGroupBuilder MapProductEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/products", async (IProductEntityRepository repo, bool? enabledOnly) =>
        {
            var products = await repo.GetAllAsync(enabledOnly);
            return Results.Ok(products);
        })
        .WithTags("Products");

        group.MapGet("/products/{id:guid}", async (IProductEntityRepository repo, Guid id) =>
        {
            var product = await repo.GetByIdAsync(id);
            return product is null ? Results.NotFound() : Results.Ok(product);
        })
        .WithTags("Products");

        group.MapPost("/products", async (IProductEntityRepository repo, ProductCreateRequest request) =>
        {
            var created = await repo.CreateAsync(new Gateway.Core.Entities.Product
            {
                Name = request.Name,
                Description = request.Description,
                OwnerTeam = request.OwnerTeam,
                IsEnabled = request.IsEnabled ?? true
            });
            return Results.Created($"/admin/management/products/{created.Id}", created);
        })
        .WithTags("Products");

        group.MapPut("/products/{id:guid}", async (IProductEntityRepository repo, Guid id, ProductUpdateRequest request) =>
        {
            var existing = await repo.GetByIdAsync(id);
            if (existing is null)
            {
                return Results.NotFound();
            }

            var updated = await repo.UpdateAsync(id, new Gateway.Core.Entities.Product
            {
                Name = request.Name ?? existing.Name,
                Description = request.Description ?? existing.Description,
                OwnerTeam = request.OwnerTeam ?? existing.OwnerTeam,
                IsEnabled = request.IsEnabled ?? existing.IsEnabled
            });
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithTags("Products");

        group.MapDelete("/products/{id:guid}", async (IProductEntityRepository repo, Guid id) =>
        {
            var disabled = await repo.DisableAsync(id);
            return disabled ? Results.NoContent() : Results.NotFound();
        })
        .WithTags("Products");

        return group;
    }
}
