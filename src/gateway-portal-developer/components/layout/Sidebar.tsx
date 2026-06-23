"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Blocks, 
  BookOpen, 
  Cpu, 
  LayoutGrid, 
  LifeBuoy, 
  LogOut, 
  ScrollText, 
  Settings, 
  User,
  Zap,
  Shield,
  Send,
  Key,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { navigation } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/useAuth";

const icons = {
  Dashboard: LayoutGrid,
  Apps: Blocks,
  Apis: Zap,
  Clients: Key,
  "Endpoint Requests": Send,
  "IP Restrictions": Shield,
  Console: Cpu,
  Logs: ScrollText,
  Docs: BookOpen,
  Status: Settings,
  Profile: User,
  Billing: ScrollText,
  Support: LifeBuoy,
};

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
      <div className="flex items-center gap-3 px-2 text-lg font-semibold text-foreground">
        <BrandLogo variant="full" className="h-14 w-auto" priority />
      </div>
      <nav className="mt-8 space-y-6">
        <div className="space-y-1">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Core</p>
          {navigation.primary.map((item) => {
            const Icon = icons[item.label as keyof typeof icons] ?? LayoutGrid;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="space-y-1">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</p>
          {navigation.secondary.map((item) => {
            const Icon = icons[item.label as keyof typeof icons] ?? User;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              signOut();
            }}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  );
}
