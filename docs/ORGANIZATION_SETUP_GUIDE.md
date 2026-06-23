# Organization Management - Database & API Quick Start

## ✅ Database Status

**All migrations applied successfully!**

### New Tables Created (Migration 007)
- `org_clients` - Maps organizations to API clients
- `org_endpoint_requests` - Organization requests for endpoint access
- `org_endpoint_approvals` - Admin approvals with IP restrictions

### Verify in Database
```bash
psql -h localhost -p 5432 -U olawoleomotosho -d "SeaBaasAPIGateway-Database" \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'SeaBaasAPIGateway-Core' AND table_name LIKE 'org_%'"
```

Expected output:
```
org_clients
org_endpoint_approvals
org_endpoint_requests
```

## 🔌 API Endpoints Available

Base path: `/admin/management`

### Tenant Management
```
GET    /tenants                          # List all organizations
GET    /tenants/{id}                     # Get specific tenant
POST   /tenants                          # Create new tenant
PUT    /tenants/{id}/status              # Approve/reject tenant
```

### Organization Clients
```
GET    /tenants/{tenantId}/clients                       # List org's clients
POST   /tenants/{tenantId}/clients                       # Assign client to org
DELETE /tenants/{tenantId}/clients/{clientId}            # Remove client from org
```

### Endpoint Access Requests
```
GET    /org-endpoint-requests                            # List all requests (admin)
GET    /tenants/{tenantId}/endpoint-requests             # Org's pending requests
POST   /tenants/{tenantId}/endpoint-requests             # Create access request
PUT    /org-endpoint-requests/{id}/status                # Admin approve/reject
```

### Endpoint Approvals
```
GET    /org-endpoint-approvals                           # List all approvals (admin)
GET    /tenants/{tenantId}/approvals                     # Org's approved endpoints
GET    /tenants/{tenantId}/approvals/{endpointId}        # Single approval
POST   /tenants/{tenantId}/approvals                     # Create approval
PUT    /org-endpoint-approvals/{id}                      # Update IP restrictions
```

## 📊 Sample Workflow

### 1. Register Organization
```bash
curl -X POST http://localhost:5003/admin/management/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "domain": "acme.example.com"
  }'
```

### 2. Admin Approves Organization
```bash
curl -X PUT http://localhost:5003/admin/management/tenants/{tenantId}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### 3. Assign Client to Organization
```bash
curl -X POST http://localhost:5003/admin/management/tenants/{tenantId}/clients \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "{clientId}",
    "createdById": "{userId}"
  }'
```

### 4. Organization Requests Endpoint Access
```bash
curl -X POST http://localhost:5003/admin/management/tenants/{tenantId}/endpoint-requests \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": "{endpointId}",
    "requestedBy": "{userId}"
  }'
```

### 5. Admin Approves Endpoint Access
```bash
curl -X PUT http://localhost:5003/admin/management/org-endpoint-requests/{requestId}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reviewedById": "{adminId}"
  }'
```

### 6. Admin Creates Approval (with optional IP restrictions)
```bash
curl -X POST http://localhost:5003/admin/management/tenants/{tenantId}/approvals \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": "{endpointId}",
    "approvedById": "{adminId}",
    "adminIpAllowlist": ["192.168.1.0/24", "10.0.0.0/8"],
    "adminIpEnforced": true
  }'
```

## 🏃 Running the Migration Script

If you need to re-run migrations (e.g., on a new database):

```bash
cd /path/to/ruby-api-gateway-solution
chmod +x scripts/migrate-db.sh
DB_USER=olawoleomotosho DB_NAME="SeaBaasAPIGateway-Database" ./scripts/migrate-db.sh
```

## 📋 Table Relationships

```
Tenants
  ├─ org_clients (tenant has multiple clients)
  ├─ org_endpoint_requests (tenant requests access to endpoints)
  └─ org_endpoint_approvals (admin grants access with IP restrictions)
```

## 🔐 Data Integrity

All tables have:
- ✅ Foreign key constraints with `ON DELETE CASCADE`
- ✅ UNIQUE constraints to prevent duplicates
- ✅ Indexes for query performance
- ✅ Timestamps for audit trails

## Next Steps

1. **Start the Middleware API**: `dotnet run --project src/Gateway.Middleware.Api/Gateway.Middleware.Api.csproj`
2. **Test the endpoints** using the curl examples above
3. **Build Admin Portal UI** to consume these endpoints
4. **Configure Gateway Authorization** to enforce org-specific access control

For detailed API documentation, see [ORG_MANAGEMENT_API.md](ORG_MANAGEMENT_API.md)
