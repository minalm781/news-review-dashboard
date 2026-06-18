import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";

const bodySchema = z.object({
  articleId: z.string().uuid(),
  batchName: z.string().min(1),
  team: z.string().min(1),
  trafficRoute: z.string().min(1),
  campaignType: z.string().min(1),
  clickModel: z.string().min(1),
  landerType: z.string().min(1),
  country: z.string().min(1),
  language: z.string().min(1),
  mediaType: z.string().min(1),
  useCustomLanderUrl: z.boolean().optional(),
  smartAllocation: z.boolean().optional(),
  concepts: z.string().optional(),
  campaignLaunchSettings: z.string().min(1),
  campaignStartDate: z.string().optional(),
  campaignBudget: z.string().optional(),
  campaignTags: z.string().optional(),
  campaignStatus: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = bodySchema.parse(body);

    const article = await prisma.articleCampaign.findUnique({
      where: { id: data.articleId },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.complianceStatus !== "compliant") {
      return NextResponse.json(
        { error: "Article must be compliant before creating a campaign" },
        { status: 422 },
      );
    }

    if (article.launchStatus === "launched") {
      return NextResponse.json(
        { error: "Campaign already launched" },
        { status: 409 },
      );
    }

    const updated = await prisma.articleCampaign.update({
      where: { id: data.articleId },
      data: {
        campaignId: data.batchName,
        launchStatus: "processing",
        primusJobUrl: "https://primus.automate360.com/listing/batch",
      },
    });

    // Fire n8n webhook with full campaign config (non-blocking)
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(`${webhookUrl}/campaign`, {
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
          ...data,
        }),
      }).catch((err) =>
        console.error("[POST /api/campaign] webhook error:", err),
      );
    }

    return NextResponse.json({
      id: updated.id,
      campaignId: updated.campaignId,
      launchStatus: updated.launchStatus,
      primusJobUrl: updated.primusJobUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[POST /api/campaign]", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 },
    );
  }
}
