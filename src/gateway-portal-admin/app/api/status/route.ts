import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      status: "operational",
      latencyMs: 182,
      uptime: "99.98%",
      incident: null,
    },
  });
}
