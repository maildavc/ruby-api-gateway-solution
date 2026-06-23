import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gateway system settings"
        description="Global configuration defaults for all environments."
        action={
          <PermissionGate permission="gateway.config.write">
            <Button>Save changes</Button>
          </PermissionGate>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Base URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base-dev">Dev base URL</Label>
              <Input id="base-dev" defaultValue="https://dev.seabaasapigateway.dev" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-uat">UAT base URL</Label>
              <Input id="base-uat" defaultValue="https://uat.seabaasapigateway.dev" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-staging">Staging base URL</Label>
              <Input id="base-staging" defaultValue="https://staging.seabaasapigateway.dev" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-prod">Prod base URL</Label>
              <Input id="base-prod" defaultValue="https://seabaasapigateway.dev" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-encryption">Default encryption mode</Label>
              <select id="default-encryption" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                <option>Pass-through encrypted</option>
                <option>Decrypt at gateway</option>
                <option>Encrypt outbound</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timeout">Default timeout (ms)</Label>
                <Input id="timeout" type="number" defaultValue={30000} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retries">Default retries</Label>
                <Input id="retries" type="number" defaultValue={2} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rate-limit">Default rate limit policy</Label>
                <Input id="rate-limit" defaultValue="1000 req/min" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="burst">Burst</Label>
                <Input id="burst" defaultValue="250 req/10s" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Headers & payload limits</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="allow-headers">Allow list headers</Label>
              <Textarea
                id="allow-headers"
                defaultValue="x-correlation-id, x-tenant-id, x-request-id"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deny-headers">Deny list headers</Label>
              <Textarea id="deny-headers" defaultValue="x-debug-token, x-internal" rows={4} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="request-size">Request size limit (MB)</Label>
                <Input id="request-size" type="number" defaultValue={10} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response-size">Response size limit (MB)</Label>
                <Input id="response-size" type="number" defaultValue={15} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="info">Draft</Badge>
                <span>Changes are saved as draft until reviewed.</span>
              </div>
              <p className="mt-2">
                Draft → Review → Publish workflow is enabled. Include approval notes before publishing.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Configuration versioning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border px-4 py-3">Active version: v42 · Updated 2 hours ago</div>
            <div className="rounded-xl border border-border px-4 py-3">Draft version: v43 · Pending approval (Maker/Checker)</div>
            <PermissionGate permission="gateway.config.write">
              <Button variant="outline">Rollback to previous</Button>
            </PermissionGate>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Secrets & vault integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Secrets are masked by default. Use references to external vault providers.</p>
            <div className="rounded-xl border border-border px-4 py-3">
              Vault provider: Not configured
            </div>
            <div className="rounded-xl border border-border px-4 py-3">
              Reveal actions require approval and are fully audited.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
