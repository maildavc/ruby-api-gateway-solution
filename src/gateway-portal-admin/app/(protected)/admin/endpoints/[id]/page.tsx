"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { getEndpoint, getService, getServiceDestinations, updateEndpoint } from "@/lib/api/admin";
import type { ManagementEndpoint, ManagementService, ManagementServiceDestination } from "@/types/management";

const tabs = ["Overview", "Security & Policies", "Destinations", "Observability"] as const;

export default function EndpointDetailPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const params = useParams();
  const endpointId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [endpoint, setEndpoint] = useState<ManagementEndpoint | null>(null);
  const [service, setService] = useState<ManagementService | null>(null);
  const [destinations, setDestinations] = useState<ManagementServiceDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    endpointName: "",
    httpMethod: "POST",
    relativePath: "",
    upstreamPathTemplate: "",
    timeoutMs: 30000,
    maxRetries: 0,
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
        const [serviceData, destinationsData] = await Promise.all([
          getService(endpointData.serviceId),
          getServiceDestinations(endpointData.serviceId),
        ]);
        if (!mounted) return;
        setEndpoint(endpointData);
        setService(serviceData);
        setDestinations(destinationsData);
        setFormState({
          endpointName: endpointData.endpointName,
          httpMethod: endpointData.httpMethod,
          relativePath: endpointData.relativePath,
          upstreamPathTemplate: endpointData.upstreamPathTemplate ?? "",
          timeoutMs: endpointData.timeoutMs,
          maxRetries: endpointData.maxRetries,
          isEnabled: endpointData.isEnabled,
        });
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load endpoint.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [endpointId]);

  const handleSave = async () => {
    if (!endpointId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateEndpoint(endpointId, {
        endpointName: formState.endpointName.trim(),
        httpMethod: formState.httpMethod.trim(),
        relativePath: formState.relativePath.trim(),
        upstreamPathTemplate: formState.upstreamPathTemplate.trim() || undefined,
        timeoutMs: formState.timeoutMs,
        maxRetries: formState.maxRetries,
        isEnabled: formState.isEnabled,
      });
      setEndpoint(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update endpoint.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Endpoint detail"
        description="Review routing, auth, and resilience settings."
        backHref="/admin/endpoints"
        action={
          <PermissionGate permission="endpoint.manage">
            <Button onClick={handleSave} disabled={saving || loading || !endpoint}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </PermissionGate>
        }
      />
      {error && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? "default" : "outline"} onClick={() => setActiveTab(tab)}>
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {endpoint ? `${endpoint.httpMethod} ${endpoint.relativePath}` : "Loading..."}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{endpoint?.endpointName ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-medium text-foreground">{service?.serviceName ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Method</p>
              <p className="font-medium text-foreground">{endpoint?.httpMethod ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Route</p>
              <p className="font-medium text-foreground">{endpoint?.relativePath ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timeout</p>
              <p className="font-medium text-foreground">{endpoint?.timeoutMs ?? 0} ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retries</p>
              <p className="font-medium text-foreground">{endpoint?.maxRetries ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={endpoint?.isEnabled ? "success" : "neutral"}>{endpoint?.isEnabled ? "Active" : "Disabled"}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "Security & Policies" && (
        <Card>
          <CardHeader>
            <CardTitle>Security & policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="endpoint-name">Endpoint name</Label>
                <Input
                  id="endpoint-name"
                  value={formState.endpointName}
                  onChange={(event) => setFormState((prev) => ({ ...prev, endpointName: event.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endpoint-method">HTTP method</Label>
                <select
                  id="endpoint-method"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  value={formState.httpMethod}
                  onChange={(event) => setFormState((prev) => ({ ...prev, httpMethod: event.target.value }))}
                  disabled={loading}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="endpoint-timeout">Timeout (ms)</Label>
                <Input
                  id="endpoint-timeout"
                  type="number"
                  value={formState.timeoutMs}
                  onChange={(event) => setFormState((prev) => ({ ...prev, timeoutMs: Number(event.target.value) }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endpoint-retries">Retries</Label>
                <Input
                  id="endpoint-retries"
                  type="number"
                  value={formState.maxRetries}
                  onChange={(event) => setFormState((prev) => ({ ...prev, maxRetries: Number(event.target.value) }))}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint-path">Relative path</Label>
              <Input
                id="endpoint-path"
                value={formState.relativePath}
                onChange={(event) => setFormState((prev) => ({ ...prev, relativePath: event.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint-upstream">Upstream path template</Label>
              <Input
                id="endpoint-upstream"
                value={formState.upstreamPathTemplate}
                onChange={(event) => setFormState((prev) => ({ ...prev, upstreamPathTemplate: event.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <input
                id="endpoint-enabled"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={formState.isEnabled}
                onChange={(event) => setFormState((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                disabled={loading}
              />
              <Label htmlFor="endpoint-enabled">Enabled</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "Destinations" && (
        <Card>
          <CardHeader>
            <CardTitle>Destinations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {loading ? (
              <div className="rounded-xl border border-border px-4 py-3 text-muted-foreground">Loading destinations...</div>
            ) : destinations.length === 0 ? (
              <div className="rounded-xl border border-border px-4 py-3 text-muted-foreground">No destinations configured yet.</div>
            ) : (
              destinations.map((destination) => (
                <div key={destination.id} className="rounded-xl border border-border px-4 py-3">
                  {destination.address} · Weight {destination.weight}
                </div>
              ))
            )}
            <Button variant="outline" asChild>
              <Link href={`/admin/endpoints/${endpointId}/destinations`}>Manage destinations</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "Observability" && (
        <Card>
          <CardHeader>
            <CardTitle>Observability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl border border-border px-4 py-3">p95 latency: 210ms</div>
            <div className="rounded-xl border border-border px-4 py-3">Error rate: 0.3%</div>
            <div className="rounded-xl border border-border px-4 py-3">Traffic: 820 rps</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
