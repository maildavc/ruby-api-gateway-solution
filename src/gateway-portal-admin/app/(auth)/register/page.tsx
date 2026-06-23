"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Apple, Building2, Github, Mail } from "lucide-react";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/useAuth";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(2),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const { oauthSignIn } = useAuth();
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitted(true);
  };

  return (
    <AuthCard title="Request admin access" description="Access is approved by gateway owners and security admins.">
      <div className="space-y-3">
        <Button type="button" variant="outline" className="w-full" onClick={() => oauthSignIn("azure-ad")}>
          <Building2 className="h-4 w-4" />
          Continue with Microsoft
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => oauthSignIn("apple")}>
          <Apple className="h-4 w-4" />
          Continue with Apple
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => oauthSignIn("google")}>
          <Mail className="h-4 w-4" />
          Continue with Google
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => oauthSignIn("github")}>
          <Github className="h-4 w-4" />
          Continue with GitHub
        </Button>
      </div>
      <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or request with email
        <div className="h-px flex-1 bg-border" />
      </div>
      {submitted ? (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>We sent a verification link to your inbox.</p>
          <p>Once verified, an admin will approve your access.</p>
          <Link className="font-medium text-foreground" href="/login">
            Back to login
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Alex Johnson" {...register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" {...register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" placeholder="Gapeiro Technologies" {...register("company")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Create a password" {...register("password")} />
          </div>
          <Button className="w-full" type="submit" disabled={formState.isSubmitting}>
            Request access
          </Button>
        </form>
      )}
      <div className="mt-4 text-sm">
        <Link className="text-muted-foreground hover:text-foreground" href="/login">
          Already have an account?
        </Link>
      </div>
    </AuthCard>
  );
}
