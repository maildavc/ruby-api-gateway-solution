import { apiClient } from "@/lib/api/client";

// Types
export interface PublicEndpoint {
  id: string;
  productName: string;
  serviceName: string;
  httpMethod: string;
  relativePath: string;
  description?: string;
  requiresJwt: boolean;
  payloadExpectation?: string;
}

export interface OrgClient {
  id: string;
  clientId: string;
  clientSecret?: string;
  isEnabled: boolean;
  createdAt: string;
  approvedEndpointsCount?: number;
}

export interface OrgEndpointRequest {
  id: string;
  tenantId: string;
  endpointId: string;
  requestedBy: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewReason?: string;
}

export interface OrgEndpointApproval {
  id: string;
  tenantId: string;
  endpointId: string;
  approvedBy?: string;
  approvedAt: string;
  adminIpAllowlist?: string[] | null;
  adminIpEnforced: boolean;
}

export interface OrgEndpointApprovalUpdate {
  adminIpAllowlist?: string[] | null;
  adminIpEnforced?: boolean;
}

// API Calls
export const orgApi = {
  // Public Endpoints (no auth required)
  getPublicEndpoints: async (): Promise<PublicEndpoint[]> => {
    const response = await apiClient.get<PublicEndpoint[]>(
      "/api/endpoints"
    );
    return response.data;
  },

  // Org Clients
  getClientsByTenant: async (tenantId: string): Promise<OrgClient[]> => {
    const response = await apiClient.get<OrgClient[]>(
      `/admin/management/tenants/${tenantId}/clients`
    );
    return response.data;
  },

  createClient: async (
    tenantId: string,
    clientName: string
  ): Promise<OrgClient> => {
    const response = await apiClient.post<OrgClient>(
      `/admin/management/tenants/${tenantId}/clients`,
      {
        clientId: clientName.toLowerCase().replace(/\s+/g, "-"),
        createdById: undefined, // Will be set by backend from auth context
      }
    );
    return response.data;
  },

  deleteClient: async (tenantId: string, clientId: string): Promise<void> => {
    await apiClient.delete(
      `/admin/management/tenants/${tenantId}/clients/${clientId}`
    );
  },

  // Org Endpoint Requests
  getEndpointRequestsByTenant: async (
    tenantId: string
  ): Promise<OrgEndpointRequest[]> => {
    const response = await apiClient.get<OrgEndpointRequest[]>(
      `/admin/management/tenants/${tenantId}/endpoint-requests`
    );
    return response.data;
  },

  createEndpointRequest: async (
    tenantId: string,
    endpointId: string,
    requestedBy: string
  ): Promise<OrgEndpointRequest> => {
    const response = await apiClient.post<OrgEndpointRequest>(
      `/admin/management/tenants/${tenantId}/endpoint-requests`,
      { endpointId, requestedBy }
    );
    return response.data;
  },

  // Org Endpoint Approvals
  getApprovalsByTenant: async (
    tenantId: string
  ): Promise<OrgEndpointApproval[]> => {
    const response = await apiClient.get<OrgEndpointApproval[]>(
      `/admin/management/tenants/${tenantId}/approvals`
    );
    return response.data;
  },

  getApprovalByEndpoint: async (
    tenantId: string,
    endpointId: string
  ): Promise<OrgEndpointApproval | null> => {
    try {
      const response = await apiClient.get<OrgEndpointApproval>(
        `/admin/management/tenants/${tenantId}/approvals/${endpointId}`
      );
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  updateApproval: async (
    id: string,
    update: OrgEndpointApprovalUpdate
  ): Promise<OrgEndpointApproval> => {
    const response = await apiClient.put<OrgEndpointApproval>(
      `/admin/management/org-endpoint-approvals/${id}`,
      update
    );
    return response.data;
  },
};
