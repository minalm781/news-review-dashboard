-- AlterTable: add api_category, compliance_category, primus_job_id, primus_job_url
ALTER TABLE "article_campaigns"
  ADD COLUMN IF NOT EXISTS "api_category"        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "compliance_category" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "primus_job_id"       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "primus_job_url"      VARCHAR(2048);
