"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { FormDialog } from "@/components/common/FormDialog";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { createClientPermission, getClientPermissions, getClients, getEndpoints } from "@/lib/api/admin";
import type { ManagementClient, ManagementClientPermission, ManagementEndpoint } from "@/types/management";

export default function ClientPermissionsPage() {
  const [permissions, setPermissions] = useState<ManagementClientPermission[]>([]);
  const [clients, setClients] = useState<ManagementClient[]>([]);
  const [endpoints, setEndpoints] = useState<ManagementEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState({
    clientId: "",
    endpointId: "",
    expiresAt: "",
    isEnabled: true,
  });

  const clientLookup = useMemo(() => {
    return clients.reduce<Record<string, string>>((acc, client) => {
      acc[client.id] = client.clientName;
      return acc;
    }, {});
  }, [clients]);

  const endpointLookup = useMemo(() => {
    return endpoints.reduce<Record<string, string>>((acc, endpoint) => {
      acc[endpoint.id] = `${endpoint.httpMethod} ${endpoint.relativePath}`;
      return acc;
    }, {});
  }, [endpoints]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [permissionsData, clientsData, endpointsData] = await Promise.all([
          getClientPermissions(),
          getClients(false),
          getEndpoints({ enabledOnly: false }),
        ]);
        if (!mounted) return;
        setPermissions(permissionsData);
        setClients(clientsData);
        setEndpoints(endpointsData);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load client permissions.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createClientPermission({
        clientId: formState.clientId,
        endpointId: formState.endpointId,
        isEnabled: formState.isEnabled,
        expiresAt: formState.expiresAt || undefined,
      });
      setPermissions((prev) => [created, ...prev]);
      setFormState({ clientId: "", endpointId: "", expiresAt: "", isEnabled: true });
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client permission.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Client permissions"
        description="Grant clients access to specific endpoints."
        action={
          <PermissionGate permission="client.permission.manage">
            <FormDialog
              title="Grant client access"
              description="Choose a client and endpoint to authorize."
              trigger={<Button>Add permission</Button>}
              open={isOpen}
              onOpenChange={setIsOpen}
              submitLabel={submitting ? "Granting..." : "Grant access"}
              submitDisabled={submitting || !formState.clientId || !formState.endpointId}
              onSubmit={handleSubmit}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="permission-client">Client</Label>
                  <select
                    id="permission-client"
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                    value={formState.clientId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, clientId: event.target.value }))}
                    required
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.clientName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permission-endpoint">Endpoint</Label>
                  <select
                    id="permission-endpoint"
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                    value={formState.endpointId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, endpointId: event.target.value }))}
                    required
                  >
                    <option value="">Select endpoint</option>
                    {endpoints.map((endpoint) => (
                      <option key={endpoint.id} value={endpoint.id}>
                        {endpoint.httpMethod} {endpoint.relativePath}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permission-expiry">Expires at (optional)</Label>
                  <Input
                    id="permission-expiry"
                    type="datetime-local"
                    value={formState.expiresAt}
                    onChange={(event) => setFormState((prev) => ({ ...prev, expiresAt: event.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    id="permission-enabled"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={formState.isEnabled}
                    onChange={(event) => setFormState((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                  />
                  <Label htmlFor="permission-enabled">Enabled</Label>
                </div>
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
            </FormDialog>
          </PermissionGate>
        }
      />
      {error && !isOpen && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Endpoint</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expires</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={4}>
                  Loading client permissions...
                </td>
              </tr>
            ) : permissions.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={4}>
                  No permissions yet. Grant access above.
                </td>
              </tr>
            ) : (
              permissions.map((permission) => (
                <tr key={permission.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {clientLookup[permission.clientId] ?? permission.clientId}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {endpointLookup[permission.endpointId] ?? permission.endpointId}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={permission.isEnabled ? "success" : "neutral"}>{permission.isEnabled ? "Active" : "Disabled"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {permission.expiresAt ? new Date(permission.expiresAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
