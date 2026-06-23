import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function KeyDetailPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Key detail" description="Sensitive key metadata and access control." backHref="/admin/keys" />
      <Card>
        <CardHeader>
          <CardTitle>Key metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Owner</p>
            <p className="font-medium text-foreground">PayHub Admin</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">App</p>
            <p className="font-medium text-foreground">payhub-control-plane</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="success">Active</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="font-medium text-foreground">Feb 1, 2026</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last used</p>
            <p className="font-medium text-foreground">Feb 8, 2026</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Scopes</p>
            <p className="font-medium text-foreground">gateway.config.write, endpoint.manage</p>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center gap-2">
        <PermissionGate permission="key.reveal">
          <ConfirmDialog
            title="Reveal key?"
            description="Revealing a secret is audited and visible to security admins."
            confirmLabel="Reveal"
            trigger={<Button variant="outline">Reveal</Button>}
          />
        </PermissionGate>
        <PermissionGate permission="key.rotate">
          <ConfirmDialog
            title="Rotate key?"
            description="This will invalidate the current secret after rotation."
            confirmLabel="Rotate"
            trigger={<Button variant="outline">Rotate</Button>}
          />
        </PermissionGate>
        <PermissionGate permission="key.revoke">
          <ConfirmDialog
            title="Revoke key?"
            description="The key will be disabled immediately."
            confirmLabel="Revoke"
            variant="destructive"
            trigger={<Button variant="outline">Revoke</Button>}
          />
        </PermissionGate>
      </div>
    </div>
  );
}
