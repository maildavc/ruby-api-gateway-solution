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
            Build, secure, and monitor APIs with a developer-first portal.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Onboard developers in minutes, rotate keys safely, test APIs in a live console, and
            observe traffic with built-in logs and status monitoring.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs">View docs</Link>
            </Button>
          </div>
        </header>
        <section className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Key management",
              description: "Scoped keys, rotation workflows, and copy-once safeguards.",
            },
            {
              title: "API console",
              description: "Compose requests, replay traffic, and generate curl snippets.",
            },
            {
              title: "Observability",
              description: "Search logs by trace ID, export CSVs, and monitor uptime.",
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
