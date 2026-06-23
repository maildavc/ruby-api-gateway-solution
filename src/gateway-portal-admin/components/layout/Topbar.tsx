"use client";

import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const environments = ["dev", "uat", "staging", "prod"] as const;
type Environment = (typeof environments)[number];

const ENV_STORAGE_KEY = "gateway-admin-env";

export function Topbar() {
  const [environment, setEnvironment] = useState<Environment>("dev");

  useEffect(() => {
    const stored = window.localStorage.getItem(ENV_STORAGE_KEY) as Environment | null;
    if (stored && environments.includes(stored)) {
      setEnvironment(stored);
    }
  }, []);

  const updateEnvironment = (value: Environment) => {
    setEnvironment(value);
    window.localStorage.setItem(ENV_STORAGE_KEY, value);
  };

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
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-xs text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wide">Env</span>
          <select
            className="bg-transparent text-xs text-foreground"
            value={environment}
            onChange={(event) => updateEnvironment(event.target.value as Environment)}
          >
            {environments.map((env) => (
              <option key={env} value={env}>
                {env.toUpperCase()}
              </option>
            ))}
          </select>
          <Badge variant={environment === "prod" ? "danger" : "warning"} className="text-[10px]">
            {environment.toUpperCase()}
          </Badge>
        </div>
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-input text-foreground hover:bg-muted">
          <Bell className="h-4 w-4" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
