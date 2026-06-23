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
import { createProduct, getProducts, getServices } from "@/lib/api/admin";
import type { ManagementProduct, ManagementService } from "@/types/management";

export default function ProductsPage() {
  const [products, setProducts] = useState<ManagementProduct[]>([]);
  const [services, setServices] = useState<ManagementService[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    ownerTeam: "",
    isEnabled: true,
  });

  const servicesByProduct = useMemo(() => {
    return services.reduce<Record<string, number>>((acc, service) => {
      acc[service.productId] = (acc[service.productId] ?? 0) + 1;
      return acc;
    }, {});
  }, [services]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(term) ||
      product.ownerTeam.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [productsData, servicesData] = await Promise.all([getProducts(false), getServices({ enabledOnly: false })]);
        if (!mounted) return;
        setProducts(productsData);
        setServices(servicesData);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load products.");
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
      const created = await createProduct({
        name: formState.name.trim(),
        description: formState.description.trim(),
        ownerTeam: formState.ownerTeam.trim(),
        isEnabled: formState.isEnabled,
      });
      setProducts((prev) => [created, ...prev]);
      setFormState({ name: "", description: "", ownerTeam: "", isEnabled: true });
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Products"
        description="Manage product lifecycles and owners."
        action={
          <PermissionGate permission="product.manage">
            <FormDialog
              title="Create product"
              description="Add a new product and owner team."
              trigger={<Button>Create product</Button>}
              open={isOpen}
              onOpenChange={setIsOpen}
              submitLabel={submitting ? "Creating..." : "Create product"}
              submitDisabled={submitting}
              onSubmit={handleSubmit}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Product name</Label>
                  <Input
                    id="product-name"
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="PayHub"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner-team">Owner team</Label>
                  <Input
                    id="owner-team"
                    value={formState.ownerTeam}
                    onChange={(event) => setFormState((prev) => ({ ...prev, ownerTeam: event.target.value }))}
                    placeholder="Payments"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="product-description">Description</Label>
                  <Input
                    id="product-description"
                    value={formState.description}
                    onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Payments and transfer APIs"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    id="product-enabled"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={formState.isEnabled}
                    onChange={(event) => setFormState((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                  />
                  <Label htmlFor="product-enabled">Enabled</Label>
                </div>
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
            </FormDialog>
          </PermissionGate>
        }
      />
      {error && !isOpen && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="max-w-md">
        <Label htmlFor="products-search">Search products</Label>
        <Input
          id="products-search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name, owner team, or description"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Services</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={5}>
                  Loading products...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={5}>
                  No products match your search.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.description}</div>
                  </td>
                  <td className="px-4 py-3">{product.ownerTeam}</td>
                  <td className="px-4 py-3">
                    <Badge variant={product.isEnabled ? "success" : "neutral"}>{product.isEnabled ? "active" : "disabled"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{servicesByProduct[product.id] ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/products/${product.id}`}>Manage</Link>
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
