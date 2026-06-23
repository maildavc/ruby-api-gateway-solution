"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { AuthCard } from "@/components/auth/AuthCard";
import { SecurityHint } from "@/components/auth/SecurityHint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Apple, Building2, Github, Mail } from "lucide-react";

import { useAuth } from "@/lib/auth/useAuth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { signIn, oauthSignIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await signIn(values.email, values.password);
      router.push("/dashboard");
    } catch (err) {
      setError("Unable to sign in. Please verify your credentials.");
    }
  };

  return (
    <AuthCard title="Welcome back" description="Sign in to manage gateway configuration and governance.">
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => oauthSignIn("azure-ad").then(() => router.push("/dashboard"))}
        >
          <Building2 className="h-4 w-4" />
          Continue with Microsoft
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => oauthSignIn("apple").then(() => router.push("/dashboard"))}
        >
          <Apple className="h-4 w-4" />
          Continue with Apple
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => oauthSignIn("google").then(() => router.push("/dashboard"))}
        >
          <Mail className="h-4 w-4" />
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => oauthSignIn("github").then(() => router.push("/dashboard"))}
        >
          <Github className="h-4 w-4" />
          Continue with GitHub
        </Button>
      </div>
      <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or sign in with email
        <div className="h-px flex-1 bg-border" />
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register("email")} />
          {formState.errors.email ? (
            <p className="text-xs text-destructive">Enter a valid email.</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          {formState.errors.password ? (
            <p className="text-xs text-destructive">Password must be at least 8 characters.</p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={formState.isSubmitting}>
          Sign in
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link className="text-muted-foreground hover:text-foreground" href="/forgot-password">
          Forgot password?
        </Link>
        <Link className="font-medium text-foreground" href="/register">
          Request access
        </Link>
      </div>
      <div className="mt-6">
        <SecurityHint text="Administrative actions are audited and require approval where configured." />
      </div>
    </AuthCard>
  );
}
