import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SsoProviderConfig } from "@/types/admin";

const providers: SsoProviderConfig[] = [
  {
    id: "sso_azure",
    name: "Azure AD",
    status: "enabled",
    domains: ["gapeiro.dev"],
    protocol: "oidc",
    lastSyncedAt: "2026-02-10T08:40:00Z",
  },
  {
    id: "sso_okta",
    name: "Okta",
    status: "disabled",
    domains: ["partner.dev"],
    protocol: "saml",
  },
  {
    id: "sso_google",
    name: "Google Workspace",
    status: "disabled",
    domains: [],
    protocol: "oidc",
  },
];

export default function SsoSettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="SSO settings"
        description="Configure enterprise identity providers, domains, and enforcement rules."
        action={
          <PermissionGate permission="sso.manage">
            <Button>Configure provider</Button>
          </PermissionGate>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="text-xs uppercase text-muted-foreground">Policy</p>
          <p className="mt-2 font-semibold text-foreground">Enforce SSO for admins</p>
          <p className="mt-1 text-xs text-muted-foreground">Require SSO for all privileged accounts.</p>
          <Button className="mt-3" variant="outline" size="sm">
            Manage policy
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="text-xs uppercase text-muted-foreground">MFA</p>
          <p className="mt-2 font-semibold text-foreground">Conditional access</p>
          <p className="mt-1 text-xs text-muted-foreground">Enforce MFA and device policies via IdP.</p>
          <Button className="mt-3" variant="outline" size="sm">
            Review requirements
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="text-xs uppercase text-muted-foreground">Domains</p>
          <p className="mt-2 font-semibold text-foreground">Allowed domains</p>
          <p className="mt-1 text-xs text-muted-foreground">Restrict access to corporate email domains.</p>
          <Button className="mt-3" variant="outline" size="sm">
            Edit domains
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Protocol</th>
              <th className="px-4 py-3">Domains</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last sync</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{provider.name}</td>
                <td className="px-4 py-3 uppercase text-xs text-muted-foreground">{provider.protocol}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {provider.domains.length ? provider.domains.join(", ") : "Not set"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={provider.status === "enabled" ? "success" : "warning"}>{provider.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {provider.lastSyncedAt ? new Date(provider.lastSyncedAt).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm">
                    Manage
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
