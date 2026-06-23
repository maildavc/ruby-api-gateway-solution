import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Providers } from "@/app/providers";
import { ThemeFavicon } from "@/components/brand/theme-favicon";
import { env } from "@/lib/config/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: env.portalName,
  description: "Developer portal for managing API gateway access, keys, and logs.",
  icons: {
    icon: [
      { url: "/brand/seabaas_favicon_light.png", type: "image/png", sizes: "16x16" },
      { url: "/brand/seabaas_favicon_light.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/brand/seabaas_favicon_light.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/brand/seabaas_favicon_light.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/brand/seabaas_favicon_light.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/brand/seabaas_favicon_light.png" type="image/png" />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeFavicon />
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
