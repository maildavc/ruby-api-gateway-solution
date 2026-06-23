import Link from "next/link";

import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Role } from "@/types/admin";
import { PermissionGate } from "@/components/auth/PermissionGate";

const roles: Role[] = [
  {
    id: "role_admin",
    name: "Admin",
    description: "Full control over gateway configuration.",
    permissions: ["gateway.config.write", "endpoint.manage", "audit.read"],
  },
  {
    id: "role_owner",
    name: "Owner",
    description: "All permissions including tenant and bulk operations.",
    permissions: ["tenant.manage", "bulk.manage", "alerts.manage"],
  },
  {
    id: "role_auditor",
    name: "Auditor",
    description: "Read-only access to configuration and audit trails.",
    permissions: ["gateway.config.read", "audit.read", "observability.read"],
  },
];

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Roles & permissions"
        description="Define RBAC policies and governance scopes."
        action={
          <PermissionGate permission="role.manage">
            <Button>Create role</Button>
          </PermissionGate>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Permissions</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{role.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{role.description}</td>
                <td className="px-4 py-3">
                  <Badge variant="info">{role.permissions.length} permissions</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/roles/${role.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
