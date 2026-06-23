import Link from "next/link";

import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AppDetailsPage({ params }: { params: { appId: string } }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="App overview"
        description={`App ID: ${params.appId}`}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/apps/${params.appId}/keys`}>Keys</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/apps/${params.appId}/logs`}>Logs</Link>
            </Button>
            <Button asChild>
              <Link href={`/apps/${params.appId}/settings`}>Settings</Link>
            </Button>
          </div>
        }
      />
      <Card>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Environment</p>
              <Badge variant="neutral" className="mt-2">
                Sandbox
              </Badge>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Owner</p>
              <p className="mt-2 text-sm font-medium text-foreground">Alex Johnson</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Created</p>
              <p className="mt-2 text-sm font-medium text-foreground">Jan 10, 2026</p>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Use the keys page to rotate credentials or revoke access. Log filters are pre-scoped to this app.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
