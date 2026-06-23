import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      {
        id: "key_1",
        label: "Primary Sandbox",
        environment: "Sandbox",
        scopes: ["read", "write"],
        lastUsedAt: "2026-02-08T08:12:00Z",
        expiresAt: "2026-08-01T00:00:00Z",
        status: "active",
        keyPreview: "sk_live_****91ab",
      },
      {
        id: "key_2",
        label: "Production Transfer",
        environment: "Production",
        scopes: ["read", "transfer"],
        lastUsedAt: "2026-02-06T14:01:00Z",
        expiresAt: "2026-06-01T00:00:00Z",
        status: "active",
        keyPreview: "sk_live_****1d9f",
      },
      {
        id: "key_3",
        label: "Legacy Staging",
        environment: "Staging",
        scopes: ["read"],
        lastUsedAt: "2025-12-21T09:20:00Z",
        expiresAt: "2025-12-31T00:00:00Z",
        status: "expired",
        keyPreview: "sk_live_****e41c",
      },
    ],
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    data: {
      id: `key_${Math.random().toString(36).slice(2, 8)}`,
      status: "active",
      keyPreview: "sk_live_****new",
      lastUsedAt: null,
      ...body,
    },
  });
}
