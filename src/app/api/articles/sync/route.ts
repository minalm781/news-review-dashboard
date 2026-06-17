import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { syncNewsArticles } from "@/lib/services/news-sync";

export async function POST() {
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

    console.error("[POST /api/articles/sync]", error);

    const message =
      error instanceof Error ? error.message : "Failed to sync articles";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
