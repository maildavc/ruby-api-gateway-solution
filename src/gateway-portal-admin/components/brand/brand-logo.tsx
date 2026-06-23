"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export type BrandLogoProps = {
  variant?: "full" | "icon";
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ variant = "full", className, priority }: BrandLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, [resolvedTheme]);

  if (!mounted) {
    return <span className={cn("inline-flex", className)} />;
  }

  const size = variant === "icon" ? 64 : 360;
  const src =
    theme === "dark"
      ? variant === "icon"
        ? "/brand/seabaas_favicon_dark.png"
        : "/brand/seabaas_logo_dark_full.png"
      : variant === "icon"
        ? "/brand/seabaas_favicon_light.png"
        : "/brand/seabaas_logo_light_full.png";

  return (
    <Image
      src={src}
      alt="SeaBaasAPIGateway"
      width={size}
      height={size}
      priority={priority}
      className={cn("h-auto w-auto", className)}
    />
  );
}
