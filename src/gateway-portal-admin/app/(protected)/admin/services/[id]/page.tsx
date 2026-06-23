"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { deleteService, getEndpoints, getService, parseJsonArray, updateService } from "@/lib/api/admin";
import type { ManagementEndpoint, ManagementService } from "@/types/management";

const tabs = ["Overview", "Endpoints", "Config"] as const;

export default function ServiceDetailPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const params = useParams();
  const router = useRouter();
  const serviceId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [service, setService] = useState<ManagementService | null>(null);
  const [endpoints, setEndpoints] = useState<ManagementEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    serviceName: "",
    basePath: "",
    version: "",
    description: "",
    ownerTeam: "",
    clusterId: "",
    environment: "Dev",
    destinations: "",
    isEnabled: true,
  });

  useEffect(() => {
    if (!serviceId) return;
    const resolvedServiceId = serviceId;
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [serviceData, endpointsData] = await Promise.all([
          getService(resolvedServiceId),
          getEndpoints({ serviceId: resolvedServiceId, enabledOnly: false }),
        ]);
        if (!mounted) return;
        setService(serviceData);
        setEndpoints(endpointsData);
        setFormState({
          serviceName: serviceData.serviceName,
          basePath: serviceData.basePath,
          version: serviceData.version,
          description: serviceData.description,
          ownerTeam: serviceData.ownerTeam,
          clusterId: serviceData.clusterId,
          environment: serviceData.environment ?? "Dev",
          destinations: parseJsonArray(serviceData.destinations).join(", "),
          isEnabled: serviceData.isEnabled,
        });
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load service.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [serviceId]);

  const handleSave = async () => {
    if (!serviceId) return;
    const resolvedServiceId = serviceId;
    setSaving(true);
    setError(null);
    try {
      const destinations = formState.destinations
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const updated = await updateService(resolvedServiceId, {
        serviceName: formState.serviceName.trim(),
        basePath: formState.basePath.trim(),
        version: formState.version.trim(),
        description: formState.description.trim(),
        ownerTeam: formState.ownerTeam.trim(),
        clusterId: formState.clusterId.trim(),
        environment: formState.environment,
        destinations,
        isEnabled: formState.isEnabled,
      });
      setService(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceId) return;
    const resolvedServiceId = serviceId;
    setError(null);
    try {
      await deleteService(resolvedServiceId);
      router.push("/admin/services");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Service detail"
        description="Configure base path, crypto, and resilience policies."
        backHref="/admin/services"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission="service.manage">
              <Button onClick={handleSave} disabled={saving || loading || !service}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </PermissionGate>
            <PermissionGate permission="service.manage">
              <ConfirmDialog
                title="Delete service?"
                description="This marks the service as deleted (disabled). Its endpoints will no longer be shown in the developer portal."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={handleDelete}
                trigger={
                  <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10">
                    Delete
                  </Button>
                }
              />
            </PermissionGate>
          </div>
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
            <CardTitle>{service ? `${service.serviceName} ${service.version}` : "Loading..."}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={service?.isEnabled ? "success" : "neutral"}>{service?.isEnabled ? "Active" : "Disabled"}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Base path</p>
              <p className="font-medium text-foreground">{service?.basePath ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium text-foreground">{service?.version ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <Badge variant={service?.environment ? String(service.environment).toLowerCase() === "prod" ? "danger" : "info" : "info"}>
                {service?.environment ? String(service.environment).toLowerCase() : "dev"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "Endpoints" && (
        <Card>
          <CardHeader>
            <CardTitle>Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {loading ? (
              <div className="rounded-xl border border-border px-4 py-3 text-muted-foreground">Loading endpoints...</div>
            ) : endpoints.length === 0 ? (
              <div className="rounded-xl border border-border px-4 py-3 text-muted-foreground">No endpoints configured yet.</div>
            ) : (
              endpoints.map((endpoint) => (
                <div key={endpoint.id} className="rounded-xl border border-border px-4 py-3">
                  {endpoint.httpMethod} {endpoint.relativePath} · {endpoint.isEnabled ? "Active" : "Disabled"}
                </div>
              ))
            )}
            <Button variant="outline" asChild>
              <Link href="/admin/endpoints">Manage endpoints</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "Config" && (
        <Card>
          <CardHeader>
            <CardTitle>Service configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-name">Service name</Label>
                <Input
                  id="service-name"
                  value={formState.serviceName}
                  onChange={(event) => setFormState((prev) => ({ ...prev, serviceName: event.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-base">Base path</Label>
                <Input
                  id="service-base"
                  value={formState.basePath}
                  onChange={(event) => setFormState((prev) => ({ ...prev, basePath: event.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-version">Version</Label>
                <Input
                  id="service-version"
                  value={formState.version}
                  onChange={(event) => setFormState((prev) => ({ ...prev, version: event.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-env">Environment</Label>
                <select
                  id="service-env"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  value={formState.environment}
                  onChange={(event) => setFormState((prev) => ({ ...prev, environment: event.target.value }))}
                >
                  <option value="Dev">Dev</option>
                  <option value="Uat">UAT</option>
                  <option value="Staging">Staging</option>
                  <option value="Prod">Prod</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-owner">Owner team</Label>
                <Input
                  id="service-owner"
                  value={formState.ownerTeam}
                  onChange={(event) => setFormState((prev) => ({ ...prev, ownerTeam: event.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-cluster">Cluster ID</Label>
                <Input
                  id="service-cluster"
                  value={formState.clusterId}
                  onChange={(event) => setFormState((prev) => ({ ...prev, clusterId: event.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-description">Description</Label>
              <Input
                id="service-description"
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-destinations">Destinations (comma-separated URLs)</Label>
              <Input
                id="service-destinations"
                value={formState.destinations}
                onChange={(event) => setFormState((prev) => ({ ...prev, destinations: event.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <input
                id="service-enabled"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={formState.isEnabled}
                onChange={(event) => setFormState((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                disabled={loading}
              />
              <Label htmlFor="service-enabled">Enabled</Label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
