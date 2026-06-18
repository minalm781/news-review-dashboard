import type { ArticleCampaign, Prisma } from "@prisma/client";

import prisma from "@/lib/db";
import type { ArticlesQueryInput } from "@/lib/validators/articles-query";
import type { ArticleDto, StatsResponse } from "@/types/api";

// Extended until `prisma generate` picks up the new migration columns
type ArticleRow = ArticleCampaign & {
  apiCategory: string | null;
  complianceCategory: string | null;
  primusJobId: string | null;
  primusJobUrl: string | null;
};

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

function toDto(row: ArticleRow): ArticleDto {
  return {
    id: row.id,
    url: row.url,
    headline: row.headline,
    source: row.source,
    category: row.category,
    apiCategory: row.apiCategory,
    complianceCategory: row.complianceCategory,
    location: row.location,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    summary: row.summary,
    complianceStatus: row.complianceStatus,
    complianceReason: row.complianceReason,
    complianceCheckedAt: row.complianceCheckedAt?.toISOString() ?? null,
    complianceRetryCount: row.complianceRetryCount,
    complianceErrorMessage: row.complianceErrorMessage,
    launchStatus: row.launchStatus,
    campaignId: row.campaignId,
    launchedAt: row.launchedAt?.toISOString() ?? null,
    launchErrorMessage: row.launchErrorMessage,
    primusJobId: row.primusJobId,
    primusJobUrl: row.primusJobUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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

  if (query.category) {
    where.category = { equals: query.category, mode: "insensitive" };
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

  const [rows, total, syncMetadata, sourceRows, categoryRows] = await Promise.all([
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
    prisma.articleCampaign.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  return {
    data: (rows as unknown as ArticleRow[]).map(toDto),
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
    categories: categoryRows
      .map((row) => row.category)
      .filter((c): c is string => Boolean(c)),
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
