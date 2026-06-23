"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewAppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    await fetch("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        description: formData.get("description"),
        environment: formData.get("environment"),
      }),
    });
    setLoading(false);
    router.push("/apps");
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Create app" description="Provision a new app and generate credentials." />
      <Card>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">App name</Label>
              <Input id="name" name="name" placeholder="Payments Sandbox" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Short description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <select
                id="environment"
                name="environment"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              >
                <option>Sandbox</option>
                <option>Staging</option>
                <option>Production</option>
              </select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create app"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
