import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeveloperApp } from "@/types/app";

export function AppCard({ app }: { app: DeveloperApp }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{app.name}</CardTitle>
          <Badge variant="neutral">{app.environment}</Badge>
        </div>
        <CardDescription>{app.description}</CardDescription>
        <Link className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary" href={`/apps/${app.id}`}>
          View app <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardHeader>
    </Card>
  );
}
