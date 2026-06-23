"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/common/FormDialog";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { createServiceDestination, getEndpoint, getServiceDestinations } from "@/lib/api/admin";
import type { ManagementEndpoint, ManagementServiceDestination } from "@/types/management";

export default function DestinationsPage() {
  const params = useParams();
  const endpointId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [endpoint, setEndpoint] = useState<ManagementEndpoint | null>(null);
  const [destinations, setDestinations] = useState<ManagementServiceDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState({
    destinationName: "",
    address: "",
    weight: 1,
    priority: 0,
    isEnabled: true,
  });

  useEffect(() => {
    if (!endpointId) return;
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const id = endpointId as string;
        const endpointData = await getEndpoint(id);
        const destinationsData = await getServiceDestinations(endpointData.serviceId);
        if (!mounted) return;
        setEndpoint(endpointData);
        setDestinations(destinationsData);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load destinations.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [endpointId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!endpoint) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createServiceDestination({
        serviceId: endpoint.serviceId,
        destinationName: formState.destinationName.trim(),
        address: formState.address.trim(),
        weight: Number(formState.weight),
        priority: Number(formState.priority),
        isEnabled: formState.isEnabled,
      });
      setDestinations((prev) => [created, ...prev]);
      setFormState({ destinationName: "", address: "", weight: 1, priority: 0, isEnabled: true });
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create destination.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Endpoint destinations"
        description="Weighted routing, failover, and health checks."
        backHref={endpointId ? `/admin/endpoints/${endpointId}` : "/admin/endpoints"}
        backLabel="Back to endpoint"
        action={
          <PermissionGate permission="destination.manage">
            <FormDialog
              title="Add destination"
              description="Add a weighted destination for this service."
              trigger={<Button>Add destination</Button>}
              open={isOpen}
              onOpenChange={setIsOpen}
              submitLabel={submitting ? "Adding..." : "Add destination"}
              submitDisabled={submitting || !endpoint}
              onSubmit={handleSubmit}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="destination-name">Destination name</Label>
                  <Input
                    id="destination-name"
                    value={formState.destinationName}
                    onChange={(event) => setFormState((prev) => ({ ...prev, destinationName: event.target.value }))}
                    placeholder="Primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination-address">Address</Label>
                  <Input
                    id="destination-address"
                    value={formState.address}
                    onChange={(event) => setFormState((prev) => ({ ...prev, address: event.target.value }))}
                    placeholder="https://prod.payhub.primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination-weight">Weight</Label>
                  <Input
                    id="destination-weight"
                    type="number"
                    min={1}
                    value={formState.weight}
                    onChange={(event) => setFormState((prev) => ({ ...prev, weight: Number(event.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination-priority">Priority</Label>
                  <Input
                    id="destination-priority"
                    type="number"
                    min={0}
                    value={formState.priority}
                    onChange={(event) => setFormState((prev) => ({ ...prev, priority: Number(event.target.value) }))}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    id="destination-enabled"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={formState.isEnabled}
                    onChange={(event) => setFormState((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                  />
                  <Label htmlFor="destination-enabled">Enabled</Label>
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
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Health</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={5}>
                  Loading destinations...
                </td>
              </tr>
            ) : destinations.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={5}>
                  No destinations yet. Add one above.
                </td>
              </tr>
            ) : (
              destinations.map((destination) => (
                <tr key={destination.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{destination.address}</div>
                    <div className="text-xs text-muted-foreground">{destination.destinationName}</div>
                  </td>
                  <td className="px-4 py-3">{destination.weight}</td>
                  <td className="px-4 py-3">{destination.priority}</td>
                  <td className="px-4 py-3">
                    <Badge variant={destination.isEnabled ? "success" : "neutral"}>{destination.isEnabled ? "Active" : "Disabled"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{destination.healthStatus ?? "Unknown"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {endpoint ? `Destinations for ${endpoint.endpointName}. Update weights to shift traffic gradually.` : "Configure routing weights per destination."}
      </div>
    </div>
  );
}
