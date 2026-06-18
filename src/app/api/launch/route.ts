import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";

const launchBodySchema = z.object({
  articleId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId } = launchBodySchema.parse(body);

    const article = await prisma.articleCampaign.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.complianceStatus !== "compliant") {
      return NextResponse.json(
        { error: "Article must be compliant before launching" },
        { status: 422 },
      );
    }

    if (article.launchStatus === "launched") {
      return NextResponse.json(
        { error: "Campaign already launched" },
        { status: 409 },
      );
    }

    if (article.launchStatus === "processing") {
      return NextResponse.json(
        { error: "Launch already in progress" },
        { status: 409 },
      );
    }

    // Mark as processing while n8n/Primus handles the batch asynchronously
    const updated = await prisma.articleCampaign.update({
      where: { id: articleId },
      data: { launchStatus: "processing" },
    });

    // Fire the n8n webhook if configured (non-blocking — failures don't abort the response)
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.CALLBACK_SECRET
            ? { "x-callback-secret": process.env.CALLBACK_SECRET }
            : {}),
        },
        body: JSON.stringify({
          articleId: updated.id,
          url: updated.url,
          headline: updated.headline,
          source: updated.source,
          category: updated.category,
        }),
      }).catch((err) =>
        console.error("[POST /api/launch] n8n webhook error:", err),
      );
    }

    return NextResponse.json({
      id: updated.id,
      launchStatus: updated.launchStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 },
      );
    }

    console.error("[POST /api/launch]", error);
    return NextResponse.json(
      { error: "Failed to start campaign" },
      { status: 500 },
    );
  }
}
