"use client";

import { useEffect, useState, type FormEvent } from "react";

import { FormDialog } from "@/components/common/FormDialog";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { createClient, getClients, parseJsonArray } from "@/lib/api/admin";
import type { ManagementClient } from "@/types/management";

export default function ClientsPage() {
  const [clients, setClients] = useState<ManagementClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState({
    clientId: "",
    clientName: "",
    clientSecret: "",
    allowedIpAddresses: "",
    isEnabled: true,
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getClients(false);
        if (!mounted) return;
        setClients(data);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load clients.");
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
      const allowedIps = formState.allowedIpAddresses
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const created = await createClient({
        clientId: formState.clientId.trim(),
        clientName: formState.clientName.trim(),
        clientSecret: formState.clientSecret.trim(),
        allowedIpAddresses: allowedIps.length ? allowedIps : undefined,
        isEnabled: formState.isEnabled,
      });
      setClients((prev) => [created, ...prev]);
      setFormState({ clientId: "", clientName: "", clientSecret: "", allowedIpAddresses: "", isEnabled: true });
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Clients"
        description="Register API clients and manage allowlists."
        action={
          <PermissionGate permission="client.manage">
            <FormDialog
              title="Create client"
              description="Register a new client and secret."
              trigger={<Button>Create client</Button>}
              open={isOpen}
              onOpenChange={setIsOpen}
              submitLabel={submitting ? "Creating..." : "Create client"}
              submitDisabled={submitting}
              onSubmit={handleSubmit}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    value={formState.clientId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, clientId: event.target.value }))}
                    placeholder="client_payhub"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client name</Label>
                  <Input
                    id="client-name"
                    value={formState.clientName}
                    onChange={(event) => setFormState((prev) => ({ ...prev, clientName: event.target.value }))}
                    placeholder="PayHub"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="client-secret">Client secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    value={formState.clientSecret}
                    onChange={(event) => setFormState((prev) => ({ ...prev, clientSecret: event.target.value }))}
                    placeholder="Paste or generate a secret"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="client-ips">Allowed IPs (comma-separated)</Label>
                  <Input
                    id="client-ips"
                    value={formState.allowedIpAddresses}
                    onChange={(event) => setFormState((prev) => ({ ...prev, allowedIpAddresses: event.target.value }))}
                    placeholder="10.0.0.0/24, 10.1.0.0/24"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    id="client-enabled"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={formState.isEnabled}
                    onChange={(event) => setFormState((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                  />
                  <Label htmlFor="client-enabled">Enabled</Label>
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
              <th className="px-4 py-3">Allowlist</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last access</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={4}>
                  Loading clients...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={4}>
                  No clients yet. Create one above.
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const allowlist = parseJsonArray(client.allowedIpAddresses);
                return (
                  <tr key={client.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{client.clientName}</div>
                      <div className="text-xs text-muted-foreground">{client.clientId}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {allowlist.length ? allowlist.join(", ") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={client.isEnabled ? "success" : "neutral"}>{client.isEnabled ? "Active" : "Disabled"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {client.lastAccessedAt ? new Date(client.lastAccessedAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
