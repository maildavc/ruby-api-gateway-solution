import { NextResponse } from "next/server";

import { permissions } from "@/lib/constants/permissions";

export async function GET() {
  return NextResponse.json({
    authenticated: true,
    user: {
      id: "user_1",
      name: "Alex Johnson",
      email: "alex@gapeiro.dev",
      role: "admin",
      permissions: [...permissions],
      lastLoginAt: new Date().toISOString(),
    },
  });
}
