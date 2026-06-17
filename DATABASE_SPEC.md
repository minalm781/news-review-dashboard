# NextGen A360 — News Review Screen
## Database Parameter Specification (Engineering Handoff)

**Project:** NextGen A360 — News Review Screen  
**Database:** PostgreSQL 14+  
**ORM:** Prisma  
**Tables:** 2  
**Enum types:** 3  
**Total columns:** 34  

---

## 1. ENUM TYPES

### ComplianceStatus
| Value | Meaning |
|-------|---------|
| pending_review | Compliance not finished (default on insert) |
| compliant | Passed FastRouter Call 1 + Call 2 — eligible for launch |
| non_compliant | Failed compliance check or unreadable URL |

### LaunchStatus
| Value | Meaning |
|-------|---------|
| pending_launch | Not launched yet (default on insert) |
| processing | Launch triggered; awaiting n8n callback |
| launched | Campaign created; terminal state (no re-launch) |

### SyncStatus
| Value | Meaning |
|-------|---------|
| idle | No active run |
| running | Job in progress |
| success | Last run succeeded |
| failed | Last run failed |

---

## 2. TABLE: article_campaigns

**Purpose:** One row per unique news article URL. Tracks sync → compliance → launch pipeline.

**Primary key:** id  
**Unique constraint:** url (deduplication key)

| Column | Type | Nullable | Default | Source | Description |
|--------|------|----------|---------|--------|-------------|
| id | UUID | NO | generated | System | Primary key |
| url | VARCHAR(2048) | NO | — | News API sync | Article URL; unique dedupe key |
| headline | TEXT | NO | — | News API sync | Article headline |
| source | VARCHAR(255) | YES | NULL | News API sync | Publisher domain (e.g. apnews.com) |
| category | VARCHAR(255) | YES | NULL | News API sync | Article category (e.g. Top News) |
| location | VARCHAR(255) | YES | NULL | Compliance Call 1 | Geo for Meta targeting (city/state/country) |
| published_at | TIMESTAMP(3) | YES | NULL | News API sync | Article publish datetime from API |
| summary | TEXT | YES | NULL | Compliance Call 1 | Plain-text summary (<500 chars) |
| compliance_status | ComplianceStatus | NO | pending_review | Compliance service | Compliance gate for launch |
| compliance_reason | VARCHAR(512) | YES | NULL | Compliance Call 2 | Compliance result or failure reason |
| compliance_checked_at | TIMESTAMP(3) | YES | NULL | Compliance service | Timestamp of last compliance attempt |
| compliance_retry_count | INTEGER | NO | 0 | Compliance service | Retry attempts (max 5 per PRD) |
| compliance_error_message | TEXT | YES | NULL | Compliance service | FastRouter API error message |
| compliance_next_retry_at | TIMESTAMP(3) | YES | NULL | Compliance service | Next scheduled retry (exponential backoff) |
| launch_status | LaunchStatus | NO | pending_launch | Launch flow | Campaign launch state machine |
| campaign_id | VARCHAR(255) | YES | NULL | n8n callback | External campaign ID after successful launch |
| launched_at | TIMESTAMP(3) | YES | NULL | n8n callback | When campaign was launched |
| launch_error_message | TEXT | YES | NULL | Launch API / callback | Launch failure message (enables relaunch) |
| n8n_webhook_response | JSONB | YES | NULL | Launch API | Raw JSON response from n8n webhook |
| created_at | TIMESTAMP(3) | NO | NOW() | System | Row created at first sync insert |
| updated_at | TIMESTAMP(3) | NO | auto | System | Last state change |

### Indexes: article_campaigns

| Type | Column(s) | Purpose |
|------|-----------|---------|
| UNIQUE | url | Deduplication |
| INDEX | compliance_status | Filter by compliance |
| INDEX | launch_status | Filter by launch state |
| INDEX | source | Source filter |
| INDEX | published_at DESC | Default table sort |
| INDEX | compliance_next_retry_at | Compliance retry cron |
| INDEX | compliance_status, compliance_next_retry_at | Pending + due-for-retry queries |

### Business rules: article_campaigns

- url must be UNIQUE — sync never re-inserts existing URLs
- Rows with launch_status = launched must never be overwritten by sync
- Only compliance_status = compliant rows may enter launch flow (app-enforced)

---

## 3. TABLE: sync_metadata

**Purpose:** Singleton row for news sync history and compliance job scheduling.  
**Primary key:** id (always value: default)

| Column | Type | Nullable | Default | Source | Description |
|--------|------|----------|---------|--------|-------------|
| id | VARCHAR(32) | NO | default | System | Fixed singleton key |
| last_synced_at | TIMESTAMP(3) | YES | NULL | News sync job | Displayed as Last Synced on dashboard |
| last_sync_status | SyncStatus | NO | idle | News sync job | Result of last sync run |
| last_sync_error | TEXT | YES | NULL | News sync job | Error if sync failed |
| last_sync_inserted_count | INTEGER | YES | NULL | News sync job | Articles inserted in last sync |
| last_sync_skipped_count | INTEGER | YES | NULL | News sync job | URLs skipped (already in DB) |
| compliance_due_at | TIMESTAMP(3) | YES | NULL | News sync job | last_synced_at + 15 min; triggers compliance cron |
| last_compliance_run_at | TIMESTAMP(3) | YES | NULL | Compliance cron | Last compliance batch run time |
| last_compliance_status | SyncStatus | NO | idle | Compliance cron | Result of last compliance run |
| last_compliance_error | TEXT | YES | NULL | Compliance cron | Error if compliance batch failed |
| created_at | TIMESTAMP(3) | NO | NOW() | System | Row created |
| updated_at | TIMESTAMP(3) | NO | auto | System | Last update |

### Seed row required

```sql
INSERT INTO sync_metadata (id) VALUES ('default');
```

---

## 4. DATA FLOW — WHO WRITES WHAT

News API sync (new rows):
  url, headline, source, category, published_at

FastRouter compliance service:
  summary, location, compliance_status, compliance_reason,
  compliance_checked_at, compliance_retry_count,
  compliance_error_message, compliance_next_retry_at

Launch API + n8n:
  launch_status, n8n_webhook_response, launch_error_message

n8n success callback:
  campaign_id, launched_at, launch_status = launched

Sync cron:
  sync_metadata.last_synced_at, last_sync_status, last_sync_inserted_count,
  last_sync_skipped_count, compliance_due_at

Compliance cron:
  sync_metadata.last_compliance_run_at, last_compliance_status

---

## 5. NOT STORED IN DB (environment variables only)

DATABASE_URL          — PostgreSQL connection string
FASTROUTER_API_KEY    — FastRouter compliance API auth
N8N_WEBHOOK_URL       — n8n launch webhook endpoint
CALLBACK_SECRET       — Validates n8n → app callbacks
CRON_SECRET           — Validates Vercel cron routes

---

## 6. OPTIONAL FUTURE COLUMNS (not in current schema)

primus_batch_id  VARCHAR(64)  — Primus batch ID (if Primus integration added)
primus_job_id    VARCHAR(64)  — Primus job ID per concept

Not required for PRD v1.1. campaign_id + n8n_webhook_response can hold external IDs today.

---

## 7. SUMMARY

| Table | Column count |
|-------|--------------|
| article_campaigns | 22 |
| sync_metadata | 12 |
| Total | 34 columns, 3 enum types |

DDL reference: prisma/migrations/20250604120000_init/migration.sql
