import { SectionHeader } from "@/components/common/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Billing" description="Plan, usage, and rate-limit visibility." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">Growth</p>
            <p className="mt-1 text-sm text-muted-foreground">5,000 req/min · 1,000 burst</p>
            <Button className="mt-4" variant="outline">
              Manage plan
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">68%</p>
            <p className="mt-1 text-sm text-muted-foreground">3.4M of 5M requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rate limit alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="success">Healthy</Badge>
            <p className="mt-2 text-sm text-muted-foreground">No throttling events in 7 days.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
