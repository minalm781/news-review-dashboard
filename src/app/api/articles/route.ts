import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { listArticles } from "@/lib/services/articles";
import { articlesQuerySchema } from "@/lib/validators/articles-query";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = articlesQuerySchema.parse(params);
    const result = await listArticles(query);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.flatten() },
        { status: 400 },
      );
    }

    console.error("[GET /api/articles]", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 },
    );
  }
}
