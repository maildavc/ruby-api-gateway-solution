import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/auth/PermissionGate";

const tenants = [
  { id: "tenant_1", name: "Gapeiro Fintech", env: "prod", status: "active" },
  { id: "tenant_2", name: "SeaBaas Sandbox", env: "staging", status: "active" },
  { id: "tenant_3", name: "Legacy Banking", env: "uat", status: "inactive" },
];

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tenants"
        description="Manage organizations, quotas, and environment scopes."
        action={
          <PermissionGate permission="tenant.manage">
            <Button>Create tenant</Button>
          </PermissionGate>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{tenant.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={tenant.env === "prod" ? "danger" : "info"}>{tenant.env}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={tenant.status === "active" ? "success" : "warning"}>{tenant.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
