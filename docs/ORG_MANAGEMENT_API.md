# Organization Management API Endpoints

## Base Path: `/admin/management`

All endpoints require authorization (in production) and operate on the single-tenant multi-organization model.

### Tenants Endpoints

#### GET /tenants
List all tenants (organizations).

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corp",
    "domain": "acme.example.com",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### GET /tenants/{id}
Get a specific tenant by ID.

**Parameters:**
- `id` (guid): Tenant ID

**Response:** Single tenant object

#### POST /tenants
Create a new tenant (organization).

**Request Body:**
```json
{
  "name": "Acme Corp",
  "domain": "acme.example.com"
}
```

**Response:** Created tenant (201) with status="pending"

#### PUT /tenants/{id}/status
Update tenant approval status.

**Parameters:**
- `id` (guid): Tenant ID

**Request Body:**
```json
{
  "status": "active" // active, pending, inactive
}
```

**Response:** Updated tenant object

---

### Org Clients Endpoints

#### GET /tenants/{tenantId}/clients
List all clients assigned to an organization.

**Parameters:**
- `tenantId` (guid): Tenant ID

**Response:** Array of client objects with extended org context

#### POST /tenants/{tenantId}/clients
Assign a client to an organization.

**Parameters:**
- `tenantId` (guid): Tenant ID

**Request Body:**
```json
{
  "clientId": "650e8400-e29b-41d4-a716-446655440001",
  "createdById": "750e8400-e29b-41d4-a716-446655440002"
}
```

**Response:** Created org-client mapping (201)

#### DELETE /tenants/{tenantId}/clients/{clientId}
Remove a client from an organization.

**Parameters:**
- `tenantId` (guid): Tenant ID
- `clientId` (guid): Client ID

**Response:** No content (204)

---

### Org Endpoint Requests Endpoints

#### GET /org-endpoint-requests
List all endpoint access requests (admin view).

**Query Parameters:**
- `tenantId` (optional, guid): Filter by tenant
- `status` (optional, string): Filter by status (pending, approved, rejected)

**Response:** Array of request objects

#### GET /tenants/{tenantId}/endpoint-requests
List pending endpoint requests for a specific organization.

**Parameters:**
- `tenantId` (guid): Tenant ID

**Response:** Array of request objects for the tenant

#### POST /tenants/{tenantId}/endpoint-requests
Create a new endpoint access request.

**Parameters:**
- `tenantId` (guid): Tenant ID

**Request Body:**
```json
{
  "endpointId": "850e8400-e29b-41d4-a716-446655440003",
  "requestedBy": "950e8400-e29b-41d4-a716-446655440004"
}
```

**Response:** Created request (201) with status="pending"

#### PUT /org-endpoint-requests/{id}/status
Admin approval or rejection of endpoint request.

**Parameters:**
- `id` (guid): Request ID

**Request Body:**
```json
{
  "status": "approved", // pending, approved, rejected
  "reviewedById": "a50e8400-e29b-41d4-a716-446655440005"
}
```

**Response:** Updated request object with reviewed_at timestamp

---

### Org Endpoint Approvals Endpoints

#### GET /org-endpoint-approvals
List all approved endpoint-org mappings (admin view).

**Query Parameters:**
- `tenantId` (optional, guid): Filter by tenant

**Response:** Array of approval objects

#### GET /tenants/{tenantId}/approvals
List all approved endpoints for an organization.

**Parameters:**
- `tenantId` (guid): Tenant ID

**Response:** Array of approval objects with IP restrictions

#### GET /tenants/{tenantId}/approvals/{endpointId}
Get approval details for a specific org-endpoint pair.

**Parameters:**
- `tenantId` (guid): Tenant ID
- `endpointId` (guid): Endpoint ID

**Response:** Single approval object or 404

#### POST /tenants/{tenantId}/approvals
Create an approval (typically triggered after request approval).

**Parameters:**
- `tenantId` (guid): Tenant ID

**Request Body:**
```json
{
  "endpointId": "850e8400-e29b-41d4-a716-446655440003",
  "approvedById": "a50e8400-e29b-41d4-a716-446655440005",
  "adminIpAllowlist": ["192.168.1.0/24", "10.0.0.0/8"],
  "adminIpEnforced": true
}
```

**Response:** Created approval (201)

#### PUT /org-endpoint-approvals/{id}
Update approval IP restrictions.

**Parameters:**
- `id` (guid): Approval ID

**Request Body:**
```json
{
  "adminIpAllowlist": ["192.168.1.0/24", "10.0.0.0/8"],
  "adminIpEnforced": false
}
```

**Response:** Updated approval object

---

## Workflow Examples

### 1. New Organization Registration
1. POST /tenants → Creates tenant with status="pending"
2. Admin reviews via GET /tenants (filters by status)
3. Admin approves via PUT /tenants/{id}/status → status="active"

### 2. Client Assignment to Org
1. POST /tenants/{tenantId}/clients → Assigns existing client to org
2. GET /tenants/{tenantId}/clients → Verify assignment

### 3. Endpoint Access Request & Approval
1. Org requests endpoint: POST /tenants/{tenantId}/endpoint-requests
2. Admin views pending: GET /org-endpoint-requests?status=pending
3. Admin approves request: PUT /org-endpoint-requests/{id}/status → status="approved"
4. System creates approval: POST /tenants/{tenantId}/approvals
5. Admin optionally restricts by IP: PUT /org-endpoint-approvals/{id}

### 4. Authorization Check (Middleware)
When client makes request:
1. Extract client_id from JWT
2. Find tenant: SELECT * FROM org_clients WHERE client_id = ?
3. Check endpoint approval: SELECT * FROM org_endpoint_approvals WHERE tenant_id = ? AND endpoint_id = ?
4. If admin_ip_enforced, validate request IP against admin_ip_allowlist
5. Allow or deny request

---

## Data Model Relationships

```
Tenants (organizations)
  ├── OrgClients (org owns multiple clients)
  │   └── Maps to Clients table
  ├── OrgEndpointRequests (org requests endpoint access)
  │   └── References Endpoints table
  └── OrgEndpointApprovals (admin approves endpoint access)
      ├── References Endpoints table
      └── Contains optional IP restrictions
```

## Status Enumerations

- **Tenant Status**: active, pending, inactive
- **Request Status**: pending, approved, rejected
