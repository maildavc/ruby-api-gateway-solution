"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [updated, setUpdated] = useState(false);

  return (
    <AuthCard title="Create a new password" description="Use a strong password you haven't used before.">
      {updated ? (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Password updated successfully.</p>
          <Link className="font-medium text-foreground" href="/login">
            Sign in
          </Link>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setUpdated(true);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" placeholder="••••••••" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" placeholder="••••••••" required />
          </div>
          <Button className="w-full" type="submit">
            Update password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
