import { NextRequest, NextResponse } from "next/server";

const providerName = (provider: string) => (provider === "github" ? "GitHub" : "Google");

export async function POST(_: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const resolvedParams = await params;
  return NextResponse.json({
    user: {
      id: `user_${resolvedParams.provider}`,
      name: `${providerName(resolvedParams.provider)} User`,
      email: resolvedParams.provider === "github" ? "octo@github.dev" : "seabaas.dev@gmail.com",
      role: "developer",
      lastLoginAt: new Date().toISOString(),
    },
    token: `oauth-${resolvedParams.provider}-token`,
  });
}
