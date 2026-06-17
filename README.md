# NextGen A360 — News Review Screen

Internal Campaign Operations dashboard for syncing news articles, running compliance validation, and launching Meta campaigns via n8n.

**Current phase:** Phase 3 (news sync). Compliance workflow and launch APIs arrive in later phases.

## Prerequisites

- Node.js 20+
- Docker (local PostgreSQL)
- npm

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your database credentials differ from `docker-compose.yml`.

### 4. Run migrations

```bash
npm run db:migrate:deploy
```

For local development with migration prompts:

```bash
npm run db:migrate
```

### 5. Seed test data

```bash
npm run db:seed
```

### 6. Start the dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Inspect data (optional)

```bash
npm run db:studio
```

## Folder structure (Phase 1)

```
news-review-dashboard/
├── docker-compose.yml          # Local PostgreSQL 16
├── prisma/
│   ├── schema.prisma           # Models + enums
│   ├── seed.ts                 # Representative test rows
│   └── migrations/             # SQL migrations
├── src/
│   ├── app/                    # Next.js routes (Phase 5+)
│   ├── components/             # UI (Phase 5+)
│   ├── hooks/                  # React Query hooks (Phase 5+)
│   ├── lib/
│   │   ├── db/                 # Prisma client singleton
│   │   ├── services/           # Domain services (Phase 2+)
│   │   ├── validators/         # Zod schemas (Phase 2+)
│   │   └── utils/
│   └── types/
│       ├── database.ts         # Re-exports Prisma types
│       └── news-api.ts         # Discovered external API shape
└── .env.example
```

## Database models

### `article_campaigns`

Pipeline record per unique article URL: compliance gating and Meta launch state.

| Field | Notes |
|-------|--------|
| `compliance_status` | `pending_review` \| `compliant` \| `non_compliant` |
| `compliance_next_retry_at` | Next FastRouter retry (exponential backoff) |
| `launch_status` | `pending_launch` \| `processing` \| `launched` |
| `n8n_webhook_response` | JSON blob from webhook POST |

Unique constraint on `url`. Launched URLs must not be re-inserted during sync (enforced in service layer, Phase 2).

### `sync_metadata`

Singleton row (`id = "default"`): last sync timestamp/status and `compliance_due_at` (set to last sync + 15 minutes).

## Environment variables

| Variable | Phase | Description |
|----------|-------|-------------|
| `DATABASE_URL` | 1 | PostgreSQL connection string |
| `FASTROUTER_API_KEY` | 3 | FastRouter compliance API |
| `N8N_WEBHOOK_URL` | 4 | Campaign launch webhook |
| `CALLBACK_SECRET` | 4 | Header `x-callback-secret` on callback route |
| `CRON_SECRET` | 2 | Header `x-cron-secret` on Vercel cron routes |
| `NEXT_PUBLIC_APP_URL` | 5 | App base URL (optional) |

## News API shape (discovered)

`GET https://newsheadlines.press/hapi/launcherNews?sec=topnews&pageno=1&limit=1000`

```json
{
  "status": 200,
  "resultSet": [
    {
      "t": "headline",
      "u": "https://...",
      "site": "apnews.com",
      "pubt": "2026-06-04 10:48:55.0",
      "cat": "Top News"
    }
  ]
}
```

Mapped in Phase 2: `t` → headline, `u` → url, `site` → source, `cat` → category, `pubt` → published_at.

## Seed data summary

Eight articles covering:

- Pending review, compliant (ready), non-compliant
- Processing launch, launched, failed launch (relaunchable)
- Compliance retry scheduled, max retries exhausted

Plus `sync_metadata` with sample `last_synced_at` and `compliance_due_at`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:migrate` | Apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Load seed data |
| `npm run db:studio` | Prisma Studio GUI |

## Phase 3 (current)

- `POST /api/articles/sync` — fetches live news API, validates with Zod, inserts new URLs
- Updates `sync_metadata` (`lastSyncedAt`, counts, `complianceDueAt` = sync + 15 min)
- Dashboard **Refresh** triggers sync then invalidates articles/stats queries
- Vercel Cron every 30 minutes: `GET /api/cron/sync-news` (requires `CRON_SECRET`)

### Manual sync

```bash
curl -X POST http://localhost:3000/api/articles/sync
```

### Cron (production)

Set `CRON_SECRET` in Vercel. Cron sends `Authorization: Bearer <CRON_SECRET>`.

## Next phase

**Phase 4:** Compliance workflow (`POST /api/compliance/run`), FastRouter integration, compliance cron.
