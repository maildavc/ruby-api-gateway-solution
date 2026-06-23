"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useMounted } from "@/hooks/useMounted";
import { Button } from "@/components/ui/button";

const themeOrder = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <div className="h-10 w-10" />;
  }

  const current = theme ?? resolvedTheme ?? "system";
  const next = themeOrder[(themeOrder.indexOf(current as typeof themeOrder[number]) + 1) % themeOrder.length];

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label="Toggle theme"
    >
      {current === "light" ? <Sun className="h-4 w-4" /> : null}
      {current === "dark" ? <Moon className="h-4 w-4" /> : null}
      {current === "system" ? <Laptop className="h-4 w-4" /> : null}
    </Button>
  );
}
