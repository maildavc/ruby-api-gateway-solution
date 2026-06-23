-- Org access management for single-tenant, multi-organization model

SET search_path TO "SeaBaasAPIGateway-Core";

-- Map organizations (tenants) to clients
CREATE TABLE IF NOT EXISTS org_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_org_clients_tenant ON org_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_org_clients_client ON org_clients(client_id);

-- Endpoint access requests from orgs
CREATE TABLE IF NOT EXISTS org_endpoint_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, endpoint_id)
);

CREATE INDEX IF NOT EXISTS idx_org_endpoint_requests_tenant ON org_endpoint_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_org_endpoint_requests_status ON org_endpoint_requests(status);

-- Approved endpoint access for orgs (admin-controlled)
CREATE TABLE IF NOT EXISTS org_endpoint_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_ip_allowlist JSONB,
  admin_ip_enforced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, endpoint_id)
);

CREATE INDEX IF NOT EXISTS idx_org_endpoint_approvals_tenant ON org_endpoint_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_org_endpoint_approvals_endpoint ON org_endpoint_approvals(endpoint_id);
