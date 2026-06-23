import { NextRequest, NextResponse } from "next/server";

import { permissions } from "@/lib/constants/permissions";

const providerName = (provider: string) => {
  if (provider === "github") return "GitHub";
  if (provider === "azure-ad") return "Microsoft";
  if (provider === "apple") return "Apple";
  return "Google";
};

const providerEmail = (provider: string) => {
  if (provider === "github") return "octo@github.dev";
  if (provider === "azure-ad") return "admin@contoso.com";
  if (provider === "apple") return "admin@icloud.com";
  return "seabaas.dev@gmail.com";
};

export async function POST(_: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const resolvedParams = await params;
  return NextResponse.json({
    user: {
      id: `user_${resolvedParams.provider}`,
      name: `${providerName(resolvedParams.provider)} User`,
      email: providerEmail(resolvedParams.provider),
      role: "admin",
      permissions: [...permissions],
      lastLoginAt: new Date().toISOString(),
    },
    token: `oauth-${resolvedParams.provider}-token`,
  });
}
