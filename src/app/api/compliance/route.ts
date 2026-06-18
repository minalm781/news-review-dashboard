import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";

const bodySchema = z.object({
  articleId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId } = bodySchema.parse(body);

    const article = await prisma.articleCampaign.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.launchStatus === "launched") {
      return NextResponse.json(
        { error: "Cannot re-check compliance on a launched article" },
        { status: 409 },
      );
    }

    // Reset to pending_review so the compliance cron picks it up
    const updated = await prisma.articleCampaign.update({
      where: { id: articleId },
      data: {
        complianceStatus: "pending_review",
        complianceReason: null,
        complianceCheckedAt: null,
        complianceErrorMessage: null,
        complianceRetryCount: 0,
        complianceNextRetryAt: null,
      },
    });

    // Fire n8n compliance webhook if configured
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(`${webhookUrl}/compliance`, {
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
        }),
      }).catch((err) =>
        console.error("[POST /api/compliance] webhook error:", err),
      );
    }

    return NextResponse.json({
      id: updated.id,
      complianceStatus: updated.complianceStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[POST /api/compliance]", error);
    return NextResponse.json(
      { error: "Failed to trigger compliance check" },
      { status: 500 },
    );
  }
}
