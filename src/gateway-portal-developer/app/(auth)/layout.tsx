import { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent px-6 py-12">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <BrandLogo variant="full" className="h-16 w-auto" priority />
        </div>
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
