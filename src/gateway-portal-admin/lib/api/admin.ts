import { apiClient } from "@/lib/api/client";
import type {
  ClientCreatePayload,
  ClientPermissionCreatePayload,
  ClientPermissionUpdatePayload,
  ClientUpdatePayload,
  EndpointCreatePayload,
  EndpointUpdatePayload,
  ManagementClient,
  ManagementClientPermission,
  ManagementEndpoint,
  ManagementProduct,
  ManagementService,
  ManagementServiceDestination,
  ManagementUserProfile,
  ProductCreatePayload,
  ProductUpdatePayload,
  ServiceCreatePayload,
  ServiceDestinationCreatePayload,
  ServiceDestinationUpdatePayload,
  ServiceUpdatePayload,
  UserProfileCreatePayload,
  UserProfileUpdatePayload,
} from "@/types/management";

export async function getProducts(enabledOnly = true) {
  const response = await apiClient.get<ManagementProduct[]>("/products", {
    params: { enabledOnly },
  });
  return response.data;
}

export async function getProduct(id: string) {
  const response = await apiClient.get<ManagementProduct>(`/products/${id}`);
  return response.data;
}

export async function createProduct(payload: ProductCreatePayload) {
  const response = await apiClient.post<ManagementProduct>("/products", payload);
  return response.data;
}

export async function updateProduct(id: string, payload: ProductUpdatePayload) {
  const response = await apiClient.put<ManagementProduct>(`/products/${id}`, payload);
  return response.data;
}

export async function deleteProduct(id: string) {
  await apiClient.delete(`/products/${id}`);
}

export async function getServices(params?: { productId?: string; enabledOnly?: boolean }) {
  const response = await apiClient.get<ManagementService[]>("/services", { params });
  return response.data;
}

export async function getService(id: string) {
  const response = await apiClient.get<ManagementService>(`/services/${id}`);
  return response.data;
}

export async function createService(payload: ServiceCreatePayload) {
  const response = await apiClient.post<ManagementService>("/services", payload);
  return response.data;
}

export async function updateService(id: string, payload: ServiceUpdatePayload) {
  const response = await apiClient.put<ManagementService>(`/services/${id}`, payload);
  return response.data;
}

export async function deleteService(id: string) {
  await apiClient.delete(`/services/${id}`);
}

export async function getEndpoints(params?: { serviceId?: string; enabledOnly?: boolean }) {
  const response = await apiClient.get<ManagementEndpoint[]>("/endpoints", { params });
  return response.data;
}

export async function getEndpoint(id: string) {
  const response = await apiClient.get<ManagementEndpoint>(`/endpoints/${id}`);
  return response.data;
}

export async function createEndpoint(payload: EndpointCreatePayload) {
  const response = await apiClient.post<ManagementEndpoint>("/endpoints", payload);
  return response.data;
}

export async function updateEndpoint(id: string, payload: EndpointUpdatePayload) {
  const response = await apiClient.put<ManagementEndpoint>(`/endpoints/${id}`, payload);
  return response.data;
}

export async function deleteEndpoint(id: string) {
  await apiClient.delete(`/endpoints/${id}`);
}

export async function getServiceDestinations(serviceId: string) {
  const response = await apiClient.get<ManagementServiceDestination[]>("/service-destinations", {
    params: { serviceId },
  });
  return response.data;
}

export async function createServiceDestination(payload: ServiceDestinationCreatePayload) {
  const response = await apiClient.post<ManagementServiceDestination>("/service-destinations", payload);
  return response.data;
}

export async function updateServiceDestination(id: string, payload: ServiceDestinationUpdatePayload) {
  const response = await apiClient.put<ManagementServiceDestination>(`/service-destinations/${id}`, payload);
  return response.data;
}

export async function deleteServiceDestination(id: string) {
  await apiClient.delete(`/service-destinations/${id}`);
}

export async function getClients(enabledOnly?: boolean) {
  const response = await apiClient.get<ManagementClient[]>("/clients", {
    params: { enabledOnly },
  });
  return response.data;
}

export async function getClient(id: string) {
  const response = await apiClient.get<ManagementClient>(`/clients/${id}`);
  return response.data;
}

export async function createClient(payload: ClientCreatePayload) {
  const response = await apiClient.post<ManagementClient>("/clients", payload);
  return response.data;
}

export async function updateClient(id: string, payload: ClientUpdatePayload) {
  const response = await apiClient.put<ManagementClient>(`/clients/${id}`, payload);
  return response.data;
}

export async function deleteClient(id: string) {
  await apiClient.delete(`/clients/${id}`);
}

export async function getClientPermissions(clientId?: string) {
  const response = await apiClient.get<ManagementClientPermission[]>("/client-permissions", {
    params: { clientId },
  });
  return response.data;
}

export async function createClientPermission(payload: ClientPermissionCreatePayload) {
  const response = await apiClient.post<ManagementClientPermission>("/client-permissions", payload);
  return response.data;
}

export async function updateClientPermission(id: string, payload: ClientPermissionUpdatePayload) {
  const response = await apiClient.put<ManagementClientPermission>(`/client-permissions/${id}`, payload);
  return response.data;
}

export async function deleteClientPermission(id: string) {
  await apiClient.delete(`/client-permissions/${id}`);
}

export async function getUserProfiles(params?: { userId?: string; serviceId?: string }) {
  const response = await apiClient.get<ManagementUserProfile[]>("/user-profiles", { params });
  return response.data;
}

export async function createUserProfile(payload: UserProfileCreatePayload) {
  const response = await apiClient.post<ManagementUserProfile>("/user-profiles", payload);
  return response.data;
}

export async function updateUserProfile(id: string, payload: UserProfileUpdatePayload) {
  const response = await apiClient.put<ManagementUserProfile>(`/user-profiles/${id}`, payload);
  return response.data;
}

export async function deleteUserProfile(id: string) {
  await apiClient.delete(`/user-profiles/${id}`);
}

export function parseJsonArray(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}
