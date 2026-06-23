import { Activity, BarChart3, Timer } from "lucide-react";

import { SectionHeader } from "@/components/common/SectionHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Metrics" description="Read-only gateway metrics overview." />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
        <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <option>Last 15 minutes</option>
          <option>Last 1 hour</option>
          <option>Last 24 hours</option>
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="p50 latency" value="120ms" description="Last 1h" icon={<Timer className="h-5 w-5 text-success" />} />
        <StatCard title="p95 latency" value="280ms" description="Last 1h" icon={<Timer className="h-5 w-5 text-warning" />} />
        <StatCard title="RPS" value="820" description="Current" icon={<Activity className="h-5 w-5 text-info" />} />
        <StatCard title="Error rate" value="0.3%" description="4xx + 5xx" icon={<BarChart3 className="h-5 w-5 text-destructive" />} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Top endpoints by traffic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-xl border border-border px-4 py-3">POST /transfers · 420 rps</div>
          <div className="rounded-xl border border-border px-4 py-3">GET /accounts · 180 rps</div>
          <div className="rounded-xl border border-border px-4 py-3">POST /login · 140 rps</div>
        </CardContent>
      </Card>
    </div>
  );
}
