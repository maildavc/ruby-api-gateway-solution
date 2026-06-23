"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

import { FormDialog } from "@/components/common/FormDialog";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { createEndpoint, getEndpoints, getServices } from "@/lib/api/admin";
import type { ManagementEndpoint, ManagementService } from "@/types/management";

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<ManagementEndpoint[]>([]);
  const [services, setServices] = useState<ManagementService[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [formState, setFormState] = useState({
    serviceId: "",
    endpointName: "",
    httpMethod: "POST",
    relativePath: "",
    upstreamPathTemplate: "",
    isEnabled: true,
  });

  const serviceLookup = useMemo(() => {
    return services.reduce<Record<string, string>>((acc, service) => {
      acc[service.id] = service.serviceName;
      return acc;
    }, {});
  }, [services]);

  const filteredEndpoints = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return endpoints.filter((endpoint) => {
      if (selectedServiceId && endpoint.serviceId !== selectedServiceId) {
        return false;
      }

      if (!term) {
        return true;
      }

      const serviceName = (serviceLookup[endpoint.serviceId] ?? "").toLowerCase();
      return (
        endpoint.endpointName.toLowerCase().includes(term) ||
        endpoint.httpMethod.toLowerCase().includes(term) ||
        endpoint.relativePath.toLowerCase().includes(term) ||
        serviceName.includes(term)
      );
    });
  }, [endpoints, selectedServiceId, searchTerm, serviceLookup]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [endpointsData, servicesData] = await Promise.all([
          getEndpoints({ enabledOnly: false }),
          getServices({ enabledOnly: false }),
        ]);
        if (!mounted) return;
        setEndpoints(endpointsData);
        setServices(servicesData);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load endpoints.");
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
      const created = await createEndpoint({
        serviceId: formState.serviceId,
        endpointName: formState.endpointName.trim(),
        httpMethod: formState.httpMethod.trim(),
        relativePath: formState.relativePath.trim(),
        upstreamPathTemplate: formState.upstreamPathTemplate.trim() || undefined,
        isEnabled: formState.isEnabled,
      });
      setEndpoints((prev) => [created, ...prev]);
      setFormState({
        serviceId: "",
        endpointName: "",
        httpMethod: "POST",
        relativePath: "",
        upstreamPathTemplate: "",
        isEnabled: true,
      });
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create endpoint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Endpoints"
        description="Manage routes, security, and policies across services."
        action={
          <PermissionGate permission="endpoint.manage">
            <FormDialog
              title="Create endpoint"
              description="Add a new endpoint to a service."
              trigger={<Button>Create endpoint</Button>}
              open={isOpen}
              onOpenChange={setIsOpen}
              submitLabel={submitting ? "Creating..." : "Create endpoint"}
              submitDisabled={submitting || !formState.serviceId}
              onSubmit={handleSubmit}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="endpoint-service">Service</Label>
                  <select
                    id="endpoint-service"
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                    value={formState.serviceId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, serviceId: event.target.value }))}
                    required
                  >
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.serviceName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endpoint-name">Endpoint name</Label>
                  <Input
                    id="endpoint-name"
                    value={formState.endpointName}
                    onChange={(event) => setFormState((prev) => ({ ...prev, endpointName: event.target.value }))}
                    placeholder="Create transfer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endpoint-method">Method</Label>
                  <select
                    id="endpoint-method"
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                    value={formState.httpMethod}
                    onChange={(event) => setFormState((prev) => ({ ...prev, httpMethod: event.target.value }))}
                    required
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endpoint-path">Relative path</Label>
                  <Input
                    id="endpoint-path"
                    value={formState.relativePath}
                    onChange={(event) => setFormState((prev) => ({ ...prev, relativePath: event.target.value }))}
                    placeholder="/transfers"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endpoint-upstream">Upstream path template (optional)</Label>
                  <Input
                    id="endpoint-upstream"
                    value={formState.upstreamPathTemplate}
                    onChange={(event) => setFormState((prev) => ({ ...prev, upstreamPathTemplate: event.target.value }))}
                    placeholder="/api/v2/transfers"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    id="endpoint-enabled"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={formState.isEnabled}
                    onChange={(event) => setFormState((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                  />
                  <Label htmlFor="endpoint-enabled">Enabled</Label>
                </div>
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
            </FormDialog>
          </PermissionGate>
        }
      />
      {error && !isOpen && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="max-w-md">
        <Label htmlFor="endpoints-search">Search endpoints</Label>
        <Input
          id="endpoints-search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by endpoint, method, route, or service"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-2">
          <Label htmlFor="endpoint-service-filter">Filter by service</Label>
          <select
            id="endpoint-service-filter"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            value={selectedServiceId}
            onChange={(event) => setSelectedServiceId(event.target.value)}
          >
            <option value="">All services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.serviceName}
              </option>
            ))}
          </select>
        </div>
        {selectedServiceId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedServiceId("")}
            className="mt-6"
          >
            Clear filter
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Endpoint</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Timeout</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={7}>
                  Loading endpoints...
                </td>
              </tr>
            ) : filteredEndpoints.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={7}>
                  {selectedServiceId
                    ? "No endpoints for this service match your filters."
                    : searchTerm
                      ? "No endpoints match your search."
                      : "No endpoints yet. Create the first endpoint above."}
                </td>
              </tr>
            ) : (
              filteredEndpoints.map((endpoint) => (
                <tr key={endpoint.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">{endpoint.endpointName}</td>
                  <td className="px-4 py-3">{endpoint.httpMethod}</td>
                  <td className="px-4 py-3 text-muted-foreground">{endpoint.relativePath}</td>
                  <td className="px-4 py-3 text-muted-foreground">{serviceLookup[endpoint.serviceId] ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{endpoint.timeoutMs} ms</td>
                  <td className="px-4 py-3">
                    <Badge variant={endpoint.isEnabled ? "success" : "neutral"}>{endpoint.isEnabled ? "active" : "disabled"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/endpoints/${endpoint.id}`}>Manage</Link>
                    </Button>
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
