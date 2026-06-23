import Link from "next/link";

import { SectionHeader } from "@/components/common/SectionHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const docs = [
  { label: "Getting Started", slug: "getting-started", description: "Create your first app and key." },
  { label: "Authentication", slug: "authentication", description: "API keys, JWTs, and rotation." },
  { label: "Rate Limits", slug: "rate-limits", description: "Usage tiers and bursts." },
  { label: "Errors", slug: "errors", description: "Standard error payloads." },
  { label: "Changelog", slug: "changelog", description: "Latest platform updates." },
];

export default function DocsIndexPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Documentation" description="Guides, API references, and platform updates." />
      <div className="grid gap-4 lg:grid-cols-2">
        {docs.map((doc) => (
          <Link key={doc.slug} href={`/docs/${doc.slug}`}>
            <Card className="h-full transition hover:border-primary/40">
              <CardHeader>
                <CardTitle>{doc.label}</CardTitle>
                <CardDescription>{doc.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
