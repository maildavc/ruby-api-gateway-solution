# Organization Developer Portal - Complete User Journey

## Overview

This document walks through the complete user experience for organizations registering, discovering APIs, creating clients, and making authenticated API calls with IP restrictions.

---

## Part 1: Organization Registration & Onboarding

### 1.1 Organization Founder Signs Up

**User Action**: Visit `https://developer-portal.example.com/register`

**Form**:
```
┌─────────────────────────────────────┐
│   Create Your Organization Account  │
├─────────────────────────────────────┤
│ Full Name:        [John Doe       ] │
│ Email:            [john@acme.com  ] │
│ Company Name:     [Acme Corp      ] │
│ Password:         [••••••••••••••] │
│ Confirm Password: [••••••••••••••] │
│                                     │
│          [Create Account]           │
└─────────────────────────────────────┘
```

**Backend Actions**:
1. Validate input (name, email format, password strength)
2. Call: `POST /admin/management/tenants`
   ```json
   {
     "name": "Acme Corp",
     "domain": "acme.com"
   }
   ```
3. Database: Create `tenants` row with `status="pending"`
4. Email: Send verification link to john@acme.com

**Result**: Organization created but requires admin approval

---

### 1.2 Admin Approves Organization

**Admin Portal**:
- Admin views: `/admin/organizations` 
- Sees: "Acme Corp" with status="pending"
- Clicks: "Approve"
- Backend: `PUT /admin/management/tenants/{tenantId}/status`
  ```json
  {"status": "active"}
  ```

**User Notification**:
- Email sent to john@acme.com: "Your organization has been approved!"
- User can now log in

---

### 1.3 Organization User Logs In

**User Action**: Visit `https://developer-portal.example.com/login`

**Form**:
```
┌──────────────────────┐
│   Welcome Back       │
├──────────────────────┤
│ Email: [john@acme ] │
│ Pwd:   [••••••••] │
│        [Sign In]     │
└──────────────────────┘
```

**Backend Actions**:
1. Verify email and password
2. Create session/JWT with claims:
   ```
   {
     "userId": "user-123",
     "tenantId": "tenant-456",  // IMPORTANT: Org scoping
     "email": "john@acme.com",
     "organizationName": "Acme Corp"
   }
   ```
3. Store in session/localStorage

**Result**: User logged in, all subsequent requests filtered by `tenantId`

---

## Part 2: API Discovery & Access Requests

### 2.1 Browse Available APIs

**User Action**: Navigate to `/apis` after logging in

**Page Layout**:
```
┌────────────────────────────────────────────────────┐
│ 📚 Available APIs                                  │
│ Browse and request access to our API endpoints    │
├────────────────────────────────────────────────────┤
│ [Search: "user management"              ]          │
│                                                    │
│ 🏷️  All Products (24)  📦 Products v1 (12)        │
│ 🔐 Users API (8)                                   │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ [GET] /api/users                             │  │
│ │ Users Service - Products v1                  │  │
│ │ Get all users in the system                  │  │
│ │ 🔒 Requires JWT                              │  │
│ │ [Request Access]                             │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ [POST] /api/users                            │  │
│ │ Users Service - Products v1                  │  │
│ │ Create a new user                            │  │
│ │ 🔒 Requires JWT                              │  │
│ │ Payload: { name, email, role }              │  │
│ │ [Request Access]                             │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ... more endpoints ...                             │
└────────────────────────────────────────────────────┘
```

**Features**:
- ✅ Search across all endpoints
- ✅ Filter by product
- ✅ View endpoint details (method, path, description, auth, payload)
- ✅ Request access with one click

### 2.2 Request Endpoint Access

**User Action**: Click "Request Access" on `POST /api/users` endpoint

**Modal**:
```
┌──────────────────────────────────┐
│ Request Endpoint Access          │
├──────────────────────────────────┤
│ Endpoint: POST /api/users        │
│ Service: Users Service           │
│                                  │
│ Reason (optional):               │
│ [Our mobile app needs to create] │
│  [user accounts]                 │
│                                  │
│ [Cancel] [Submit Request]        │
└──────────────────────────────────┘
```

**Backend Actions**:
1. Call: `POST /admin/management/tenants/{tenantId}/endpoint-requests`
   ```json
   {
     "endpointId": "endpoint-users-post-123",
     "requestedBy": "user-123"
   }
   ```
2. Database: Create `org_endpoint_requests` row
   ```
   {
     id: uuid,
     tenant_id: "tenant-456",
     endpoint_id: "endpoint-users-post-123",
     status: "pending",
     requested_by: "user-123",
     created_at: now()
   }
   ```
3. Notify admin portal: New request to review

**User Feedback**:
```
✅ Request submitted!
Your request is now pending admin review.
You'll be notified once it's approved or rejected.
```

---

### 2.3 Track Request Status

**User Action**: Navigate to `/endpoint-requests`

**Page Layout**:
```
┌─────────────────────────────────────────────┐
│ Endpoint Requests                           │
├─────────────────────────────────────────────┤
│ 📊 Status Summary                           │
│ Pending: 2  ✅ Approved: 3  ❌ Rejected: 0 │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ POST  /api/users      ⏳ Pending       ││
│ │ Users Service                           ││
│ │ Requested: Feb 12, 2026                 ││
│ └─────────────────────────────────────────┘│
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ GET  /api/users       ✅ Approved      ││
│ │ Users Service                           ││
│ │ Requested: Feb 11, 2026 | Approved now ││
│ └─────────────────────────────────────────┘│
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ DELETE  /api/users/:id  ✅ Approved    ││
│ │ Users Service                           ││
│ │ Requested: Feb 10, 2026| Approved now ││
│ └─────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
```

**Status Indicators**:
- ⏳ **Pending**: Awaiting admin review
- ✅ **Approved**: Ready to use! Can assign to clients
- ❌ **Rejected**: Admin declined the request

---

### 2.4 Admin Reviews & Approves Request

**In Admin Portal** (`/admin/endpoint-requests`):

**Admin Views**:
```
Organization: Acme Corp
Endpoint: POST /api/users
Requested by: john@acme.com
Date: Feb 12, 2026
Reason: "Our mobile app needs to create user accounts"

[Approve] [Reject]
```

**Admin Clicks**: "Approve"

**Backend**:
1. Call: `PUT /admin/management/org-endpoint-requests/{requestId}/status`
   ```json
   {
     "status": "approved",
     "reviewedBy": "admin-user-id"
   }
   ```
2. Database: Update `org_endpoint_requests`
   ```
   status: "pending" → "approved"
   reviewed_by: "admin-user-id"
   reviewed_at: now()
   ```
3. Create `org_endpoint_approvals` row
   ```
   {
     id: uuid,
     tenant_id: "tenant-456",
     endpoint_id: "endpoint-users-post-123",
     approved_by: "admin-user-id",
     admin_ip_enforced: false,
     created_at: now()
   }
   ```
4. Send notification email to org user

**Organization User Sees**:
- Email: "Your endpoint access request for POST /api/users has been approved!"
- Page `/endpoint-requests`: Status changes to ✅ Approved
- New endpoints available in `/clients` to assign

---

## Part 3: Client Management

### 3.1 Create API Client

**User Action**: Navigate to `/clients` → Click "Create Client"

**Modal**:
```
┌──────────────────────────────────┐
│ Create New API Client            │
├──────────────────────────────────┤
│ Client Name:                     │
│ [Mobile App              ]       │
│                                  │
│          [Create]                │
└──────────────────────────────────┘
```

**Backend Actions**:
1. Generate unique `clientId` (UUID): `client-789`
2. Generate `clientSecret` (securely hashed): `secret-hash-xyz`
3. Call internal API to create client
4. Link to organization via `org_clients` table:
   ```
   {
     id: uuid,
     tenant_id: "tenant-456",
     client_id: "client-789",
     created_by: "user-123",
     created_at: now()
   }
   ```

**User Sees**:
```
✅ Client Created: Mobile App

Client ID:     client-789
Client Secret: [Click to reveal]

[Assign Endpoints] [Settings] [Delete]
```

---

### 3.2 View All Organization Clients

**Page**: `/clients`

**Display**:
```
┌────────────────────────────────────────────┐
│ API Clients                                │
│ [Create Client]                            │
├────────────────────────────────────────────┤
│ Name          │ Client ID    │ Endpoints  │
├───────────────┼──────────────┼────────────┤
│ Mobile App    │ client-789   │ 3          │
│ Backend Svc   │ client-234   │ 5          │
│ Analytics     │ client-567   │ 2          │
└────────────────────────────────────────────┘

[Copy] [Settings] [Delete] for each client
```

**Key Features**:
- View all clients scoped to organization
- Copy Client ID to clipboard
- View number of assigned endpoints
- Click to view/edit client details
- Delete unused clients

---

## Part 4: Assign Endpoints to Clients

### 4.1 Assign Approved Endpoints

**User Action**: In `/clients` → Click client "Mobile App" → "Assign Endpoints"

**Modal**:
```
┌──────────────────────────────────────────┐
│ Assign Approved Endpoints                │
│ Mobile App                               │
├──────────────────────────────────────────┤
│ ✅ GET  /api/users                       │
│ ✅ POST  /api/users                      │
│ ☐ PUT  /api/users/:id                    │
│ ☐ DELETE  /api/users/:id                 │
│ ✅ GET  /api/products                    │
│                                          │
│ (Legend: ✅ = Already assigned)           │
│                                          │
│ [Cancel] [Save Changes]                  │
└──────────────────────────────────────────┘
```

**Points**:
- ✅ Green = Already assigned to this client
- ☐ Gray = Can assign
- Only shows **approved** endpoints (not pending)

**User Action**: Checks `PUT /api/users/:id` and `DELETE /api/users/:id`

**Backend**:
1. Call: `POST /admin/management/tenants/{tenantId}/clients/{clientId}/permissions`
   ```json
   {
     "endpointIds": [
       "endpoint-users-post-123",
       "endpoint-users-put-123",
       "endpoint-users-delete-123"
     ]
   }
   ```
2. Database: Create `client_permissions` rows linking client to endpoints

**Result**:
```
Mobile App now has access to:
  ✅ GET /api/users
  ✅ POST /api/users
  ✅ PUT /api/users/:id
  ✅ DELETE /api/users/:id
  ✅ GET /api/products
```

---

## Part 5: IP Address Restrictions

### 5.1 Configure IP Allowlist

**User Action**: Navigate to `/ip-restrictions`

**Page**:
```
┌────────────────────────────────────────────┐
│ IP Restrictions                            │
├────────────────────────────────────────────┤
│ Endpoint: POST /api/users                  │
│ Service: Users Service                     │
│ IP Enforcement: [Disabled ▼]               │
│                                            │
│ [Configure]                                │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ Endpoint: GET /api/users                   │
│ Service: Users Service                     │
│ IP Enforcement: [Enabled ▼]                │
│                                            │
│ [Configure]                                │
└────────────────────────────────────────────┘
```

**User Clicks**: "Configure" on POST /api/users

**Modal**:
```
┌─────────────────────────────────────────┐
│ IP Restrictions: POST /api/users         │
├─────────────────────────────────────────┤
│ ☐ Enable IP Restrictions                │
│                                         │
│ [Not enforced - all IPs allowed]        │
│                                         │
│          [Save]                         │
└─────────────────────────────────────────┘
```

**User Enables IP Enforcement**:
```
┌─────────────────────────────────────────┐
│ IP Restrictions: POST /api/users         │
├─────────────────────────────────────────┤
│ ☑ Enable IP Restrictions                │
│                                         │
│ Allowed IP Addresses / CIDR Ranges:    │
│ ┌───────────────────────────────────┐  │
│ │ 192.168.1.0/24                    │  │
│ │ 10.0.0.0/8                        │  │
│ │ 203.0.113.5                       │  │
│ │                                   │  │
│ └───────────────────────────────────┘  │
│                                         │
│ Examples:                               │
│ • Individual: 203.0.113.5               │
│ • Range: 192.168.1.0/24                 │
│ • Enterprise: 10.0.0.0/8                │
│                                         │
│          [Save]                         │
└─────────────────────────────────────────┘
```

**Backend**:
1. Call: `PUT /admin/management/org-endpoint-approvals/{approvalId}`
   ```json
   {
     "adminIpAllowlist": [
       "192.168.1.0/24",
       "10.0.0.0/8",
       "203.0.113.5"
     ],
     "adminIpEnforced": true
   }
   ```
2. Database: Update `org_endpoint_approvals`
   ```
   admin_ip_allowlist: ["192.168.1.0/24", "10.0.0.0/8", "203.0.113.5"]
   admin_ip_enforced: true
   ```

**Result**:
```
✅ IP restrictions saved for POST /api/users

Only requests from these IPs will be accepted:
  • 192.168.1.0/24 (office network)
  • 10.0.0.0/8 (vpn/intranet)
  • 203.0.113.5 (partner integration)
```

---

## Part 6: Making API Calls with Client Credentials

### 6.1 Client Makes Authenticated Request

**Client Code** (Mobile App):
```javascript
const clientId = "client-789";
const clientSecret = "secret-hash-xyz";

// Get access token
const tokenResponse = await fetch('http://gateway.example.com/auth/token', {
  method: 'POST',
  body: JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials'
  })
});

const { access_token } = await tokenResponse.json();

// Call API endpoint
const response = await fetch('http://gateway.example.com/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'admin'
  })
});
```

### 6.2 Gateway Authorization Middleware

**Request Flow**:
```
1. Client sends: POST /api/users
   Headers: Authorization: Bearer <token>
   IP: 192.168.1.100

2. Gateway extracts client_id from JWT

3. Middleware checks:
   ✅ Is this client enabled?
   ✅ Does client have access to this endpoint?
   ✅ Does client belong to an org that approved this endpoint?
   ✅ If IP enforcement enabled:
       - Is request IP in admin_ip_allowlist?

4a. If all checks pass:
    → Route to backend service
    → Return 200 with response

4b. If any check fails:
    → Return 401 (Unauthorized) or 403 (Forbidden)
    → Log attempt for audit trail
```

**Database Queries**:
```sql
-- 1. Get client info
SELECT * FROM clients WHERE id = $1;

-- 2. Get org that owns this client
SELECT tenant_id FROM org_clients 
WHERE client_id = $1;

-- 3. Check if org has endpoint access
SELECT * FROM org_endpoint_approvals 
WHERE tenant_id = $2 AND endpoint_id = $3;

-- 4. Check IP restrictions
IF admin_ip_enforced THEN
  -- Validate request.sourceIp IN admin_ip_allowlist
END IF;
```

### 6.3 Successful Response

**200 OK**:
```json
{
  "id": "user-999",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "admin",
  "created_at": "2026-02-12T14:32:00Z"
}
```

### 6.4 Access Denied Scenarios

**IP Not Allowed (403)**:
```json
{
  "error": "Forbidden",
  "message": "Your IP address is not authorized to access this endpoint"
}
```

**Endpoint Not Approved (403)**:
```json
{
  "error": "Forbidden",
  "message": "Organization has not been granted access to this endpoint"
}
```

**Client Invalid (401)**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired client credentials"
}
```

---

## Complete User Journey Summary

```
┌─────────────────────────────────────────────────────────┐
│ ORGANIZATION DEVELOPER PORTAL USER JOURNEY              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. REGISTRATION & APPROVAL                             │
│    Org founder → Registers → Admin approves             │
│                                                         │
│ 2. LOGIN                                                │
│    User → Logs in → Session with tenantId              │
│                                                         │
│ 3. DISCOVER APIs (/apis)                               │
│    Browse all endpoints → Request access                │
│                                                         │
│ 4. TRACK REQUESTS (/endpoint-requests)                 │
│    Monitor status: Pending → Approved → Ready to use   │
│                                                         │
│ 5. CREATE CLIENTS (/clients)                           │
│    Generate client ID + secret for apps                │
│                                                         │
│ 6. ASSIGN ENDPOINTS                                     │
│    Link approved endpoints to each client               │
│                                                         │
│ 7. CONFIGURE IP RESTRICTIONS (/ip-restrictions)        │
│    (Optional) Add IP allowlist per endpoint             │
│                                                         │
│ 8. MAKE API CALLS                                       │
│    Client uses credentials + IP restrictions enforced   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Security Layers

1. **Organization Isolation**: All queries filtered by `tenantId`
2. **Client Authentication**: Client ID + Secret validation
3. **Endpoint Authorization**: Approval check in `org_endpoint_approvals`
4. **IP Whitelisting**: Optional per-endpoint IP restrictions
5. **Audit Logging**: All attempts logged for compliance

---

## Key Differentiators

| Feature | Single-User Model | Organization Model |
|---------|-------------------|-------------------|
| Users | One developer | Multiple org members |
| Clients | Apps owned by user | Clients scoped to org |
| Endpoints | All endpoints | Only approved endpoints |
| IP Restrictions | Optional | Per-org per-endpoint |
| Approval | None | Admin approval required |
| Scalability | Simple | Enterprise-ready |

This organization-first model enables API providers to serve multiple organizations with fine-grained access control and security.

