import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuditEvent } from "@/types/admin";

const events: AuditEvent[] = [
  {
    id: "audit_1",
    actor: "A. Johnson",
    action: "UPDATE",
    resource: "Gateway Settings",
    createdAt: "2026-02-08T08:12:00Z",
    metadata: { environment: "prod", changeId: "cfg_342" },
  },
  {
    id: "audit_2",
    actor: "L. Chen",
    action: "PUBLISH",
    resource: "Endpoint Policies",
    createdAt: "2026-02-08T07:48:00Z",
    metadata: { endpoint: "payhub/v2/transfers" },
  },
  {
    id: "audit_3",
    actor: "S. Rivera",
    action: "DISABLE",
    resource: "Destination",
    createdAt: "2026-02-08T07:15:00Z",
    metadata: { destination: "https://staging.payhub" },
  },
];

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Audit logs" description="Immutable audit history for governance and compliance." />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
        <input
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
          placeholder="Search actor, resource, action"
        />
        <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <option>Action: All</option>
          <option>CREATE</option>
          <option>UPDATE</option>
          <option>PUBLISH</option>
          <option>DISABLE</option>
        </select>
        <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <option>Date range: Last 7 days</option>
          <option>Last 24 hours</option>
          <option>Last 30 days</option>
        </select>
        <Button variant="outline" size="sm">
          Apply
        </Button>
        <Button variant="outline" size="sm">
          Export CSV
        </Button>
        <Button variant="outline" size="sm">
          Export JSON
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{event.actor}</td>
                <td className="px-4 py-3">
                  <Badge variant={event.action === "PUBLISH" ? "success" : "info"}>{event.action}</Badge>
                </td>
                <td className="px-4 py-3">{event.resource}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {Object.entries(event.metadata)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
