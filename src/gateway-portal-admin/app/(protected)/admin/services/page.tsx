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
import { createService, getProducts, getServices, parseJsonArray } from "@/lib/api/admin";
import type { ManagementProduct, ManagementService } from "@/types/management";

export default function ServicesPage() {
  const [services, setServices] = useState<ManagementService[]>([]);
  const [products, setProducts] = useState<ManagementProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState({
    productId: "",
    serviceName: "",
    basePath: "",
    version: "v1",
    description: "",
    ownerTeam: "",
    clusterId: "primary",
    destinations: "",
    environment: "Dev",
    isEnabled: true,
  });

  const productLookup = useMemo(() => {
    return products.reduce<Record<string, string>>((acc, product) => {
      acc[product.id] = product.name;
      return acc;
    }, {});
  }, [products]);

  const filteredServices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return services;
    return services.filter((service) =>
      service.serviceName.toLowerCase().includes(term) ||
      service.basePath.toLowerCase().includes(term) ||
      service.version.toLowerCase().includes(term) ||
      service.ownerTeam.toLowerCase().includes(term) ||
      (productLookup[service.productId] ?? "").toLowerCase().includes(term)
    );
  }, [services, searchTerm, productLookup]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [servicesData, productsData] = await Promise.all([
          getServices({ enabledOnly: false }),
          getProducts(false),
        ]);
        if (!mounted) return;
        setServices(servicesData);
        setProducts(productsData);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load services.");
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
      const destinations = formState.destinations
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const created = await createService({
        productId: formState.productId,
        serviceName: formState.serviceName.trim(),
        basePath: formState.basePath.trim(),
        version: formState.version.trim(),
        description: formState.description.trim(),
        ownerTeam: formState.ownerTeam.trim(),
        clusterId: formState.clusterId.trim(),
        destinations,
        environment: formState.environment,
        isEnabled: formState.isEnabled,
      });
      setServices((prev) => [created, ...prev]);
      setFormState({
        productId: "",
        serviceName: "",
        basePath: "",
        version: "v1",
        description: "",
        ownerTeam: "",
        clusterId: "primary",
        destinations: "",
        environment: "Dev",
        isEnabled: true,
      });
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Services"
        description="Manage service configs, encryption, and lifecycle."
        action={
          <PermissionGate permission="service.manage">
            <FormDialog
              title="Create service"
              description="Add a new service and upstream destinations."
              trigger={<Button>Create service</Button>}
              open={isOpen}
              onOpenChange={setIsOpen}
              submitLabel={submitting ? "Creating..." : "Create service"}
              submitDisabled={submitting || !formState.productId}
              onSubmit={handleSubmit}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="service-product">Product</Label>
                  <select
                    id="service-product"
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                    value={formState.productId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, productId: event.target.value }))}
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-name">Service name</Label>
                  <Input
                    id="service-name"
                    value={formState.serviceName}
                    onChange={(event) => setFormState((prev) => ({ ...prev, serviceName: event.target.value }))}
                    placeholder="PayHub Transfers"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-base">Base path</Label>
                  <Input
                    id="service-base"
                    value={formState.basePath}
                    onChange={(event) => setFormState((prev) => ({ ...prev, basePath: event.target.value }))}
                    placeholder="/payhub"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-version">Version</Label>
                  <Input
                    id="service-version"
                    value={formState.version}
                    onChange={(event) => setFormState((prev) => ({ ...prev, version: event.target.value }))}
                    placeholder="v1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-owner">Owner team</Label>
                  <Input
                    id="service-owner"
                    value={formState.ownerTeam}
                    onChange={(event) => setFormState((prev) => ({ ...prev, ownerTeam: event.target.value }))}
                    placeholder="Payments"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-cluster">Cluster ID</Label>
                  <Input
                    id="service-cluster"
                    value={formState.clusterId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, clusterId: event.target.value }))}
                    placeholder="primary"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="service-description">Description</Label>
                  <Input
                    id="service-description"
                    value={formState.description}
                    onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Payments and transfer APIs"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="service-destinations">Destinations (comma-separated URLs)</Label>
                  <Input
                    id="service-destinations"
                    value={formState.destinations}
                    onChange={(event) => setFormState((prev) => ({ ...prev, destinations: event.target.value }))}
                    placeholder="https://prod.payhub.primary, https://prod.payhub.secondary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-environment">Environment</Label>
                  <select
                    id="service-environment"
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                    value={formState.environment}
                    onChange={(event) => setFormState((prev) => ({ ...prev, environment: event.target.value }))}
                  >
                    <option value="Dev">Dev</option>
                    <option value="Uat">UAT</option>
                    <option value="Staging">Staging</option>
                    <option value="Prod">Prod</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    id="service-enabled"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={formState.isEnabled}
                    onChange={(event) => setFormState((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                  />
                  <Label htmlFor="service-enabled">Enabled</Label>
                </div>
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
            </FormDialog>
          </PermissionGate>
        }
      />
      {error && !isOpen && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="max-w-md">
        <Label htmlFor="services-search">Search services</Label>
        <Input
          id="services-search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by service, product, path, version, or owner"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Base path</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Env</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={7}>
                  Loading services...
                </td>
              </tr>
            ) : filteredServices.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={7}>
                  No services match your search.
                </td>
              </tr>
            ) : (
              filteredServices.map((service) => {
                const destinations = parseJsonArray(service.destinations);
                const envLabel = service.environment ? String(service.environment).toLowerCase() : "dev";
                return (
                  <tr key={service.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">{service.serviceName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{productLookup[service.productId] ?? "Unknown"}</td>
                    <td className="px-4 py-3">{service.basePath}</td>
                    <td className="px-4 py-3">{service.version}</td>
                    <td className="px-4 py-3">
                      <Badge variant={envLabel === "prod" ? "danger" : "info"}>
                        {envLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={service.isEnabled ? "success" : "neutral"}>{service.isEnabled ? "active" : "disabled"}</Badge>
                      {destinations.length > 0 && (
                        <div className="text-xs text-muted-foreground">{destinations.length} destinations</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/services/${service.id}`}>Manage</Link>
                      </Button>
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
