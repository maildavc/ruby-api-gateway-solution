import Link from "next/link";

import { AppCard } from "@/components/apps/AppCard";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { DeveloperApp } from "@/types/app";

const apps: DeveloperApp[] = [
  {
    id: "app_sandbox",
    name: "Sandbox Payments",
    description: "Sandbox environment for payment workflows.",
    environment: "Sandbox",
    createdAt: "2026-01-10T12:00:00Z",
    owner: "Alex Johnson",
  },
  {
    id: "app_production",
    name: "Production Transfers",
    description: "Production transfer APIs with elevated limits.",
    environment: "Production",
    createdAt: "2025-12-05T09:12:00Z",
    owner: "Alex Johnson",
  },
];

export default function AppsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Apps"
        description="Manage applications, environments, and credentials."
        action={
          <Button asChild>
            <Link href="/apps/new">Create app</Link>
          </Button>
        }
      />
      {apps.length === 0 ? (
        <EmptyState
          title="No apps yet"
          description="Create your first app to generate keys and test APIs."
          actionLabel="Create app"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
