import { SectionHeader } from "@/components/common/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" description="Manage personal details and active sessions." />
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Alex Johnson" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="alex@gapeiro.dev" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Active sessions</Label>
              <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">
                Last login: Feb 8, 2026 · San Francisco, CA
              </div>
            </div>
            <Button>Save profile</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
