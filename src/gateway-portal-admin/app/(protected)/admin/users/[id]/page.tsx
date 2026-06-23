"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PermissionGate } from "@/components/auth/PermissionGate";

const tabs = ["Profile", "Roles & Permissions", "API Keys", "Activity"] as const;

export default function UserDetailPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Profile");

  return (
    <div className="space-y-6">
      <SectionHeader
        title="User detail"
        description="Review access, roles, and activity for this admin user."
        backHref="/admin/users"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission="user.manage">
              <Button variant="outline">Force logout</Button>
            </PermissionGate>
            <PermissionGate permission="user.manage">
              <Button>Reset password</Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? "default" : "outline"} onClick={() => setActiveTab(tab)}>
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === "Profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">Alex Johnson</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">alex@gapeiro.dev</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="success">Active</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last login</p>
              <p className="font-medium text-foreground">Feb 8, 2026 8:00 AM</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "Roles & Permissions" && (
        <Card>
          <CardHeader>
            <CardTitle>Roles & permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="info">Admin</Badge>
              <Badge variant="neutral">gateway.config.write</Badge>
              <Badge variant="neutral">endpoint.manage</Badge>
              <Badge variant="neutral">audit.read</Badge>
            </div>
            <PermissionGate permission="role.manage">
              <Button variant="outline">Edit roles</Button>
            </PermissionGate>
          </CardContent>
        </Card>
      )}

      {activeTab === "API Keys" && (
        <Card>
          <CardHeader>
            <CardTitle>API keys summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="font-medium text-foreground">Key: admin-core-01</p>
                <p className="text-xs text-muted-foreground">Created Feb 1, 2026 · Last used 2h ago</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/keys">View all keys</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "Activity" && (
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl border border-border px-4 py-3">
              Published endpoint policy update · Feb 8, 2026 07:40 AM
            </div>
            <div className="rounded-xl border border-border px-4 py-3">
              Reviewed gateway settings draft · Feb 7, 2026 05:10 PM
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
