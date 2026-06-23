import { ReactNode } from "react";
import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
}) {
  const content = (
    <Card className={href ? "transition-colors hover:border-primary/40" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {icon}
        </div>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
