import { NextResponse } from "next/server";

import { permissions } from "@/lib/constants/permissions";

export async function POST(request: Request) {
  const body = await request.json();
  const { email } = body;

  return NextResponse.json({
    user: {
      id: "user_1",
      name: "Alex Johnson",
      email,
      role: "admin",
      permissions: [...permissions],
      lastLoginAt: new Date().toISOString(),
    },
    token: "dev-token-123",
  });
}
