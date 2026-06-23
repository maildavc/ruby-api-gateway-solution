export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "owner" | "auditor";
  status: "active" | "disabled";
  lastLoginAt?: string;
  mfaEnabled: boolean;
  providers?: IdentityProvider[];
  groupsCount?: number;
};

export type IdentityProvider = "google" | "github" | "azure-ad" | "apple" | "okta" | "saml";

export type Group = {
  id: string;
  name: string;
  members: number;
  mappedRoles: string[];
};

export type SsoProviderConfig = {
  id: string;
  name: string;
  status: "enabled" | "disabled";
  domains: string[];
  protocol: "oidc" | "saml";
  lastSyncedAt?: string;
};

export type ScimToken = {
  id: string;
  label: string;
  status: "active" | "revoked";
  lastUsedAt?: string;
  createdAt: string;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};

export type Product = {
  id: string;
  name: string;
  description: string;
  ownerTeam: string;
  status: "active" | "inactive" | "deprecated";
  servicesCount: number;
};

export type Service = {
  id: string;
  name: string;
  product: string;
  basePath: string;
  version: string;
  status: "active" | "inactive" | "deprecated";
  environment: "dev" | "uat" | "staging" | "prod";
};

export type Endpoint = {
  id: string;
  name: string;
  method: string;
  route: string;
  version: string;
  status: "active" | "inactive" | "deprecated";
  auth: "api_key" | "jwt" | "mtls";
  encryptionMode: "pass-through" | "decrypt-forward" | "encrypt-outbound";
  timeoutMs: number;
  retries: number;
  rateLimit: string;
};

export type Destination = {
  id: string;
  url: string;
  environment: "dev" | "uat" | "staging" | "prod";
  weight: number;
  priority: number;
  healthCheckUrl?: string;
  isActive: boolean;
  region?: string;
};

export type ApiKey = {
  id: string;
  owner: string;
  status: "active" | "revoked" | "rotated";
  createdAt: string;
  lastUsedAt?: string;
  scopes: string[];
  maskedKey: string;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  resource: string;
  createdAt: string;
  metadata: Record<string, string>;
};

export type ChangeEvent = {
  id: string;
  summary: string;
  author: string;
  createdAt: string;
};
