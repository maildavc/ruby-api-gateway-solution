import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    authenticated: true,
    user: {
      id: "user_1",
      name: "Alex Johnson",
      email: "alex@gapeiro.dev",
      role: "developer",
      lastLoginAt: new Date().toISOString(),
    },
  });
}
