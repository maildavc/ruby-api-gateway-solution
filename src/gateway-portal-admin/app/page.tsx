import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <header className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo variant="full" className="h-20 w-auto" priority />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            Enterprise-grade API gateway
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-foreground">
            Govern, secure, and operate your API gateway control plane.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Configure global policies, manage products and endpoints, and enforce enterprise-grade
            security workflows with approvals and audit-ready change history.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </div>
        </header>
        <section className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "RBAC governance",
              description: "Granular permissions, maker-checker approvals, and audit trails.",
            },
            {
              title: "Policy control",
              description: "Centralized rate limits, auth policies, encryption, and routing.",
            },
            {
              title: "Operational visibility",
              description: "Metrics, logs, health checks, and configurable alerts.",
            },
          ].map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
