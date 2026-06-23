export type ManagementProduct = {
  id: string;
  name: string;
  description: string;
  ownerTeam: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ManagementService = {
  id: string;
  productId: string;
  serviceName: string;
  basePath: string;
  version: string;
  description: string;
  ownerTeam: string;
  isEnabled: boolean;
  environment: string;
  clusterId: string;
  destinations: string;
  loadBalancingPolicy: string;
  healthCheckEnabled: boolean;
  healthCheckPath?: string | null;
  healthCheckIntervalSeconds: number;
  sessionAffinityEnabled: boolean;
  sessionAffinityCookieName: string;
  sessionAffinityTtlSeconds: number;
  circuitBreakerEnabled: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerDurationSeconds: number;
  retryEnabled: boolean;
  retryCount: number;
  retryDelayMs: number;
  connectionTimeoutSeconds: number;
  requestTimeoutSeconds: number;
  maxConnectionsPerDestination: number;
  passiveHealthCheckEnabled: boolean;
  passiveHealthFailureThreshold: number;
  passiveHealthReactivationSeconds: number;
  enableTracing: boolean;
  enableMetrics: boolean;
  logSampling: number;
  requiresJwt: boolean;
  requiredScopes?: string | null;
  allowedClients?: string | null;
  cacheEnabled: boolean;
  cacheTtlSeconds: number;
  cacheKeyTemplate?: string | null;
  emitEvents: boolean;
  topicPrefix?: string | null;
  eventSchemaVersion?: string | null;
  defaultCryptoAlgorithm: string;
  defaultKeySource: string;
  defaultIvSource: string;
  defaultEncoding: string;
  defaultRequireIv: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ManagementEndpoint = {
  id: string;
  serviceId: string;
  endpointName: string;
  httpMethod: string;
  relativePath: string;
  upstreamPathTemplate?: string | null;
  isEnabled: boolean;
  timeoutMs: number;
  maxRetries: number;
  idempotentOnly: boolean;
  requestSizeLimitBytes: number;
  responseSizeLimitBytes: number;
  payloadExpectation: string;
  headersToAdd?: string | null;
  headersToRemove?: string | null;
  rateLimitPolicy?: string | null;
  cryptoAlgorithm?: string | null;
  keySource?: string | null;
  ivSource?: string | null;
  encoding?: string | null;
  requireIv?: boolean | null;
  encryptRequest: boolean;
  encryptResponse: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ManagementServiceDestination = {
  id: string;
  serviceId: string;
  destinationName: string;
  address: string;
  weight: number;
  priority: number;
  isEnabled: boolean;
  healthStatus: string;
  lastHealthCheck?: string | null;
  metadata?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManagementClient = {
  id: string;
  clientId: string;
  clientName: string;
  clientSecret: string;
  isEnabled: boolean;
  allowedIpAddresses?: string | null;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string | null;
};

export type ManagementClientPermission = {
  id: string;
  clientId: string;
  endpointId: string;
  isEnabled: boolean;
  createdAt: string;
  expiresAt?: string | null;
};

export type ManagementUserProfile = {
  id: string;
  userId: string;
  serviceId?: string | null;
  encryptionKey: string;
  encryptionIv?: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductCreatePayload = {
  name: string;
  description: string;
  ownerTeam: string;
  isEnabled?: boolean;
};

export type ProductUpdatePayload = Partial<ProductCreatePayload>;

export type ServiceCreatePayload = {
  productId: string;
  serviceName: string;
  basePath: string;
  version: string;
  description: string;
  ownerTeam: string;
  clusterId: string;
  destinations: string[];
  environment?: string;
  loadBalancingPolicy?: string;
  healthCheckEnabled?: boolean;
  healthCheckPath?: string;
  healthCheckIntervalSeconds?: number;
  sessionAffinityEnabled?: boolean;
  sessionAffinityCookieName?: string;
  sessionAffinityTtlSeconds?: number;
  circuitBreakerEnabled?: boolean;
  circuitBreakerThreshold?: number;
  circuitBreakerDurationSeconds?: number;
  retryEnabled?: boolean;
  retryCount?: number;
  retryDelayMs?: number;
  connectionTimeoutSeconds?: number;
  requestTimeoutSeconds?: number;
  maxConnectionsPerDestination?: number;
  passiveHealthCheckEnabled?: boolean;
  passiveHealthFailureThreshold?: number;
  passiveHealthReactivationSeconds?: number;
  enableTracing?: boolean;
  enableMetrics?: boolean;
  logSampling?: number;
  requiresJwt?: boolean;
  requiredScopes?: string[];
  allowedClients?: string[];
  cacheEnabled?: boolean;
  cacheTtlSeconds?: number;
  cacheKeyTemplate?: string;
  emitEvents?: boolean;
  topicPrefix?: string;
  eventSchemaVersion?: string;
  defaultCryptoAlgorithm?: string;
  defaultKeySource?: string;
  defaultIvSource?: string;
  defaultEncoding?: string;
  defaultRequireIv?: boolean;
  isEnabled?: boolean;
};

export type ServiceUpdatePayload = Partial<ServiceCreatePayload>;

export type EndpointCreatePayload = {
  serviceId: string;
  endpointName: string;
  httpMethod: string;
  relativePath: string;
  upstreamPathTemplate?: string;
  isEnabled?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
  idempotentOnly?: boolean;
  requestSizeLimitBytes?: number;
  responseSizeLimitBytes?: number;
  payloadExpectation?: string;
  headersToAdd?: Record<string, string>;
  headersToRemove?: string[];
  rateLimitPolicy?: Record<string, string>;
  cryptoAlgorithm?: string;
  keySource?: string;
  ivSource?: string;
  encoding?: string;
  requireIv?: boolean;
  encryptRequest?: boolean;
  encryptResponse?: boolean;
};

export type EndpointUpdatePayload = Partial<EndpointCreatePayload>;

export type ServiceDestinationCreatePayload = {
  serviceId: string;
  destinationName: string;
  address: string;
  weight?: number;
  priority?: number;
  isEnabled?: boolean;
  metadata?: Record<string, string>;
};

export type ServiceDestinationUpdatePayload = Partial<ServiceDestinationCreatePayload>;

export type ClientCreatePayload = {
  clientId: string;
  clientName: string;
  clientSecret: string;
  isEnabled?: boolean;
  allowedIpAddresses?: string[];
};

export type ClientUpdatePayload = Partial<ClientCreatePayload>;

export type ClientPermissionCreatePayload = {
  clientId: string;
  endpointId: string;
  isEnabled?: boolean;
  expiresAt?: string;
};

export type ClientPermissionUpdatePayload = {
  isEnabled?: boolean;
  expiresAt?: string;
};

export type UserProfileCreatePayload = {
  userId: string;
  serviceId?: string;
  encryptionKey: string;
  encryptionIv?: string;
  isEnabled?: boolean;
};

export type UserProfileUpdatePayload = Partial<UserProfileCreatePayload>;
