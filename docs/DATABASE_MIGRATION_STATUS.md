# Database Migration Summary

## Status: ✅ COMPLETE

All database migrations have been applied successfully to `SeaBaasAPIGateway-Database`.

## Applied Migrations

| # | Migration File | Purpose | Tables Created |
|---|---|---|---|
| 1 | `001_initial_schema.sql` | Initial schema with products, services, endpoints, clients | products, services, endpoints, clients, client_permissions, service_destinations, user_profiles |
| 2 | `002_seed_data.sql` | Seed data for testing | (data only) |
| 3 | `003_add_login_endpoint.sql` | Login endpoint configuration | (modified endpoints) |
| 4 | `004_load_balancing.sql` | Load balancing configuration | (modified services) |
| 5 | `005_convert_ids_to_uuid.sql` | Convert IDs to UUID format | (schema migration) |
| 6 | `006_enterprise_identity.sql` | Enterprise identity & multi-tenancy | tenants, users, oauth_accounts, groups, group_members, roles, role_permissions, user_roles, sso_settings, sso_domains, scim_tokens, scim_events, audit_logs, sessions |
| 7 | `007_org_access_management.sql` | Organization access control (NEW) | org_clients, org_endpoint_requests, org_endpoint_approvals |

## Current Database Tables (22 total)

### Core API Tables
- **products** - API products
- **services** - Microservices
- **endpoints** - API endpoints
- **clients** - API clients
- **client_permissions** - Client-to-endpoint mappings
- **service_destinations** - Service destination URLs
- **user_profiles** - User profile information
- **sessions** - User sessions

### Enterprise & Multi-Tenancy (Migration 006)
- **tenants** - Organizations/tenants
- **users** - Tenant users
- **oauth_accounts** - OAuth/federated identity
- **groups** - User groups
- **group_members** - Group membership
- **roles** - RBAC roles
- **role_permissions** - Role permissions
- **user_roles** - User-role assignments
- **sso_settings** - SSO configuration
- **sso_domains** - SSO domains
- **scim_tokens** - SCIM tokens
- **scim_events** - SCIM audit events
- **audit_logs** - Compliance audit logs

### Organization Access Management (Migration 007) - NEW
- **org_clients** - Maps organizations to API clients
  - Fields: `id`, `tenant_id` (FK → tenants), `client_id` (FK → clients), `created_by`, `created_at`
  - Unique constraint: `(tenant_id, client_id)`
  - Indexes: `tenant_id`, `client_id`

- **org_endpoint_requests** - Organization requests for endpoint access
  - Fields: `id`, `tenant_id` (FK → tenants), `endpoint_id` (FK → endpoints), `status` (pending/approved/rejected), `requested_by`, `reviewed_by`, `reviewed_at`, `created_at`
  - Unique constraint: `(tenant_id, endpoint_id)`
  - Indexes: `tenant_id`, `status`

- **org_endpoint_approvals** - Admin approvals with optional IP restrictions
  - Fields: `id`, `tenant_id` (FK → tenants), `endpoint_id` (FK → endpoints), `approved_by`, `approved_at`, `admin_ip_allowlist` (JSONB), `admin_ip_enforced`, `created_at`
  - Unique constraint: `(tenant_id, endpoint_id)`
  - Indexes: `tenant_id`, `endpoint_id`

## Migration Path

```
001: initial_schema
  ↓
002: seed_data
  ↓
003: add_login_endpoint
  ↓
004: load_balancing
  ↓
005: convert_ids_to_uuid
  ↓
006: enterprise_identity (tenants, users, roles, SSO)
  ↓
007: org_access_management (org_clients, requests, approvals) ✅ APPLIED
```

## How to Apply Future Migrations

### Automatic (Recommended)
```bash
./scripts/migrate-db.sh
```

### Manual
```bash
psql -h localhost -p 5432 -U olawoleomotosho -d "SeaBaasAPIGateway-Database" \
  -f database/migrations/NNN_migration_name.sql
```

## Verification

Check all tables in the schema:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'SeaBaasAPIGateway-Core'
ORDER BY table_name;
```

Expected result: 22 tables

## Schema Relationships

### Organization Access Control Flow
```
Tenants (Organizations)
  │
  ├─── OrgClients ──→ Clients (API credentials)
  │
  ├─── OrgEndpointRequests (user-initiated requests)
  │       │
  │       └─→ Endpoints (API endpoints they want)
  │
  └─── OrgEndpointApprovals (admin grants access)
          ├─→ Endpoints (approved endpoints)
          └─→ With optional IP restrictions (admin_ip_allowlist)
```

## Status Summary

✅ **Migration 001-007**: All applied
✅ **Org Access Tables**: Created (org_clients, org_endpoint_requests, org_endpoint_approvals)
✅ **Foreign Keys**: All configured with ON DELETE CASCADE
✅ **Indexes**: Created for performance (tenant_id, status, endpoint_id)
✅ **Constraints**: Unique constraints in place to prevent duplicates

**Ready for API usage** - All required tables are available for the middleware API endpoints.
