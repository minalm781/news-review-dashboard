-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('pending_review', 'compliant', 'non_compliant');

-- CreateEnum
CREATE TYPE "LaunchStatus" AS ENUM ('pending_launch', 'processing', 'launched');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('idle', 'running', 'success', 'failed');

-- CreateTable
CREATE TABLE "article_campaigns" (
    "id" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "headline" TEXT NOT NULL,
    "source" VARCHAR(255),
    "category" VARCHAR(255),
    "location" VARCHAR(255),
    "published_at" TIMESTAMP(3),
    "summary" TEXT,
    "compliance_status" "ComplianceStatus" NOT NULL DEFAULT 'pending_review',
    "compliance_reason" VARCHAR(512),
    "compliance_checked_at" TIMESTAMP(3),
    "compliance_retry_count" INTEGER NOT NULL DEFAULT 0,
    "compliance_error_message" TEXT,
    "compliance_next_retry_at" TIMESTAMP(3),
    "launch_status" "LaunchStatus" NOT NULL DEFAULT 'pending_launch',
    "campaign_id" VARCHAR(255),
    "launched_at" TIMESTAMP(3),
    "launch_error_message" TEXT,
    "n8n_webhook_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_metadata" (
    "id" VARCHAR(32) NOT NULL,
    "last_synced_at" TIMESTAMP(3),
    "last_sync_status" "SyncStatus" NOT NULL DEFAULT 'idle',
    "last_sync_error" TEXT,
    "last_sync_inserted_count" INTEGER,
    "last_sync_skipped_count" INTEGER,
    "compliance_due_at" TIMESTAMP(3),
    "last_compliance_run_at" TIMESTAMP(3),
    "last_compliance_status" "SyncStatus" NOT NULL DEFAULT 'idle',
    "last_compliance_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_campaigns_url_key" ON "article_campaigns"("url");

-- CreateIndex
CREATE INDEX "article_campaigns_compliance_status_idx" ON "article_campaigns"("compliance_status");

-- CreateIndex
CREATE INDEX "article_campaigns_launch_status_idx" ON "article_campaigns"("launch_status");

-- CreateIndex
CREATE INDEX "article_campaigns_source_idx" ON "article_campaigns"("source");

-- CreateIndex
CREATE INDEX "article_campaigns_published_at_idx" ON "article_campaigns"("published_at" DESC);

-- CreateIndex
CREATE INDEX "article_campaigns_compliance_next_retry_at_idx" ON "article_campaigns"("compliance_next_retry_at");

-- CreateIndex
CREATE INDEX "article_campaigns_compliance_status_compliance_next_retr_idx" ON "article_campaigns"("compliance_status", "compliance_next_retry_at");
