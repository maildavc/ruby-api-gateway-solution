using System.Text.Json;
using Gateway.Core.Entities;
using Gateway.Data.Repositories.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Gateway.Middleware.Api.Endpoints;

public static class OrgEndpointApprovalsEndpoints
{
    public static RouteGroupBuilder MapOrgEndpointApprovalEndpoints(this RouteGroupBuilder group, string _)
    {
        group.MapGet("/org-endpoint-approvals", async (IOrgEndpointApprovalEntityRepository repo, Guid? tenantId) =>
        {
            var approvals = await repo.GetAllAsync(tenantId);
            return Results.Ok(approvals);
        })
        .WithTags("Org Endpoint Approvals");

        group.MapGet("/tenants/{tenantId:guid}/approvals", async (IOrgEndpointApprovalEntityRepository repo, Guid tenantId) =>
        {
            var approvals = await repo.GetByTenantAsync(tenantId);
            return Results.Ok(approvals);
        })
        .WithTags("Org Endpoint Approvals");

        group.MapGet("/tenants/{tenantId:guid}/approvals/{endpointId:guid}", async (IOrgEndpointApprovalEntityRepository repo, Guid tenantId, Guid endpointId) =>
        {
            var approval = await repo.GetByTenantAndEndpointAsync(tenantId, endpointId);
            return approval is null ? Results.NotFound() : Results.Ok(approval);
        })
        .WithTags("Org Endpoint Approvals");

        group.MapPost("/tenants/{tenantId:guid}/approvals", async (IOrgEndpointApprovalEntityRepository repo, Guid tenantId, OrgEndpointApprovalCreateRequest request) =>
        {
            var adminIpAllowlistJson = request.AdminIpAllowlist is null ? null : JsonSerializer.Serialize(request.AdminIpAllowlist);
            var created = await repo.CreateAsync(new OrgEndpointApproval
            {
                TenantId = tenantId,
                EndpointId = request.EndpointId,
                ApprovedBy = request.ApprovedById,
                AdminIpAllowlist = adminIpAllowlistJson,
                AdminIpEnforced = request.AdminIpEnforced ?? false
            });
            return Results.Created($"/admin/management/tenants/{tenantId}/approvals/{created.EndpointId}", created);
        })
        .WithTags("Org Endpoint Approvals");

        group.MapPut("/org-endpoint-approvals/{id:guid}", async (IOrgEndpointApprovalEntityRepository repo, Guid id, OrgEndpointApprovalUpdateRequest request) =>
        {
            var adminIpAllowlistJson = request.AdminIpAllowlist is null ? null : JsonSerializer.Serialize(request.AdminIpAllowlist);
            var updated = await repo.UpdateAsync(id, new OrgEndpointApproval
            {
                AdminIpAllowlist = adminIpAllowlistJson,
                AdminIpEnforced = request.AdminIpEnforced ?? false
            });
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithTags("Org Endpoint Approvals");

        return group;
    }
}

public class OrgEndpointApprovalCreateRequest
{
    public Guid EndpointId { get; set; }
    public Guid? ApprovedById { get; set; }
    public List<string>? AdminIpAllowlist { get; set; }
    public bool? AdminIpEnforced { get; set; }
}

public class OrgEndpointApprovalUpdateRequest
{
    public List<string>? AdminIpAllowlist { get; set; }
    public bool? AdminIpEnforced { get; set; }
}
