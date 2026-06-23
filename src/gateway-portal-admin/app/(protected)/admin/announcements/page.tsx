import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Announcements"
        description="Publish change notes and release updates to the developer portal."
        action={
          <PermissionGate permission="announcement.manage">
            <Button>Create announcement</Button>
          </PermissionGate>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Latest announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-xl border border-border px-4 py-3">Feb 7, 2026 · PayHub v2 rate limits updated</div>
          <div className="rounded-xl border border-border px-4 py-3">Jan 28, 2026 · New JWT issuer policy rollout</div>
        </CardContent>
      </Card>
    </div>
  );
}
