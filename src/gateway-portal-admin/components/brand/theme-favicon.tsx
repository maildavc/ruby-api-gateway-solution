"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

const faviconMap = {
  light: "/brand/seabaas_favicon_light.png",
  dark: "/brand/seabaas_favicon_dark.png",
};

const cacheBust = "20260209";

function setLink(rel: string, href: string, sizes?: string, type?: string) {
  const head = document.head;
  let link = head.querySelector(`link[rel='${rel}']${sizes ? `[sizes='${sizes}']` : ""}`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    if (sizes) link.sizes = sizes;
    head.appendChild(link);
  }
  if (type) link.type = type;
  link.href = href;
}

function removeLegacyFavicon() {
  const links = Array.from(document.head.querySelectorAll("link[rel='icon']")) as HTMLLinkElement[];
  links
    .filter((link) => link.href.endsWith("/favicon.ico") || link.href.endsWith("favicon.ico"))
    .forEach((link) => link.remove());
}

export function ThemeFavicon() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    removeLegacyFavicon();
    const theme = resolvedTheme === "dark" ? "dark" : "light";
    const href = `${faviconMap[theme]}?v=${cacheBust}`;
    setLink("icon", href, "16x16", "image/png");
    setLink("icon", href, "32x32", "image/png");
    setLink("shortcut icon", href, undefined, "image/png");
    setLink("apple-touch-icon", href, undefined, "image/png");
  }, [resolvedTheme]);

  return null;
}
