"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { useMemo } from "react";

import { ComplianceBadge, LaunchBadge } from "@/components/dashboard/status-badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { ArticleDto, SortableArticleField } from "@/types/api";

interface ArticlesTableProps {
  articles: ArticleDto[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onCreateCampaign?: (article: ArticleDto) => void;
  onComplianceCheck?: (articleId: string) => void;
  checkingId?: string | null;
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (direction === "desc") return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

export function ArticlesTableSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

const sortableColumns: Record<string, SortableArticleField> = {
  headline: "headline",
  source: "source",
  complianceStatus: "complianceStatus",
  launchStatus: "launchStatus",
  campaignId: "campaignId",
  location: "location",
  publishedAt: "publishedAt",
};

export function ArticlesTable({
  articles,
  sorting,
  onSortingChange,
  page,
  totalPages,
  onPageChange,
  onCreateCampaign,
  onComplianceCheck,
  checkingId,
}: ArticlesTableProps) {
  const columns = useMemo<ColumnDef<ArticleDto>[]>(
    () => [
      // 1. Article Link
      {
        id: "url",
        header: "Article Link",
        cell: ({ row }) => (
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-blue-700 hover:underline"
          >
            Open
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ),
        enableSorting: false,
      },

      // 2. Headline
      {
        accessorKey: "headline",
        header: "Headline",
        cell: ({ row }) => (
          <span className="line-clamp-2 block w-[220px] font-medium">
            {row.original.headline}
          </span>
        ),
      },

      // 3. Source
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm">{row.original.source ?? "—"}</span>
        ),
      },

      // 4. Article Type (from News Launcher API)
      {
        id: "articleType",
        header: "Article Type",
        cell: ({ row }) => {
          const type = row.original.apiCategory ?? row.original.category;
          return (
            <span className="whitespace-nowrap rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {type ?? "—"}
            </span>
          );
        },
        enableSorting: false,
      },

      // 5. Location
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm">
            {row.original.location ?? "—"}
          </span>
        ),
      },

      // 6. Compliance Check (button)
      {
        id: "complianceCheck",
        header: "Compliance Check",
        cell: ({ row }) => {
          const article = row.original;
          const isChecking = checkingId === article.id;
          const isLaunched = article.launchStatus === "launched";
          const isPending = article.complianceStatus === "pending_review";

          return (
            <Button
              size="sm"
              variant="outline"
              disabled={isLaunched || isChecking || isPending}
              title={
                isLaunched
                  ? "Cannot re-check a launched article"
                  : isPending
                    ? "Compliance check already queued"
                    : "Trigger compliance check"
              }
              onClick={() => onComplianceCheck?.(article.id)}
              className="gap-1.5 whitespace-nowrap"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {isChecking ? "Checking…" : isPending ? "Queued" : "Check"}
            </Button>
          );
        },
        enableSorting: false,
      },

      // 7. Compliance Status
      {
        accessorKey: "complianceStatus",
        header: "Compliance Status",
        cell: ({ row }) => <ComplianceBadge status={row.original.complianceStatus} />,
      },

      // 8. Compliance Reason / Feedback
      {
        id: "complianceFeedback",
        header: "Compliance Feedback",
        cell: ({ row }) => {
          const reason = row.original.complianceReason;
          const error = row.original.complianceErrorMessage;
          return (
            <span className="line-clamp-2 block w-[200px] text-sm text-muted-foreground">
              {reason ?? error ?? "—"}
            </span>
          );
        },
        enableSorting: false,
      },

      // 9. Create Campaign (opens modal)
      {
        id: "createCampaign",
        header: "Create Campaign",
        cell: ({ row }) => {
          const article = row.original;
          const isCompliant = article.complianceStatus === "compliant";
          const isProcessing = article.launchStatus === "processing";
          const isLaunched = article.launchStatus === "launched";

          return (
            <Button
              size="sm"
              variant={isLaunched ? "ghost" : "default"}
              disabled={!isCompliant || isProcessing || isLaunched}
              title={
                !isCompliant
                  ? "Article must be compliant first"
                  : isLaunched
                    ? "Campaign already launched"
                    : isProcessing
                      ? "Campaign in progress"
                      : "Create campaign via Primus"
              }
              onClick={() => onCreateCampaign?.(article)}
              className="gap-1.5 whitespace-nowrap"
            >
              <Rocket className="h-3.5 w-3.5" />
              {isLaunched ? "Launched" : isProcessing ? "In Progress…" : "Create"}
            </Button>
          );
        },
        enableSorting: false,
      },

      // 10. Campaign Status (campaignId)
      {
        accessorKey: "campaignId",
        header: "Campaign Status",
        cell: ({ row }) => {
          const { campaignId, launchStatus } = row.original;
          if (campaignId) {
            return (
              <div className="flex flex-col gap-0.5">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 w-fit">
                  Active
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {campaignId}
                </span>
              </div>
            );
          }
          if (launchStatus === "processing") {
            return (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Creating…
              </span>
            );
          }
          return <span className="text-muted-foreground">—</span>;
        },
      },

      // 11. Launch Status
      {
        accessorKey: "launchStatus",
        header: "Launch Status",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <LaunchBadge status={row.original.launchStatus} />
            {row.original.launchErrorMessage ? (
              <span title={row.original.launchErrorMessage}>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </span>
            ) : null}
          </div>
        ),
      },

      // 12. Launched At / Published At
      {
        id: "timestamp",
        header: "Launched / Published",
        cell: ({ row }) => {
          const { launchedAt, publishedAt } = row.original;
          if (launchedAt) {
            return (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600">
                  Launched
                </span>
                <span className="whitespace-nowrap text-sm">{formatDate(launchedAt)}</span>
              </div>
            );
          }
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Published
              </span>
              <span className="whitespace-nowrap text-sm">{formatDate(publishedAt)}</span>
            </div>
          );
        },
        enableSorting: false,
      },

      // 13. Primus Job ID / URL
      {
        id: "primusJob",
        header: "Primus Job",
        cell: ({ row }) => {
          const { primusJobId, primusJobUrl } = row.original;
          if (!primusJobId && !primusJobUrl) {
            return <span className="text-muted-foreground">—</span>;
          }
          const label = primusJobId ?? "View job";
          if (primusJobUrl) {
            return (
              <a
                href={primusJobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium hover:bg-muted/70 hover:underline"
                title={`Open Primus job ${label}`}
              >
                {label}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            );
          }
          return (
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium">
              {label}
            </span>
          );
        },
        enableSorting: false,
      },
    ],
    [onCreateCampaign, onComplianceCheck, checkingId],
  );

  const table = useReactTable({
    data: articles,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    getRowId: (row) => row.id,
  });

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Horizontal + vertical scroll */}
      <div className="max-h-[calc(100vh-22rem)] overflow-auto">
        <Table className="min-w-[1600px]">
          <TableHeader className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortField = sortableColumns[header.column.id];
                  const sortDir = sortField
                    ? sorting.find((s) => s.id === header.column.id)?.desc
                      ? "desc"
                      : sorting.find((s) => s.id === header.column.id)
                        ? "asc"
                        : false
                    : false;

                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder ? null : sortField ? (
                        <button
                          type="button"
                          className="inline-flex items-center font-medium hover:text-foreground"
                          onClick={() => {
                            const existing = sorting.find(
                              (s) => s.id === header.column.id,
                            );
                            if (!existing) {
                              onSortingChange([{ id: header.column.id, desc: false }]);
                            } else if (!existing.desc) {
                              onSortingChange([{ id: header.column.id, desc: true }]);
                            } else {
                              onSortingChange([]);
                            }
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon direction={sortDir} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ArticlesEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <p className="text-lg font-medium">No articles found</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your search or filters to see more results."
          : "Run database migrations and seed data to populate the dashboard."}
      </p>
    </div>
  );
}

export function ArticlesErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
      <p className="text-lg font-medium">Unable to load articles</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button className="mt-4" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
