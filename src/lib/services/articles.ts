import type { ArticleCampaign, Prisma } from "@prisma/client";

import prisma from "@/lib/db";
import type { ArticlesQueryInput } from "@/lib/validators/articles-query";
import type { ArticleDto, StatsResponse } from "@/types/api";

const SORT_FIELD_MAP: Record<
  ArticlesQueryInput["sortBy"],
  keyof Prisma.ArticleCampaignOrderByWithRelationInput
> = {
  headline: "headline",
  source: "source",
  category: "category",
  complianceStatus: "complianceStatus",
  launchStatus: "launchStatus",
  publishedAt: "publishedAt",
  location: "location",
  campaignId: "campaignId",
};

function toDto(article: ArticleCampaign): ArticleDto {
  return {
    id: article.id,
    url: article.url,
    headline: article.headline,
    source: article.source,
    category: article.category,
    location: article.location,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    summary: article.summary,
    complianceStatus: article.complianceStatus,
    complianceReason: article.complianceReason,
    complianceCheckedAt: article.complianceCheckedAt?.toISOString() ?? null,
    complianceRetryCount: article.complianceRetryCount,
    complianceErrorMessage: article.complianceErrorMessage,
    launchStatus: article.launchStatus,
    campaignId: article.campaignId,
    launchedAt: article.launchedAt?.toISOString() ?? null,
    launchErrorMessage: article.launchErrorMessage,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

function buildWhere(query: ArticlesQueryInput): Prisma.ArticleCampaignWhereInput {
  const where: Prisma.ArticleCampaignWhereInput = {};

  if (query.complianceStatus) {
    where.complianceStatus = query.complianceStatus;
  }

  if (query.launchStatus) {
    where.launchStatus = query.launchStatus;
  }

  if (query.source) {
    where.source = query.source;
  }

  if (query.search) {
    where.OR = [
      { headline: { contains: query.search, mode: "insensitive" } },
      { url: { contains: query.search, mode: "insensitive" } },
      { source: { contains: query.search, mode: "insensitive" } },
      { category: { contains: query.search, mode: "insensitive" } },
      { location: { contains: query.search, mode: "insensitive" } },
      { campaignId: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listArticles(query: ArticlesQueryInput) {
  const where = buildWhere(query);
  const orderByField = SORT_FIELD_MAP[query.sortBy];

  const [rows, total, syncMetadata, sourceRows] = await Promise.all([
    prisma.articleCampaign.findMany({
      where,
      orderBy: { [orderByField]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.articleCampaign.count({ where }),
    prisma.syncMetadata.findUnique({ where: { id: "default" } }),
    prisma.articleCampaign.findMany({
      where: { source: { not: null } },
      select: { source: true },
      distinct: ["source"],
      orderBy: { source: "asc" },
    }),
  ]);

  return {
    data: rows.map(toDto),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
    lastSyncedAt: syncMetadata?.lastSyncedAt?.toISOString() ?? null,
    sources: sourceRows
      .map((row) => row.source)
      .filter((source): source is string => Boolean(source)),
  };
}

export async function getStats(): Promise<StatsResponse> {
  const [
    total,
    pendingReview,
    compliant,
    nonCompliant,
    launched,
    processing,
  ] = await Promise.all([
    prisma.articleCampaign.count(),
    prisma.articleCampaign.count({
      where: { complianceStatus: "pending_review" },
    }),
    prisma.articleCampaign.count({
      where: { complianceStatus: "compliant" },
    }),
    prisma.articleCampaign.count({
      where: { complianceStatus: "non_compliant" },
    }),
    prisma.articleCampaign.count({
      where: { launchStatus: "launched" },
    }),
    prisma.articleCampaign.count({
      where: { launchStatus: "processing" },
    }),
  ]);

  return {
    total,
    pendingReview,
    compliant,
    nonCompliant,
    launched,
    processing,
  };
}
