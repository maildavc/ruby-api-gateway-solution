import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Alerts & notifications"
        description="Configure alert rules and notification channels."
        action={
          <PermissionGate permission="alerts.manage">
            <Button>Create alert</Button>
          </PermissionGate>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Alert rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-xl border border-border px-4 py-3">Error rate &gt; 2% for 5m · Email, Slack</div>
          <div className="rounded-xl border border-border px-4 py-3">p95 latency &gt; 500ms · Pager</div>
          <div className="rounded-xl border border-border px-4 py-3">Destination unhealthy · Webhook</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Notification channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-xl border border-border px-4 py-3">Email: oncall@gapeiro.dev</div>
          <div className="rounded-xl border border-border px-4 py-3">Slack: #gateway-alerts</div>
          <div className="rounded-xl border border-border px-4 py-3">Webhook: https://hooks.gapeiro.dev/gateway</div>
        </CardContent>
      </Card>
    </div>
  );
}
