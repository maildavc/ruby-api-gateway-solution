using Gateway.Core.Entities;
using Gateway.Core.Entities.Requests;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class OrgEndpointRequestsEndpoints
{
    public static RouteGroupBuilder MapOrgEndpointRequestEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/org-endpoint-requests", async (IOrgEndpointRequestEntityRepository repo, Guid? tenantId, string? status) =>
        {
            var requests = await repo.GetAllAsync(tenantId, status);
            return Results.Ok(requests);
        })
        .WithTags("Org Endpoint Requests");

        group.MapGet("/tenants/{tenantId:guid}/endpoint-requests", async (IOrgEndpointRequestEntityRepository repo, Guid tenantId) =>
        {
            var requests = await repo.GetByTenantAsync(tenantId);
            return Results.Ok(requests);
        })
        .WithTags("Org Endpoint Requests");

        group.MapPost("/tenants/{tenantId:guid}/endpoint-requests", async (IOrgEndpointRequestEntityRepository repo, Guid tenantId, OrgEndpointRequestCreateRequest request) =>
        {
            var created = await repo.CreateAsync(new OrgEndpointRequest
            {
                TenantId = tenantId,
                EndpointId = request.EndpointId,
                RequestedBy = request.RequestedBy,
                Status = "pending"
            });
            return Results.Created($"/admin/management/tenants/{tenantId}/endpoint-requests/{created.Id}", created);
        })
        .WithTags("Org Endpoint Requests");

        group.MapPut("/org-endpoint-requests/{id:guid}/status", async (IOrgEndpointRequestEntityRepository repo, Guid id, OrgEndpointRequestStatusUpdateRequest request) =>
        {
            var existing = await repo.GetByIdAsync(id);
            if (existing is null)
            {
                return Results.NotFound();
            }

            var updated = await repo.UpdateStatusAsync(id, request.Status, request.ReviewedById);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithTags("Org Endpoint Requests");

        return group;
    }
}

public class OrgEndpointRequestStatusUpdateRequest
{
    public string Status { get; set; } = "pending"; // pending, approved, rejected
    public Guid? ReviewedById { get; set; }
}
