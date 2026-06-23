"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  BookOpen,
  Boxes,
  ClipboardList,
  Cog,
  Database,
  KeyRound,
  LayoutGrid,
  LogOut,
  Search,
  ShieldCheck,
  Sliders,
  Users,
  User,
  Wrench,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { navigation } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/useAuth";
import { hasPermission } from "@/lib/auth/routeGuards";

const icons = {
  Dashboard: LayoutGrid,
  "Gateway Settings": Sliders,
  "Audit Logs": ClipboardList,
  Users,
  Roles: ShieldCheck,
  Products: Boxes,
  Services: Wrench,
  Endpoints: BookOpen,
  "Test Console": Wrench,
  Keys: KeyRound,
  Metrics: Activity,
  Traces: Search,
  "Gateway Logs": Database,
  Alerts: Bell,
  Specs: BookOpen,
  Announcements: Bell,
  Maintenance: Cog,
  "Bulk Ops": Cog,
  Tenants: Users,
  Profile: User,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
      <div className="flex items-center gap-3 px-2 text-lg font-semibold text-foreground">
        <BrandLogo variant="full" className="h-14 w-auto" priority />
      </div>
      <nav className="mt-8 space-y-6">
        <div className="space-y-1">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Core</p>
          {navigation.primary
            .filter((item) => ("permission" in item ? hasPermission(user, item.permission as string) : true))
            .map((item) => {
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
          {navigation.secondary
            .filter((item) => ("permission" in item ? hasPermission(user, item.permission as string) : true))
            .map((item) => {
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
              router.push("/login");
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
