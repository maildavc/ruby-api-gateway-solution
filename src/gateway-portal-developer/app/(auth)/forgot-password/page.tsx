"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <AuthCard title="Reset your password" description="We'll email you a secure reset link.">
      {sent ? (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Check your inbox for a password reset email.</p>
          <Link className="font-medium text-foreground" href="/login">
            Return to login
          </Link>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="you@company.com" required />
          </div>
          <Button className="w-full" type="submit">
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
