import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function SpecsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="OpenAPI specs"
        description="Upload, validate, and version service specifications."
        action={
          <PermissionGate permission="spec.manage">
            <Button>Upload spec</Button>
          </PermissionGate>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Specs registry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-xl border border-border px-4 py-3">PayHub v2 · Last updated Feb 7, 2026</div>
          <div className="rounded-xl border border-border px-4 py-3">SeaBaaS v1 · Last updated Jan 29, 2026</div>
          <div className="rounded-xl border border-border px-4 py-3">Legacy v0 · Deprecated</div>
        </CardContent>
      </Card>
    </div>
  );
}
