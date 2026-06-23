# Developer Portal Frontend - Implementation Guide

## Quick Start for Page Development

### 1. Basic Page Structure
Every page in `app/(protected)/` follows this pattern:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTenant, useApiLoading } from "@/lib/hooks/useTenant";
import { orgApi } from "@/lib/api/org";
import { Card, Button, Input } from "@/components/ui/*";

export default function PageName() {
  const { data: session, status } = useSession();
  const tenant = useTenant();
  const { loading, error, withLoading } = useApiLoading();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch on mount
  useEffect(() => {
    if (status !== "authenticated" || !tenant?.tenantId) return;
    
    withLoading(async () => {
      const result = await orgApi.getFunctionName(tenant.tenantId);
      setData(result);
      setLoading(false);
    });
  }, [status, tenant?.tenantId, withLoading]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Page Title</h1>
        <p className="text-muted-foreground mt-2">Description</p>
      </div>

      {/* Error */}
      {error && <ErrorCard message={error} />}

      {/* Content */}
      {loading ? <LoadingState /> : <ContentArea data={data} />}
    </div>
  );
}
```

### 2. API Integration Patterns

#### Fetching Data
```typescript
// Simple list fetch
const clients = await orgApi.getClientsByTenant(tenant.tenantId);
setClients(clients);

// With error handling
await withLoading(async () => {
  const clients = await orgApi.getClientsByTenant(tenant.tenantId);
  setClients(clients);
});
```

#### Creating Resources
```typescript
const newClient = await orgApi.createClient(
  tenant.tenantId,
  "My Client Name"
);
setClients([...clients, newClient]);
```

#### Updating Resources
```typescript
const updated = await orgApi.updateApproval(approvalId, {
  adminIpAllowlist: ["192.168.1.0/24"],
  adminIpEnforced: true,
});
```

#### Deleting Resources
```typescript
await orgApi.deleteClient(tenant.tenantId, clientId);
setClients(clients.filter(c => c.id !== clientId));
```

### 3. Form Handling

Using React Hook Form + Zod:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  fieldName: z.string().min(1, "Required"),
  ipAddress: z.string().refine(
    (ip) => validateIPInput(ip).isValid,
    { message: "Invalid IP address" }
  ),
});

type FormValues = z.infer<typeof schema>;

export default function MyForm() {
  const { register, handleSubmit, formState: { errors } } = 
    useForm<FormValues>({
      resolver: zodResolver(schema),
    });

  const onSubmit = async (values: FormValues) => {
    try {
      await apiCall(values);
      // Show success
    } catch (err) {
      // Show error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register("fieldName")} />
      {errors.fieldName && <p>{errors.fieldName.message}</p>}
    </form>
  );
}
```

### 4. IP Validation

```typescript
import { 
  validateIPInput, 
  validateIPList,
  isValidCIDR,
  isValidIPv4 
} from "@/lib/utils/ipValidation";

// Validate single input
const result = validateIPInput("192.168.1.0/24");
if (result.isValid) {
  // Process valid IP
} else {
  console.error(result.error);
}

// Validate array
const { valid, invalid } = validateIPList(ipArray);
if (invalid.length > 0) {
  invalid.forEach(item => console.error(item.error));
}
```

### 5. Loading & Error States

```typescript
// Show loading state
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}

// Show error
if (error) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 6. Dialog/Modal Pattern

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";

export default function PageWithDialog() {
  const [open, setOpen] = useState(false);
  const { handleSubmit, register, reset } = useForm();

  const onSubmit = async (values) => {
    await apiCall(values);
    reset();
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button><Plus className="h-4 w-4 mr-2" /> Create</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register("name")} placeholder="Name" />
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### 7. Table Pattern

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ListPage() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell><Badge>{item.status}</Badge></TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Implementation Checklist for Each Page

### `/clients` Page
- [ ] Fetch clients: `orgApi.getClientsByTenant(tenantId)`
- [ ] Create client dialog with `clientName` input
- [ ] Submit via `orgApi.createClient(tenantId, clientName)`
- [ ] Display `clientId` and `clientSecret` in table
- [ ] Copy to clipboard functionality for secrets
- [ ] Delete via `orgApi.deleteClient(tenantId, clientId)`
- [ ] Add "Assign Endpoint" column with dropdown of approved endpoints
- [ ] Submit endpoint assignment with POST to `/admin/management/tenants/{tenantId}/clients/{clientId}/endpoints`

### `/endpoint-requests` Page
- [ ] Fetch requests: `orgApi.getEndpointRequestsByTenant(tenantId)`
- [ ] Display status as tabs (pending, approved, rejected)
- [ ] Filter list based on selected status
- [ ] Show reviewer details (name, date, reason)
- [ ] Add "Request New" button to jump to `/apis` page
- [ ] Optional: Add polling for real-time updates (setInterval every 30s)

### `/ip-restrictions` Page
- [ ] Fetch approvals: `orgApi.getApprovalsByTenant(tenantId)`
- [ ] Display card per approved endpoint
- [ ] Input field for IP address/CIDR
- [ ] Use `validateIPInput()` on blur with error display
- [ ] "Add IP" button adds to list
- [ ] List of allowed IPs with delete buttons
- [ ] Toggle "Enforce IP Restrictions" checkbox
- [ ] "Save" button calls `orgApi.updateApproval(id, { adminIpAllowlist, adminIpEnforced })`
- [ ] Show success message after save

## Common Patterns

### Tenant Safety
Always check tenant context before API calls:
```typescript
if (!tenant?.tenantId) {
  return <div>Loading organization context...</div>;
}

// Safe to use tenant.tenantId
```

### Error Boundaries
Wrap component with error boundary:
```typescript
try {
  // API call
} catch (err) {
  console.error("Error:", err);
  // Error is caught by useApiLoading hook automatically
}
```

### Optimistic Updates
Update UI before confirming with server:
```typescript
// Update local state immediately
setClients([...clients, { id: "temp", ...newClient }]);

// Then confirm with server
try {
  const confirmed = await orgApi.createClient(tenantId, name);
  // Replace temp with confirmed
  setClients(clients.map(c => c.id === "temp" ? confirmed : c));
} catch (err) {
  // Revert on error
  setClients(clients.filter(c => c.id !== "temp"));
}
```

## Component Imports

**UI Components** (from `@/components/ui/*`):
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
```

**Icons** (from `lucide-react`):
```typescript
import { Plus, Trash2, Edit, Copy, Lock, Shield, Send, AlertCircle, CheckCircle, Clock } from "lucide-react";
```

**Hooks** (from custom libs):
```typescript
import { useSession } from "next-auth/react";
import { useTenant, useApiLoading } from "@/lib/hooks/useTenant";
import { orgApi } from "@/lib/api/org";
import { validateIPInput } from "@/lib/utils/ipValidation";
```

## Testing

### Manual Testing Checklist
- [ ] Page loads authenticated
- [ ] Data fetches on mount
- [ ] Create form validates input
- [ ] Create request succeeds with UI update
- [ ] Delete request removes from list
- [ ] Error states display correctly
- [ ] Loading states show during API calls
- [ ] Form resets after successful submission
- [ ] Responsive layout on mobile

### API Testing
```bash
# Test endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5003/admin/management/tenants/{tenantId}/clients

# Create
curl -X POST http://localhost:5003/admin/management/tenants/{tenantId}/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clientId": "test-client", "createdById": "user-id"}'
```

## Debugging Tips

1. **Check Network Tab**: Verify API calls, headers, response codes
2. **Log Tenant**: Add `console.log(tenant)` to verify context
3. **Inspect Session**: Use `console.log(session)` to see auth data
4. **Test API Directly**: Use curl/Postman to isolate API issues
5. **Check CORS**: Verify `NEXT_PUBLIC_GATEWAY_BASE_URL` is correct
6. **Form Validation**: Log `formState.errors` to see validation messages

## Environment Setup

For local development:

```bash
# .env.local
NEXT_PUBLIC_GATEWAY_BASE_URL=http://localhost:5003
NEXT_PUBLIC_PORTAL_NAME="SeaBaas Developer Portal"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# NextAuth OAuth (if using)
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"
```

Then start dev server:
```bash
npm run dev
```

API should be running on `http://localhost:5003`
