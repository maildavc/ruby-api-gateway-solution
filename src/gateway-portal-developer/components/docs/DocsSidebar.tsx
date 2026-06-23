import Link from "next/link";

const docs = [
  { label: "Getting Started", slug: "getting-started" },
  { label: "Authentication", slug: "authentication" },
  { label: "Rate Limits", slug: "rate-limits" },
  { label: "Errors", slug: "errors" },
  { label: "Changelog", slug: "changelog" },
];

export function DocsSidebar() {
  return (
    <aside className="w-full max-w-xs space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documentation</p>
      <div className="space-y-1">
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={`/docs/${doc.slug}`}
            className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {doc.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
