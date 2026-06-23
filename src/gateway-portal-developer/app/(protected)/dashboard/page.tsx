import { Activity, KeyRound, ShieldCheck, Zap } from "lucide-react";

import { SectionHeader } from "@/components/common/SectionHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatLatency } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/date";

const recentLogs = [
  {
    id: "log_1",
    route: "/health",
    status: 200,
    latencyMs: 140,
    timestamp: "2026-02-08T08:12:00Z",
  },
  {
    id: "log_2",
    route: "/transfers",
    status: 201,
    latencyMs: 240,
    timestamp: "2026-02-08T07:40:00Z",
  },
  {
    id: "log_3",
    route: "/accounts",
    status: 403,
    latencyMs: 180,
    timestamp: "2026-02-08T07:05:00Z",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Developer dashboard"
        description="Monitor usage, key health, and gateway status at a glance."
      />
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Requests (24h)" value="12,480" description="+8.2% from yesterday" icon={<Activity className="h-5 w-5 text-success" />} />
        <StatCard title="Avg latency" value={formatLatency(182)} description="Global edge" icon={<Zap className="h-5 w-5 text-warning" />} />
        <StatCard title="Active keys" value="6" description="1 rotation scheduled" icon={<KeyRound className="h-5 w-5 text-accent" />} />
        <StatCard title="Security" value="Healthy" description="No incidents" icon={<ShieldCheck className="h-5 w-5 text-success" />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{log.route}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={log.status >= 400 ? "danger" : "success"}>{log.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatLatency(log.latencyMs)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gateway health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="success">Operational</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Global latency</span>
                <span className="font-medium text-foreground">182 ms</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium text-foreground">99.98%</span>
              </div>
              <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                Incident-free for 28 days.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
