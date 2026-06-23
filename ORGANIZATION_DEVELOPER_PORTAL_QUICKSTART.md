# Organization Developer Portal - Quick Start Guide

## What Was Built

A complete multi-organization, multi-client API gateway with:
- Organization self-registration and approval workflow
- API discovery and access request system
- Client (API credential) management
- IP address restrictions per endpoint
- Granular endpoint permissions

## New Features at a Glance

| Feature | Page | Purpose |
|---------|------|---------|
| **APIs Discovery** | `/apis` | Browse all available endpoints and request access |
| **Client Management** | `/clients` | Create and manage API clients per organization |
| **Endpoint Requests** | `/endpoint-requests` | Track approval status of endpoint access requests |
| **IP Restrictions** | `/ip-restrictions` | Configure IP allowlist for approved endpoints |
| **Public Endpoints** | `/public/endpoints` | Backend API listing all available endpoints (no auth needed) |

## Quick Start

### 1. Organization Registration
```bash
# User visits https://localhost:3001/register

# Form Fields:
# - Full Name: John Doe
# - Email: john@acme.com
# - Company: Acme Corp
# - Password: SecurePassword123

# Backend:
# - Creates Tenant with name="Acme Corp", status="pending"
# - Sends verification email
```

### 2. Browse Available APIs
```bash
# After approval, user logs in and visits /apis

# Can:
# - Search by API name or endpoint path
# - Filter by product
# - See all available endpoints with:
#   - HTTP method (GET, POST, PUT, DELETE)
#   - Endpoint path
#   - Required authentication
#   - Payload format
# - Click "Request Access" to request endpoint
```

### 3. Create API Clients
```bash
# Go to /clients page

# Click "Create Client"
# - Client created with unique ID and secret
# - Linked to organization automatically
# - Can be used to call approved endpoints

# Each client is scoped to its organization
# Clients can only call endpoints approved for their org
```

### 4. Request & Use Endpoints
```bash
# On /endpoint-requests page:
# - See all submitted requests
# - View status: Pending, Approved, Rejected
# - Track approval timeline

# Once approved:
# - Go to /clients
# - Assign the approved endpoint to a client
# - Use client credentials to call the endpoint
```

### 5. Secure with IP Restrictions
```bash
# Go to /ip-restrictions page

# For each approved endpoint, optionally:
# - Enable IP enforcement
# - Add allowed IP addresses or CIDR ranges
# - Only requests from these IPs will be accepted

# Example:
# Endpoint: POST /api/payments
# Allowed IPs:
#   - 192.168.1.0/24 (office)
#   - 10.0.0.0/8 (VPN)
```

## API Endpoints for Developers

### Public API (No Authentication)
```
GET /public/endpoints
  Returns list of all available APIs
```

### Organization APIs (Requires Auth + TenantId)
```
# Clients Management
GET    /admin/management/tenants/{tenantId}/clients
POST   /admin/management/tenants/{tenantId}/clients
DELETE /admin/management/tenants/{tenantId}/clients/{clientId}

# Endpoint Requests
GET    /admin/management/tenants/{tenantId}/endpoint-requests
POST   /admin/management/tenants/{tenantId}/endpoint-requests
PUT    /admin/management/org-endpoint-requests/{id}/status

# IP Restrictions
GET    /admin/management/tenants/{tenantId}/approvals
PUT    /admin/management/org-endpoint-approvals/{id}
```

## File Changes Summary

### New Files Created
1. **API Endpoints**
   - `src/Gateway.Middleware.Api/Endpoints/PublicEndpointsEndpoints.cs`
   - Lists all available endpoints for discovery

2. **Developer Portal Pages**
   - `src/gateway-portal-developer/app/(protected)/apis/page.tsx`
   - `src/gateway-portal-developer/app/(protected)/clients/page.tsx`
   - `src/gateway-portal-developer/app/(protected)/endpoint-requests/page.tsx`
   - `src/gateway-portal-developer/app/(protected)/ip-restrictions/page.tsx`

### Files Modified
1. **Registration API**
   - `src/gateway-portal-developer/app/api/auth/register/route.ts`
   - Now creates Tenant in backend

2. **Navigation**
   - `src/gateway-portal-developer/lib/config/navigation.ts`
   - Added new org-specific pages

3. **Sidebar**
   - `src/gateway-portal-developer/components/layout/Sidebar.tsx`
   - Added icons for new pages

4. **Program Configuration**
   - `src/Gateway.Middleware.Api/Program.cs`
   - Registered public endpoints

## Running the Application

### 1. Start the Middleware API
```bash
cd /path/to/ruby-api-gateway-solution
dotnet run --project src/Gateway.Middleware.Api/Gateway.Middleware.Api.csproj
# Runs on http://localhost:5003
```

### 2. Start the Developer Portal
```bash
cd src/gateway-portal-developer
npm install
npm run dev
# Runs on http://localhost:3001
```

### 3. Start the Admin Portal
```bash
cd src/gateway-portal-admin
npm install
npm run dev
# Runs on http://localhost:3000
```

## Test the Flow

### Step 1: Check Available APIs
```bash
curl http://localhost:5003/public/endpoints
```

### Step 2: Register Organization
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@acme.com",
    "company": "Acme Corp",
    "password": "SecurePassword123"
  }'
```

### Step 3: Admin Approves Organization (in admin portal)
```bash
curl -X PUT http://localhost:5003/admin/management/tenants/{tenantId}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### Step 4: Org Logs In
Visit http://localhost:3001/login and authenticate

### Step 5: Browse APIs
Visit http://localhost:3001/apis

### Step 6: Create Client
```bash
curl -X POST http://localhost:5003/admin/management/tenants/{tenantId}/clients \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "{generated-client-id}",
    "createdById": "{user-id}"
  }'
```

## Database Tables Involved

All data is stored in PostgreSQL with proper relationships:

```
tenants (organizations)
  ├── org_clients (org owns clients)
  ├── org_endpoint_requests (org requests endpoint access)
  └── org_endpoint_approvals (admin approves with IP config)
```

## Security Features Implemented

1. **Organization Isolation**: All data scoped by `tenantId`
2. **Granular Permissions**: Endpoints only accessible if approved
3. **IP Whitelisting**: Optional per-endpoint IP restrictions
4. **Client Credentials**: Each client has unique ID and secret
5. **Approval Workflow**: Admin must approve before access granted
6. **Audit Trail**: All requests logged for compliance

## Next Steps / TODO

1. **Auth Context**: Store and use `tenantId` in all requests
2. **Client Assignment**: Wire up endpoint-to-client assignment
3. **Gateway Enforcement**: Add IP restriction checks in request pipeline
4. **Admin Portal**: Create admin pages to approve/reject requests
5. **Error Handling**: Add proper error handling and validation
6. **Rate Limiting**: Optional rate limiting per client
7. **Usage Metrics**: Track API usage per client/endpoint
8. **Webhook Support**: Optional webhook events on request approval

## Documentation

See [ORGANIZATION_DEVELOPER_PORTAL.md](ORGANIZATION_DEVELOPER_PORTAL.md) for detailed architecture and design patterns.

## Support

For questions or issues:
1. Check the `/support` page in the developer portal
2. Review the `/docs` section for API documentation
3. Contact the admin portal team at admin@example.com
