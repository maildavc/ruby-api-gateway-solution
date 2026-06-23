import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { AdminUser } from "@/types/admin";

const users: AdminUser[] = [
  {
    id: "user_1",
    name: "Alex Johnson",
    email: "alex@gapeiro.dev",
    role: "admin",
    status: "active",
    lastLoginAt: "2026-02-08T08:00:00Z",
    mfaEnabled: true,
    providers: ["azure-ad", "google"],
    groupsCount: 3,
  },
  {
    id: "user_2",
    name: "Lina Chen",
    email: "lina@gapeiro.dev",
    role: "owner",
    status: "active",
    lastLoginAt: "2026-02-07T18:20:00Z",
    mfaEnabled: true,
    providers: ["azure-ad"],
    groupsCount: 2,
  },
  {
    id: "user_3",
    name: "Sam Rivera",
    email: "sam@gapeiro.dev",
    role: "auditor",
    status: "disabled",
    lastLoginAt: "2026-01-30T11:45:00Z",
    mfaEnabled: false,
    providers: ["github"],
    groupsCount: 1,
  },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Users"
        description="Manage admin users, access, and enforcement policies."
        action={
          <PermissionGate permission="user.manage">
            <Button asChild>
              <Link href="/admin/users/new">Invite user</Link>
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
        <input className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground" placeholder="Search users" />
        <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <option>Role: All</option>
          <option>Admin</option>
          <option>Owner</option>
          <option>Auditor</option>
        </select>
        <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <option>Status: All</option>
          <option>Active</option>
          <option>Disabled</option>
        </select>
        <Button variant="outline" size="sm">
          Apply
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Providers</th>
              <th className="px-4 py-3">Groups</th>
              <th className="px-4 py-3">MFA</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last login</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {(user.providers ?? []).map((provider) => (
                      <Badge key={provider} variant="neutral" className="capitalize">
                        {provider.replace("-", " ")}
                      </Badge>
                    ))}
                    {(user.providers ?? []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">Email</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="info">{user.groupsCount ?? 0} groups</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.mfaEnabled ? "success" : "warning"}>{user.mfaEnabled ? "Enabled" : "Optional"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.status === "active" ? "success" : "warning"}>{user.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/users/${user.id}`}>Manage</Link>
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
