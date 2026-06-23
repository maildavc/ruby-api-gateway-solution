export type ApiKey = {
  id: string;
  label: string;
  environment: "Sandbox" | "Staging" | "Production";
  scopes: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  status: "active" | "revoked" | "expired";
  keyPreview: string;
};

export type ApiLog = {
  id: string;
  timestamp: string;
  method: string;
  route: string;
  status: number;
  latencyMs: number;
  traceId: string;
  environment: "Sandbox" | "Staging" | "Production";
};

export type GatewayStatus = {
  status: "operational" | "degraded" | "outage";
  latencyMs: number;
  uptime: string;
  incident?: string;
};
