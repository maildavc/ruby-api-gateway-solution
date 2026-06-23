"use client";

import { Bell, Search } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <Search className="h-4 w-4" />
          <Input
            className="h-6 border-none bg-transparent p-0 text-sm focus:ring-0 dark:bg-transparent"
            placeholder="Search docs, routes, logs..."
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-input text-foreground hover:bg-muted">
          <Bell className="h-4 w-4" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
