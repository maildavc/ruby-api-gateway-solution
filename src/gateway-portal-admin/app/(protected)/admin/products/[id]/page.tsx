"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { deleteProduct, getProduct, getServices, updateProduct } from "@/lib/api/admin";
import type { ManagementProduct, ManagementService } from "@/types/management";

const tabs = ["Overview", "Services", "Metadata", "Owners"] as const;

export default function ProductDetailPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [product, setProduct] = useState<ManagementProduct | null>(null);
  const [services, setServices] = useState<ManagementService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    ownerTeam: "",
    isEnabled: true,
  });

  useEffect(() => {
    if (!productId) return;
    const resolvedProductId = productId;
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [productData, servicesData] = await Promise.all([
          getProduct(resolvedProductId),
          getServices({ productId: resolvedProductId, enabledOnly: false }),
        ]);
        if (!mounted) return;
        setProduct(productData);
        setServices(servicesData);
        setFormState({
          name: productData.name,
          description: productData.description,
          ownerTeam: productData.ownerTeam,
          isEnabled: productData.isEnabled,
        });
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load product.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const handleSave = async () => {
    if (!productId) return;
    const resolvedProductId = productId;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProduct(resolvedProductId, {
        name: formState.name.trim(),
        description: formState.description.trim(),
        ownerTeam: formState.ownerTeam.trim(),
        isEnabled: formState.isEnabled,
      });
      setProduct(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    const resolvedProductId = productId;
    setError(null);
    try {
      await deleteProduct(resolvedProductId);
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Product detail"
        description="Lifecycle status, services, and governance notes."
        backHref="/admin/products"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission="product.manage">
              <Button onClick={handleSave} disabled={saving || loading || !product}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </PermissionGate>
            <PermissionGate permission="product.manage">
              <ConfirmDialog
                title="Delete product?"
                description="This marks the product as deleted (disabled) and it will no longer appear in the developer portal."
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
            <CardTitle>{product?.name ?? "Loading..."}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={product?.isEnabled ? "success" : "neutral"}>{product?.isEnabled ? "Active" : "Disabled"}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner team</p>
                <p className="font-medium text-foreground">{product?.ownerTeam ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium text-foreground">{product?.createdAt ? new Date(product.createdAt).toLocaleString() : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="font-medium text-foreground">{product?.updatedAt ? new Date(product.updatedAt).toLocaleString() : "-"}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-name">Name</Label>
                <Input
                  id="product-name"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Product name"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-owner">Owner team</Label>
                <Input
                  id="product-owner"
                  value={formState.ownerTeam}
                  onChange={(event) => setFormState((prev) => ({ ...prev, ownerTeam: event.target.value }))}
                  placeholder="Owner team"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Input
                id="product-description"
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Describe the product"
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <input
                id="product-enabled"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={formState.isEnabled}
                onChange={(event) => setFormState((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                disabled={loading}
              />
              <Label htmlFor="product-enabled">Enabled</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "Services" && (
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {loading ? (
              <div className="rounded-xl border border-border px-4 py-3 text-muted-foreground">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="rounded-xl border border-border px-4 py-3 text-muted-foreground">No services yet.</div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="rounded-xl border border-border px-4 py-3">
                  {service.serviceName} · {service.version} · {service.isEnabled ? "Active" : "Disabled"}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "Metadata" && (
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="text-muted-foreground">Add business metadata in a future release.</div>
          </CardContent>
        </Card>
      )}

      {activeTab === "Owners" && (
        <Card>
          <CardHeader>
            <CardTitle>Owners & approvers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl border border-border px-4 py-3 text-muted-foreground">Ownership contacts managed outside this portal.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
