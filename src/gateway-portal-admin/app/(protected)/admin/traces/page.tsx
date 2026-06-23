import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";

export default function TracesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Request tracing" description="Search by trace or correlation IDs." />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
        <input
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
          placeholder="Trace ID or correlation ID"
        />
        <Button variant="outline" size="sm">
          Search
        </Button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Tracing timeline and span visualization will appear here when backend tracing is available.
      </div>
    </div>
  );
}
