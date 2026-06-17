import {
  ComplianceStatus,
  LaunchStatus,
  Prisma,
  PrismaClient,
  SyncStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const SEED_ARTICLES: Prisma.ArticleCampaignCreateManyInput[] = [
  {
    url: "https://apnews.com/article/seed-pending-review-001",
    headline: "[SEED] Article awaiting compliance review",
    source: "apnews.com",
    category: "Top News",
    location: null,
    publishedAt: new Date("2026-06-04T10:00:00Z"),
    summary: null,
    complianceStatus: ComplianceStatus.pending_review,
    complianceReason: null,
    complianceCheckedAt: null,
    complianceRetryCount: 0,
    complianceErrorMessage: null,
    complianceNextRetryAt: null,
    launchStatus: LaunchStatus.pending_launch,
    campaignId: null,
    launchedAt: null,
    launchErrorMessage: null,
    n8nWebhookResponse: Prisma.JsonNull,
  },
  {
    url: "https://apnews.com/article/seed-compliant-ready-002",
    headline: "[SEED] Compliant article ready for Meta launch",
    source: "apnews.com",
    category: "Top News",
    location: "United States",
    publishedAt: new Date("2026-06-04T09:30:00Z"),
    summary:
      "Sample summary for compliance-approved content suitable for campaign launch.",
    complianceStatus: ComplianceStatus.compliant,
    complianceReason: "Content meets advertising policy requirements.",
    complianceCheckedAt: new Date("2026-06-04T11:00:00Z"),
    complianceRetryCount: 0,
    complianceErrorMessage: null,
    complianceNextRetryAt: null,
    launchStatus: LaunchStatus.pending_launch,
    campaignId: null,
    launchedAt: null,
    launchErrorMessage: null,
    n8nWebhookResponse: Prisma.JsonNull,
  },
  {
    url: "https://apnews.com/article/seed-non-compliant-003",
    headline: "[SEED] Non-compliant article — launch blocked",
    source: "apnews.com",
    category: "Politics",
    location: "Washington, DC",
    publishedAt: new Date("2026-06-04T08:00:00Z"),
    summary: "Partial summary before compliance rejection.",
    complianceStatus: ComplianceStatus.non_compliant,
    complianceReason: "Unable to Read Article",
    complianceCheckedAt: new Date("2026-06-04T10:15:00Z"),
    complianceRetryCount: 0,
    complianceErrorMessage: null,
    complianceNextRetryAt: null,
    launchStatus: LaunchStatus.pending_launch,
    campaignId: null,
    launchedAt: null,
    launchErrorMessage: null,
    n8nWebhookResponse: Prisma.JsonNull,
  },
  {
    url: "https://apnews.com/article/seed-processing-004",
    headline: "[SEED] Compliant article — launch in progress",
    source: "reuters.com",
    category: "Business",
    location: "New York, NY",
    publishedAt: new Date("2026-06-03T18:00:00Z"),
    summary: "Business segment summary for in-flight campaign creation.",
    complianceStatus: ComplianceStatus.compliant,
    complianceReason: "Approved for promotional use.",
    complianceCheckedAt: new Date("2026-06-03T19:00:00Z"),
    complianceRetryCount: 0,
    complianceErrorMessage: null,
    complianceNextRetryAt: null,
    launchStatus: LaunchStatus.processing,
    campaignId: null,
    launchedAt: null,
    launchErrorMessage: null,
    n8nWebhookResponse: { status: "accepted", queuedAt: "2026-06-04T12:00:00Z" },
  },
  {
    url: "https://apnews.com/article/seed-launched-005",
    headline: "[SEED] Successfully launched campaign article",
    source: "bbc.com",
    category: "World",
    location: "London, UK",
    publishedAt: new Date("2026-06-02T14:00:00Z"),
    summary: "World news summary tied to an active Meta campaign.",
    complianceStatus: ComplianceStatus.compliant,
    complianceReason: "Meets brand safety guidelines.",
    complianceCheckedAt: new Date("2026-06-02T15:00:00Z"),
    complianceRetryCount: 0,
    complianceErrorMessage: null,
    complianceNextRetryAt: null,
    launchStatus: LaunchStatus.launched,
    campaignId: "meta-campaign-seed-10042",
    launchedAt: new Date("2026-06-02T16:30:00Z"),
    launchErrorMessage: null,
    n8nWebhookResponse: {
      status: "success",
      campaign_id: "meta-campaign-seed-10042",
    },
  },
  {
    url: "https://apnews.com/article/seed-launch-failed-006",
    headline: "[SEED] Launch failed — eligible for relaunch",
    source: "cnn.com",
    category: "Top News",
    location: "Atlanta, GA",
    publishedAt: new Date("2026-06-03T12:00:00Z"),
    summary: "Article where n8n workflow failed; operator may relaunch.",
    complianceStatus: ComplianceStatus.compliant,
    complianceReason: "Compliant with Meta ad policies.",
    complianceCheckedAt: new Date("2026-06-03T13:00:00Z"),
    complianceRetryCount: 0,
    complianceErrorMessage: null,
    complianceNextRetryAt: null,
    launchStatus: LaunchStatus.pending_launch,
    campaignId: null,
    launchedAt: null,
    launchErrorMessage: "n8n workflow timeout: Meta API did not respond within 120s",
    n8nWebhookResponse: { status: "error", code: "TIMEOUT" },
  },
  {
    url: "https://apnews.com/article/seed-compliance-retry-007",
    headline: "[SEED] Compliance retry scheduled",
    source: "npr.org",
    category: "Culture",
    location: null,
    publishedAt: new Date("2026-06-04T07:00:00Z"),
    summary: null,
    complianceStatus: ComplianceStatus.pending_review,
    complianceReason: null,
    complianceCheckedAt: null,
    complianceRetryCount: 2,
    complianceErrorMessage: "Malformed JSON from FastRouter step 2",
    complianceNextRetryAt: new Date(Date.now() + 60_000),
    launchStatus: LaunchStatus.pending_launch,
    campaignId: null,
    launchedAt: null,
    launchErrorMessage: null,
    n8nWebhookResponse: Prisma.JsonNull,
  },
  {
    url: "https://apnews.com/article/seed-max-retries-008",
    headline: "[SEED] Compliance exhausted retries",
    source: "theguardian.com",
    category: "Opinion",
    location: null,
    publishedAt: new Date("2026-06-01T10:00:00Z"),
    summary: null,
    complianceStatus: ComplianceStatus.non_compliant,
    complianceReason: "Compliance validation failed after maximum retries",
    complianceCheckedAt: new Date("2026-06-01T12:00:00Z"),
    complianceRetryCount: 5,
    complianceErrorMessage:
      "Exceeded maximum compliance attempts (5). Last error: upstream 503",
    complianceNextRetryAt: null,
    launchStatus: LaunchStatus.pending_launch,
    campaignId: null,
    launchedAt: null,
    launchErrorMessage: null,
    n8nWebhookResponse: Prisma.JsonNull,
  },
];

async function main() {
  console.log("Seeding NextGen A360 News Review database…");

  await prisma.articleCampaign.deleteMany();
  await prisma.syncMetadata.deleteMany();

  const articles = await prisma.articleCampaign.createMany({
    data: SEED_ARTICLES,
  });

  const lastSyncedAt = new Date("2026-06-04T11:30:00Z");
  const complianceDueAt = new Date(lastSyncedAt.getTime() + 15 * 60 * 1000);

  await prisma.syncMetadata.create({
    data: {
      id: "default",
      lastSyncedAt,
      lastSyncStatus: SyncStatus.success,
      lastSyncInsertedCount: 0,
      lastSyncSkippedCount: SEED_ARTICLES.length,
      lastSyncError: null,
      complianceDueAt,
      lastComplianceRunAt: new Date("2026-06-04T11:45:00Z"),
      lastComplianceStatus: SyncStatus.success,
      lastComplianceError: null,
    },
  });

  console.log(`  ✓ ${articles.count} article_campaigns rows`);
  console.log("  ✓ sync_metadata (id=default)");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
