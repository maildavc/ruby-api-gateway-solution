import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InviteUserPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Invite admin user" description="Add a new admin with role-based access." backHref="/admin/users" backLabel="Back to users" />
      <Card>
        <CardHeader>
          <CardTitle>User details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Jane Admin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="jane@company.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select id="role" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">
              <option>Admin</option>
              <option>Owner</option>
              <option>Auditor</option>
            </select>
          </div>
          <Button>Send invite</Button>
        </CardContent>
      </Card>
    </div>
  );
}
