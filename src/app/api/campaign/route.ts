import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";

const bodySchema = z.object({
  articleIds: z.array(z.string().uuid()).min(1),
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

    const articles = await prisma.articleCampaign.findMany({
      where: { id: { in: data.articleIds } },
    });

    if (articles.length === 0) {
      return NextResponse.json({ error: "No articles found" }, { status: 404 });
    }

    const nonCompliant = articles.filter((a) => a.complianceStatus !== "compliant");
    if (nonCompliant.length > 0) {
      return NextResponse.json(
        {
          error: `${nonCompliant.length} article(s) are not compliant and cannot be included`,
          nonCompliantIds: nonCompliant.map((a) => a.id),
        },
        { status: 422 },
      );
    }

    const alreadyLaunched = articles.filter((a) => a.launchStatus === "launched");
    if (alreadyLaunched.length === articles.length) {
      return NextResponse.json(
        { error: "All selected articles are already launched" },
        { status: 409 },
      );
    }

    // Update all eligible articles in one transaction
    const eligibleIds = articles
      .filter((a) => a.launchStatus !== "launched")
      .map((a) => a.id);

    await prisma.articleCampaign.updateMany({
      where: { id: { in: eligibleIds } },
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
          ...data,
          articleIds: eligibleIds,
          articles: articles
            .filter((a) => eligibleIds.includes(a.id))
            .map((a) => ({ id: a.id, url: a.url, headline: a.headline })),
        }),
      }).catch((err) =>
        console.error("[POST /api/campaign] webhook error:", err),
      );
    }

    return NextResponse.json({
      updated: eligibleIds.length,
      skipped: alreadyLaunched.length,
      campaignId: data.batchName,
      launchStatus: "processing",
      articleIds: eligibleIds,
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
