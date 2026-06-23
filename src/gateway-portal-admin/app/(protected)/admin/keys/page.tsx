import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { ApiKey } from "@/types/admin";

const keys: ApiKey[] = [
  {
    id: "key_1",
    owner: "PayHub Admin",
    status: "active",
    createdAt: "2026-02-01T08:00:00Z",
    lastUsedAt: "2026-02-08T09:15:00Z",
    scopes: ["gateway.config.write", "endpoint.manage"],
    maskedKey: "rk_live_****_9c2a",
  },
  {
    id: "key_2",
    owner: "Audit Bot",
    status: "rotated",
    createdAt: "2025-12-20T12:00:00Z",
    lastUsedAt: "2026-02-05T04:10:00Z",
    scopes: ["audit.read"],
    maskedKey: "rk_live_****_7f1b",
  },
];

export default function KeysPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="API keys" description="Manage admin API keys and sensitive secrets." />
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Scopes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last used</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{key.owner}</td>
                <td className="px-4 py-3 text-muted-foreground">{key.maskedKey}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{key.scopes.join(", ")}</td>
                <td className="px-4 py-3">
                  <Badge variant={key.status === "active" ? "success" : key.status === "rotated" ? "warning" : "danger"}>
                    {key.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/keys/${key.id}`}>View</Link>
                    </Button>
                    <PermissionGate permission="key.reveal">
                      <ConfirmDialog
                        title="Reveal key?"
                        description="Revealing a secret is audited and visible to security admins."
                        confirmLabel="Reveal"
                        trigger={<Button variant="outline" size="sm">Reveal</Button>}
                      />
                    </PermissionGate>
                    <PermissionGate permission="key.rotate">
                      <ConfirmDialog
                        title="Rotate key?"
                        description="This will invalidate the current secret after rotation."
                        confirmLabel="Rotate"
                        trigger={<Button variant="outline" size="sm">Rotate</Button>}
                      />
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
