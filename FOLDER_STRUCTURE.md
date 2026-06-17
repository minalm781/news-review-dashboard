# NextGen A360 — Folder Structure

Planned layout for the full application. Items marked **(P1)** exist in Phase 1.

```
news-review-dashboard/
├── .env.example                          (P1)
├── .gitignore                            (P1)
├── docker-compose.yml                    (P1) Local PostgreSQL
├── FOLDER_STRUCTURE.md                   (P1)
├── package.json                          (P1)
├── tsconfig.json                         (P1)
├── README.md                             (P1)
├── vercel.json                           (P2) Cron schedules
│
├── prisma/
│   ├── schema.prisma                     (P1)
│   ├── seed.ts                           (P1)
│   └── migrations/
│       └── 20250604120000_init/          (P1)
│
└── src/
    ├── app/
    │   ├── layout.tsx                    (P5)
    │   ├── page.tsx                      (P5)
    │   ├── globals.css                   (P5)
    │   ├── (dashboard)/
    │   │   └── page.tsx                  (P5)
    │   └── api/
    │       ├── articles/
    │       │   ├── route.ts              (P2) GET
    │       │   └── sync/route.ts         (P2) POST
    │       ├── compliance/
    │       │   └── run/route.ts          (P3) POST
    │       ├── launch/route.ts           (P4) POST
    │       ├── campaign-callback/route.ts (P4) POST
    │       ├── stats/route.ts            (P2) GET
    │       └── cron/
    │           ├── sync-news/route.ts    (P2)
    │           └── run-compliance/route.ts (P3)
    │
    ├── components/
    │   ├── ui/                           (P5) shadcn primitives
    │   └── dashboard/                    (P5) table, filters, metrics
    │
    ├── hooks/                            (P5) React Query hooks
    │
    ├── lib/
    │   ├── db/
    │   │   └── index.ts                  (P1) Prisma singleton
    │   ├── services/
    │   │   ├── news-sync.ts              (P2)
    │   │   ├── compliance.ts             (P3)
    │   │   └── launch.ts                 (P4)
    │   ├── validators/
    │   │   ├── news-api.ts               (P2)
    │   │   └── api.ts                    (P2+)
    │   └── utils/
    │       ├── backoff.ts                (P3)
    │       └── dates.ts                  (P2)
    │
    └── types/
        ├── database.ts                   (P1)
        └── news-api.ts                   (P1)
```
