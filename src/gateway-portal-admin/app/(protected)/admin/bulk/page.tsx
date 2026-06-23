import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function BulkOpsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Bulk operations" description="Perform bulk updates with validation previews." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bulk enable/disable endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Upload a CSV of endpoint IDs and desired status.</p>
            <PermissionGate permission="bulk.manage">
              <Button>Upload CSV</Button>
            </PermissionGate>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bulk policy assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Apply rate limit or auth policies to multiple endpoints.</p>
            <PermissionGate permission="bulk.manage">
              <Button variant="outline">Start bulk assignment</Button>
            </PermissionGate>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
