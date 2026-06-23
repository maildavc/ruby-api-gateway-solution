import { SectionHeader } from "@/components/common/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StatusPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Gateway status" description="Real-time health checks and uptime history." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Global status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="success">Operational</Badge>
            <p className="mt-2 text-sm text-muted-foreground">All systems normal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">182 ms</p>
            <p className="mt-2 text-sm text-muted-foreground">Global edge median</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">99.98%</p>
            <p className="mt-2 text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Regional checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-lg border border-border px-4 py-3 text-sm">
              <p className="font-medium text-foreground">US East</p>
              <p className="text-xs text-muted-foreground">Healthy · 165 ms</p>
            </div>
            <div className="rounded-lg border border-border px-4 py-3 text-sm">
              <p className="font-medium text-foreground">EU West</p>
              <p className="text-xs text-muted-foreground">Healthy · 190 ms</p>
            </div>
            <div className="rounded-lg border border-border px-4 py-3 text-sm">
              <p className="font-medium text-foreground">APAC</p>
              <p className="text-xs text-muted-foreground">Degraded · 320 ms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
