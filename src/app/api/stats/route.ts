import { NextResponse } from "next/server";

import { getStats } from "@/lib/services/articles";

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[GET /api/stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
