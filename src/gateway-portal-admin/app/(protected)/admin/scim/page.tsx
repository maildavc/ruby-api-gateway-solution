import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { ScimToken } from "@/types/admin";

const tokens: ScimToken[] = [
  {
    id: "scim_1",
    label: "Okta production",
    status: "active",
    lastUsedAt: "2026-02-10T09:10:00Z",
    createdAt: "2026-01-15T08:00:00Z",
  },
  {
    id: "scim_2",
    label: "Azure AD staging",
    status: "revoked",
    lastUsedAt: "2026-01-20T12:30:00Z",
    createdAt: "2026-01-10T08:00:00Z",
  },
];

export default function ScimPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="SCIM provisioning"
        description="Automate user lifecycle management from your identity provider."
        action={
          <PermissionGate permission="scim.manage">
            <Button>Create token</Button>
          </PermissionGate>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="text-xs uppercase text-muted-foreground">Endpoint</p>
          <p className="mt-2 font-semibold text-foreground">/scim/v2/Users</p>
          <p className="mt-1 text-xs text-muted-foreground">Use this URL in your IdP SCIM app.</p>
          <Button className="mt-3" variant="outline" size="sm">
            Copy endpoint
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="text-xs uppercase text-muted-foreground">Status</p>
          <p className="mt-2 font-semibold text-foreground">Provisioning enabled</p>
          <p className="mt-1 text-xs text-muted-foreground">Users and groups sync every 15 minutes.</p>
          <Button className="mt-3" variant="outline" size="sm">
            View sync logs
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last used</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{token.label}</td>
                <td className="px-4 py-3">
                  <Badge variant={token.status === "active" ? "success" : "warning"}>{token.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(token.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm">
                    Rotate
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
