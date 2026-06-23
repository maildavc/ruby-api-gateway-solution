"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SectionHeader({
  title,
  description,
  action,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    if (backHref) {
      router.push(backHref);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        {backHref ? (
          <Button type="button" variant="ghost" size="sm" className="mb-1 -ml-2" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
