import { NextResponse } from "next/server";

const apps = [
  {
    id: "app_sandbox",
    name: "Sandbox Payments",
    description: "Sandbox environment for payment workflows.",
    environment: "Sandbox",
    createdAt: "2026-01-10T12:00:00Z",
    owner: "Alex Johnson",
  },
  {
    id: "app_production",
    name: "Production Transfers",
    description: "Production transfer APIs with elevated limits.",
    environment: "Production",
    createdAt: "2025-12-05T09:12:00Z",
    owner: "Alex Johnson",
  },
];

export async function GET() {
  return NextResponse.json({ data: apps });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    data: {
      id: `app_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      owner: "Alex Johnson",
      ...body,
    },
  });
}
