import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";

// Validates Basic Auth header sent by n8n callback nodes
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Basic ")) return false;

  const base64 = authHeader.slice("Basic ".length);
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  const [username, password] = decoded.split(":");

  const expectedUser = process.env.CALLBACK_USERNAME ?? "n8n";
  const expectedPass = process.env.CALLBACK_SECRET ?? "";

  return username === expectedUser && password === expectedPass;
}

const bodySchema = z.object({
  article_id:         z.string().uuid(),
  complianceStatus:   z.enum(["compliant", "non_compliant", "pending_review"]),
  complianceReason:   z.string().nullable().optional(),
  complianceCategory: z.string().nullable().optional(),
  summary:            z.string().nullable().optional(),
  location:           z.string().nullable().optional(),
  retryCount:         z.number().optional(),
  terminal:           z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = bodySchema.parse(body);

    const article = await prisma.articleCampaign.findUnique({
      where: { id: data.article_id },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.launchStatus === "launched") {
      return NextResponse.json(
        { error: "Cannot update compliance on a launched article" },
        { status: 409 },
      );
    }

    const updated = await prisma.articleCampaign.update({
      where: { id: data.article_id },
      data: {
        complianceStatus:    data.complianceStatus,
        complianceReason:    data.complianceReason    ?? null,
        complianceCategory:  data.complianceCategory  ?? null,
        complianceCheckedAt: new Date(),
        ...(data.summary  ? { summary:  data.summary }  : {}),
        ...(data.location ? { location: data.location } : {}),
        ...(data.retryCount !== undefined
          ? { complianceRetryCount: data.retryCount }
          : {}),
      },
    });

    return NextResponse.json({
      id:               updated.id,
      complianceStatus: updated.complianceStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[POST /api/compliance-callback]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
