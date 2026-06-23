import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Maintenance windows"
        description="Schedule planned downtime banners and delayed activations."
        action={
          <PermissionGate permission="gateway.config.write">
            <Button>Schedule maintenance</Button>
          </PermissionGate>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Upcoming windows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-xl border border-border px-4 py-3">Feb 15, 2026 · 02:00 - 04:00 UTC · API gateway patching</div>
          <div className="rounded-xl border border-border px-4 py-3">Mar 1, 2026 · 01:00 - 02:00 UTC · Policy engine upgrade</div>
        </CardContent>
      </Card>
    </div>
  );
}
