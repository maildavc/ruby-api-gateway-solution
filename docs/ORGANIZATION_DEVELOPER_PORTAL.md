# Organization Developer Portal - Implementation Guide

## Overview

The organization developer portal has been completely redesigned to support a multi-organization, multi-client model with granular endpoint access control and IP restrictions.

## New Features Implemented

### 1. Organization Registration (Auth)
**File**: [app/api/auth/register/route.ts](src/gateway-portal-developer/app/api/auth/register/route.ts)

- Organizations register with company name and domain
- Backend automatically creates a **Tenant** in the database
- Org is initially in **pending** state waiting for admin approval
- User receives verification email

**API Integration**:
- Calls: `POST /admin/management/tenants`
- Creates organization record with status="pending"

### 2. Organization Login
**File**: [app/(auth)/login/page.tsx](src/gateway-portal-developer/app/(auth)/login/page.tsx)

- Org users authenticate with email/password or OAuth
- Session/JWT stores `tenantId` to scope all API calls to the organization
- User can only see their organization's data

**TODO**: Update auth middleware to inject org context into all requests

### 3. APIs Discovery & Browsing
**File**: [app/(protected)/apis/page.tsx](src/gateway-portal-developer/app/(protected)/apis/page.tsx)

**Backend API**: `GET /public/endpoints` (new endpoint)

Features:
- Browse all available products, services, and endpoints
- Search and filter by product name, service, or endpoint path
- View endpoint details:
  - HTTP method (GET, POST, PUT, DELETE, PATCH)
  - Relative path
  - Description
  - Required payload format
  - JWT requirement
- Request access to endpoints with one click
- Visual indicators for authentication requirements (lock icon)
- Color-coded HTTP method badges

**Page Structure**:
```
Available APIs
├── Search Bar
├── Product Filter Buttons
└── Endpoint Cards (Grid)
    ├── HTTP Method Badge
    ├── Endpoint Path
    ├── Service & Product Name
    ├── Description
    ├── Payload Example
    └── "Request Access" Button
```

### 4. Client Management
**File**: [app/(protected)/clients/page.tsx](src/gateway-portal-developer/app/(protected)/clients/page.tsx)

**Backend APIs**:
- `GET /admin/management/tenants/{tenantId}/clients`
- `POST /admin/management/tenants/{tenantId}/clients`
- `DELETE /admin/management/tenants/{tenantId}/clients/{clientId}`

Features:
- Create multiple API clients per organization
- View all organization clients in table
- Client details:
  - Client ID (copiable)
  - Client Secret (masked for security)
  - Enabled/Disabled status
  - Creation date
  - Number of approved endpoints
- Copy to clipboard for easy sharing
- Edit client settings
- Delete clients
- Quick action to assign endpoints to clients

**Page Structure**:
```
API Clients
├── "Create Client" Button
└── Clients Table
    ├── Client Name
    ├── Client ID (with copy button)
    ├── Approved Endpoints Count
    ├── Status Badge
    ├── Created Date
    └── Actions (Settings, Delete)
```

### 5. Endpoint Access Requests
**File**: [app/(protected)/endpoint-requests/page.tsx](src/gateway-portal-developer/app/(protected)/endpoint-requests/page.tsx)

**Backend APIs**:
- `GET /admin/management/tenants/{tenantId}/endpoint-requests`
- `POST /admin/management/tenants/{tenantId}/endpoint-requests`
- `PUT /admin/management/org-endpoint-requests/{id}/status`

Features:
- Submit requests to access specific endpoints
- Track request status: Pending, Approved, Rejected
- View statistics:
  - Total pending requests
  - Total approved endpoints
  - Total rejected requests
- Timeline of all requests with dates
- Status indicators with icons
- Admin can approve/reject requests

**Request Flow**:
1. Org user browses `/apis` page
2. Clicks "Request Access" on desired endpoint
3. Request created with status="pending"
4. Admin reviews on admin portal
5. Admin approves (status="approved") or rejects (status="rejected")
6. Org user sees updated status on `/endpoint-requests` page

### 6. IP Address Restrictions
**File**: [app/(protected)/ip-restrictions/page.tsx](src/gateway-portal-developer/app/(protected)/ip-restrictions/page.tsx)

**Backend APIs**:
- `GET /admin/management/tenants/{tenantId}/approvals`
- `PUT /admin/management/org-endpoint-approvals/{id}`

Features:
- Configure IP allowlist per approved endpoint
- Support for:
  - Individual IP addresses: `203.0.113.5`
  - CIDR ranges: `192.168.1.0/24`, `10.0.0.0/8`
- Toggle IP enforcement on/off
- Bulk IP configuration with one IP per line
- Enforcement status display (Enforced/Disabled)
- Security best practices information

**Configuration Example**:
```
Endpoint: GET /api/users
IP Enforcement: Enabled
Allowed IPs:
  - 192.168.1.0/24
  - 10.0.0.0/8
  - 203.0.113.5
```

## Architecture & Data Flow

### Organization Scoping
Every API call is scoped to the organization:
```
User → Login → Session with tenantId
                        ↓
                  All API calls include tenantId
                        ↓
        API returns only org's data/clients/approvals
```

### Client Creation & Management Flow
```
Organization User
    ↓
Creates Client (POST /clients)
    ↓
Client created and linked to tenant via org_clients table
    ↓
Client appears in /clients page
    ↓
User can assign approved endpoints to this client
    ↓
Client credentials can be used for API calls
```

### Endpoint Access Request Workflow
```
Browse Available APIs
    ↓
Request Access to Endpoint
    ↓
Create org_endpoint_requests record (status="pending")
    ↓
Admin Reviews Request
    ↓
Admin Approves → Creates org_endpoint_approval record
    ↓
Org User Sees Approved Endpoints
    ↓
Org Configures IP Restrictions (Optional)
    ↓
Org Assigns Endpoint to Clients
    ↓
Clients Can Now Call the Endpoint
```

### IP Restriction Enforcement
```
Client Makes API Request
    ↓
Extract client_id from request
    ↓
Query org_clients table → Get tenantId
    ↓
Query org_endpoint_approvals → Check approval exists
    ↓
If admin_ip_enforced = true
    ↓
Check request.sourceIp against admin_ip_allowlist
    ↓
Allow (200) or Reject (403)
```

## Navigation Structure

### Primary Navigation (Org-Centric)
- **Dashboard** - Overview of org's clients and approvals
- **APIs** - Browse and request access to endpoints
- **Clients** - Create and manage API clients
- **Endpoint Requests** - Track approval status
- **IP Restrictions** - Configure IP allowlist per endpoint
- **Console** - API playground
- **Logs** - Request/response logs
- **Docs** - API documentation

### Secondary Navigation (Account)
- **Profile** - User account settings
- **Billing** - Subscription and billing
- **Support** - Help and support

## API Integration Points

### Middleware API Endpoints (New)

```
PUBLIC (No Auth Required)
├── GET /public/endpoints
│   └── Returns: { id, productName, serviceName, httpMethod, relativePath, ... }[]

AUTHENTICATED (Organization Scoped)
├── Tenants (Admin Only)
│   ├── GET /admin/management/tenants
│   ├── POST /admin/management/tenants
│   └── PUT /admin/management/tenants/{id}/status
│
├── Org Clients
│   ├── GET /admin/management/tenants/{tenantId}/clients
│   ├── POST /admin/management/tenants/{tenantId}/clients
│   └── DELETE /admin/management/tenants/{tenantId}/clients/{clientId}
│
├── Endpoint Requests
│   ├── GET /admin/management/tenants/{tenantId}/endpoint-requests
│   ├── POST /admin/management/tenants/{tenantId}/endpoint-requests
│   └── PUT /admin/management/org-endpoint-requests/{id}/status
│
└── Endpoint Approvals
    ├── GET /admin/management/tenants/{tenantId}/approvals
    ├── POST /admin/management/tenants/{tenantId}/approvals
    └── PUT /admin/management/org-endpoint-approvals/{id}
```

## Database Schema Integration

### Tables Used
- **tenants** - Organizations
- **clients** - API credentials
- **org_clients** - Org ↔ Client mapping
- **endpoints** - API endpoints
- **org_endpoint_requests** - Access requests (pending state)
- **org_endpoint_approvals** - Approved access with IP config

### Key Relationships
```
Organization (tenant)
    ├── owns → clients (via org_clients)
    ├── requests → endpoints (via org_endpoint_requests)
    └── approves → endpoints (via org_endpoint_approvals)

Client
    ├── belongs to → organization (via org_clients)
    └── can call → approved endpoints (via org_endpoint_approvals)
```

## Security Considerations

1. **Organization Scoping**: All queries filtered by `tenantId`
2. **IP Restrictions**: Optional layer on top of auth
3. **Client Credentials**: Stored encrypted in database
4. **Request Signing**: Clients use client_id + client_secret
5. **Rate Limiting**: Per-client rate limiting (optional)
6. **Audit Logging**: Track all endpoint access attempts

## Implementation Checklist

- ✅ Organization registration API
- ✅ APIs discovery endpoint
- ✅ Client management pages
- ✅ Endpoint request tracking
- ✅ IP restriction configuration
- ✅ Navigation updates

**Still TODO**:
- [ ] Auth context/session management for org scoping
- [ ] Connection between /apis page "Request Access" button and backend
- [ ] Actual client creation API integration
- [ ] Client-endpoint assignment logic
- [ ] IP restriction enforcement in gateway middleware
- [ ] Admin portal pages to approve/reject requests
- [ ] Database queries with org scoping
- [ ] Error handling and validation

## Example Usage

### Organization Sign Up
```
1. Go to https://developer-portal.example.com/register
2. Enter: Name, Email, Company Name, Password
3. Backend creates Tenant with status="pending"
4. Admin approves tenant on admin portal
5. Org user can now log in
```

### Request Endpoint Access
```
1. Log in as org user
2. Go to /apis
3. Search for "User Management" API
4. Click "Request Access" on POST /users endpoint
5. Request stored in org_endpoint_requests table
6. Admin reviews on /admin/endpoint-requests
7. Admin clicks "Approve"
8. Status updates to "approved"
9. Org user can now see approved endpoints
```

### Create Client & Assign Endpoints
```
1. Go to /clients
2. Click "Create Client"
3. Name: "Mobile App"
4. Client created and linked to org
5. Click "Assign Endpoints"
6. Select approved endpoints
7. Mobile app now has credentials to call those endpoints
```

### Configure IP Restrictions
```
1. Go to /ip-restrictions
2. Select endpoint: GET /users
3. Enable "IP Restrictions"
4. Add allowed IPs:
   - 192.168.1.0/24 (office network)
   - 203.0.113.0/24 (backup office)
5. Save
6. Only requests from those IPs are allowed
```

## File Structure

```
src/gateway-portal-developer/
├── app/
│   ├── (auth)/
│   │   └── register/page.tsx (updated)
│   ├── (protected)/
│   │   ├── apis/page.tsx (new)
│   │   ├── clients/page.tsx (new)
│   │   ├── endpoint-requests/page.tsx (new)
│   │   └── ip-restrictions/page.tsx (new)
│   └── api/
│       └── auth/register/route.ts (updated)
├── components/
│   └── layout/
│       └── Sidebar.tsx (updated with new icons)
└── lib/
    └── config/
        └── navigation.ts (updated)

src/Gateway.Middleware.Api/
├── Endpoints/
│   └── PublicEndpointsEndpoints.cs (new)
└── Program.cs (updated)
```

## Next Steps

1. **Test Organization Registration**: Verify tenant creation in database
2. **Test APIs Discovery**: Check `/public/endpoints` returns all endpoints
3. **Implement Auth Context**: Store and use tenantId in all requests
4. **Connect UI to APIs**: Wire up client creation, endpoint requests, IP config
5. **Admin Portal Updates**: Create admin pages for approving requests
6. **Gateway Middleware**: Add IP restriction enforcement
7. **Testing**: End-to-end testing of full workflow

