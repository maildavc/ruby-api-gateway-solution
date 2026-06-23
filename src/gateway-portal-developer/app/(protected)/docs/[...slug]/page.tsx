import { notFound } from "next/navigation";

import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { docsRegistry } from "@/lib/docs/registry";

export default async function DocPage({ params }: { params: { slug: string[] } }) {
  const slug = params.slug?.[0] ?? "getting-started";
  const loader = docsRegistry[slug as keyof typeof docsRegistry];

  if (!loader) {
    notFound();
  }

  const { default: Doc } = await loader();

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <DocsSidebar />
      <article className="prose prose-zinc max-w-none dark:prose-invert">
        <Doc />
      </article>
    </div>
  );
}
