import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PermissionGate } from "@/components/auth/PermissionGate";

const permissions = [
  "gateway.config.read",
  "gateway.config.write",
  "endpoint.manage",
  "destination.manage",
  "audit.read",
  "observability.read",
];

export default function RoleDetailPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Role detail"
        description="Configure access policies and approval scopes."
        backHref="/admin/roles"
        action={
          <PermissionGate permission="role.manage">
            <Button>Edit role</Button>
          </PermissionGate>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Full control over gateway configuration and policies.</p>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <Badge key={permission} variant="neutral">
                {permission}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
