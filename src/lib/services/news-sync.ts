import { Prisma, SyncStatus } from "@prisma/client";

import {
  COMPLIANCE_DELAY_MS,
  NEWS_API_URL,
  SYNC_METADATA_ID,
} from "@/lib/constants";
import prisma from "@/lib/db";
import { parseNewsPublishedAt } from "@/lib/utils/dates";
import {
  newsApiResponseSchema,
  type NewsApiArticleInput,
} from "@/lib/validators/news-api";
import type { SyncArticlesResponse } from "@/types/api";

const FETCH_TIMEOUT_MS = 30_000;

function normalizeUrl(url: string): string {
  return url.trim();
}

function mapNewsArticle(article: NewsApiArticleInput): Prisma.ArticleCampaignCreateManyInput {
  return {
    url: normalizeUrl(article.u),
    headline: article.t.trim(),
    source: article.site.trim(),
    category: article.cat.trim(),
    publishedAt: parseNewsPublishedAt(article.pubt),
  };
}

function dedupeByUrl(
  articles: Prisma.ArticleCampaignCreateManyInput[],
): Prisma.ArticleCampaignCreateManyInput[] {
  const seen = new Map<string, Prisma.ArticleCampaignCreateManyInput>();

  for (const article of articles) {
    if (!seen.has(article.url)) {
      seen.set(article.url, article);
    }
  }

  return Array.from(seen.values());
}

async function markSyncRunning(): Promise<void> {
  await prisma.syncMetadata.upsert({
    where: { id: SYNC_METADATA_ID },
    create: {
      id: SYNC_METADATA_ID,
      lastSyncStatus: SyncStatus.running,
      lastSyncError: null,
    },
    update: {
      lastSyncStatus: SyncStatus.running,
      lastSyncError: null,
    },
  });
}

async function markSyncFailed(error: unknown): Promise<void> {
  const message =
    error instanceof Error ? error.message : "Unknown sync error";

  await prisma.syncMetadata.upsert({
    where: { id: SYNC_METADATA_ID },
    create: {
      id: SYNC_METADATA_ID,
      lastSyncStatus: SyncStatus.failed,
      lastSyncError: message,
    },
    update: {
      lastSyncStatus: SyncStatus.failed,
      lastSyncError: message,
    },
  });
}

async function fetchNewsFromApi(): Promise<unknown> {
  const response = await fetch(NEWS_API_URL, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `News API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function syncNewsArticles(): Promise<SyncArticlesResponse> {
  await markSyncRunning();

  try {
    const raw = await fetchNewsFromApi();
    const parsed = newsApiResponseSchema.parse(raw);

    const mapped = parsed.resultSet.map(mapNewsArticle);
    const deduped = dedupeByUrl(mapped);
    const duplicatesInResponse = mapped.length - deduped.length;

    const urls = deduped.map((article) => article.url);

    const existing =
      urls.length > 0
        ? await prisma.articleCampaign.findMany({
            where: { url: { in: urls } },
            select: { url: true },
          })
        : [];

    const existingUrls = new Set(existing.map((row) => row.url));
    const toInsert = deduped.filter((article) => !existingUrls.has(article.url));

    if (toInsert.length > 0) {
      await prisma.articleCampaign.createMany({
        data: toInsert,
        skipDuplicates: true,
      });
    }

    const now = new Date();
    const complianceDueAt = new Date(now.getTime() + COMPLIANCE_DELAY_MS);
    const skipped = deduped.length - toInsert.length;

    await prisma.syncMetadata.upsert({
      where: { id: SYNC_METADATA_ID },
      create: {
        id: SYNC_METADATA_ID,
        lastSyncedAt: now,
        lastSyncStatus: SyncStatus.success,
        lastSyncError: null,
        lastSyncInsertedCount: toInsert.length,
        lastSyncSkippedCount: skipped,
        complianceDueAt,
      },
      update: {
        lastSyncedAt: now,
        lastSyncStatus: SyncStatus.success,
        lastSyncError: null,
        lastSyncInsertedCount: toInsert.length,
        lastSyncSkippedCount: skipped,
        complianceDueAt,
      },
    });

    return {
      inserted: toInsert.length,
      skipped,
      duplicatesInResponse,
      totalFetched: parsed.resultSet.length,
      lastSyncedAt: now.toISOString(),
      complianceDueAt: complianceDueAt.toISOString(),
    };
  } catch (error) {
    await markSyncFailed(error);
    throw error;
  }
}
