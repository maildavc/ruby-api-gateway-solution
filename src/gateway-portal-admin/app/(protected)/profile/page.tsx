import { SectionHeader } from "@/components/common/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" description="Manage personal details and active sessions." />
      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
        </CardHeader>
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
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input id="current-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" placeholder="••••••••" />
            </div>
          </div>
          <Button variant="outline">Update password</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>MFA settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border border-border px-4 py-3 text-muted-foreground">
            MFA is currently <span className="font-medium text-foreground">Enabled</span>.
          </div>
          <Button variant="outline">Manage MFA</Button>
        </CardContent>
      </Card>
    </div>
  );
}
