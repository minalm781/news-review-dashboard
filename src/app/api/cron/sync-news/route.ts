import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { isAuthorizedCronRequest } from "@/lib/auth/cron";
import { syncNewsArticles } from "@/lib/services/news-sync";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncNewsArticles();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "News API response validation failed",
          details: error.flatten(),
        },
        { status: 502 },
      );
    }

    console.error("[GET /api/cron/sync-news]", error);

    const message =
      error instanceof Error ? error.message : "Failed to sync articles";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
