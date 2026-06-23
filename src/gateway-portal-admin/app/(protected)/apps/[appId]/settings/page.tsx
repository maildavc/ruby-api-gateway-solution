import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AppSettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="App settings" description="Update metadata and deprecate endpoints." />
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">App name</Label>
              <Input id="name" defaultValue="Sandbox Payments" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" defaultValue="Sandbox environment for payment workflows." />
            </div>
            <div className="space-y-2">
              <Label>Deprecation banner</Label>
              <Input defaultValue="/v1/transfers will be sunset on 2026-04-01" />
            </div>
            <div className="flex gap-3">
              <Button>Save changes</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
