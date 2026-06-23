import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return NextResponse.json({
    data: {
      id: resolvedParams.id,
      name: "Sandbox Payments",
      description: "Sandbox environment for payment workflows.",
      environment: "Sandbox",
      createdAt: "2026-01-10T12:00:00Z",
      owner: "Alex Johnson",
    },
  });
}
