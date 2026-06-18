"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Rocket } from "lucide-react";
import { useMemo } from "react";

import { ComplianceBadge, LaunchBadge } from "@/components/dashboard/status-badges";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  rowSelection: RowSelectionState;
  onRowSelectionChange: (selection: RowSelectionState) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLaunch?: (articleId: string) => void;
  launchingId?: string | null;
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

export function ArticlesTable({
  articles,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  page,
  totalPages,
  onPageChange,
  onLaunch,
  launchingId,
}: ArticlesTableProps) {
  const columns = useMemo<ColumnDef<ArticleDto>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const compliantRows = table
            .getRowModel()
            .rows.filter((row) => row.original.complianceStatus === "compliant");
          const selectedCompliant = compliantRows.filter((row) =>
            row.getIsSelected(),
          );
          const allSelected =
            compliantRows.length > 0 &&
            selectedCompliant.length === compliantRows.length;
          const someSelected =
            selectedCompliant.length > 0 &&
            selectedCompliant.length < compliantRows.length;

          return (
            <Checkbox
              checked={allSelected || (someSelected && "indeterminate")}
              disabled={compliantRows.length === 0}
              onCheckedChange={(value) => {
                compliantRows.forEach((row) => row.toggleSelected(!!value));
              }}
              aria-label="Select all compliant articles"
            />
          );
        },
        cell: ({ row }) => {
          const isCompliant = row.original.complianceStatus === "compliant";
          return (
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!isCompliant}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label={`Select ${row.original.headline}`}
            />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "url",
        header: "Article Link",
        cell: ({ row }) => (
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
          >
            Open
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "headline",
        header: "Headline",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-xs font-medium">
            {row.original.headline}
          </span>
        ),
      },
      { accessorKey: "source", header: "Source" },
      {
        accessorKey: "apiCategory",
        header: "API Category",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.apiCategory ?? "—"}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "complianceCategory",
        header: "Compliance Category",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.complianceCategory ?? "—"}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "complianceStatus",
        header: "Compliance",
        cell: ({ row }) => (
          <ComplianceBadge status={row.original.complianceStatus} />
        ),
      },
      {
        accessorKey: "complianceReason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[12rem] text-muted-foreground">
            {row.original.complianceReason ?? "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "launchStatus",
        header: "Launch",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <LaunchBadge status={row.original.launchStatus} />
            {row.original.launchErrorMessage ? (
              <span title={row.original.launchErrorMessage}>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "campaignId",
        header: "Campaign ID",
        cell: ({ row }) => row.original.campaignId ?? "—",
      },
      { accessorKey: "location", header: "Location", cell: ({ row }) => row.original.location ?? "—" },
      {
        accessorKey: "publishedAt",
        header: "Published",
        cell: ({ row }) => formatDate(row.original.publishedAt),
      },
      {
        id: "startCampaign",
        header: "Start Campaign",
        cell: ({ row }) => {
          const article = row.original;
          const isCompliant = article.complianceStatus === "compliant";
          const isProcessing = article.launchStatus === "processing";
          const isLaunched = article.launchStatus === "launched";
          const isThisLaunching = launchingId === article.id;

          return (
            <Button
              size="sm"
              variant={isLaunched ? "ghost" : "default"}
              disabled={!isCompliant || isProcessing || isLaunched || isThisLaunching}
              title={
                !isCompliant
                  ? "Only compliant articles can be launched"
                  : isLaunched
                    ? "Campaign already launched"
                    : isProcessing
                      ? "Launch in progress"
                      : "Start campaign via Primus"
              }
              onClick={() => onLaunch?.(article.id)}
              className="gap-1.5"
            >
              <Rocket className="h-3.5 w-3.5" />
              {isThisLaunching ? "Starting…" : isLaunched ? "Launched" : isProcessing ? "Processing…" : "Start"}
            </Button>
          );
        },
        enableSorting: false,
      },
      {
        id: "primusJob",
        header: "Primus Job",
        cell: ({ row }) => {
          const { primusJobId, primusJobUrl } = row.original;
          if (!primusJobId && !primusJobUrl) return <span className="text-muted-foreground">—</span>;

          const href = primusJobUrl ?? undefined;
          const label = primusJobId ?? "View job";

          if (href) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-mono font-medium hover:bg-muted/80 hover:underline"
                title={`Open Primus job ${label}`}
              >
                {label}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            );
          }

          return (
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-mono font-medium">
              {label}
            </span>
          );
        },
        enableSorting: false,
      },
    ],
    [onLaunch, launchingId],
  );

  const table = useReactTable({
    data: articles,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: (row) => row.original.complianceStatus === "compliant",
    manualSorting: true,
    getRowId: (row) => row.id,
  });

  const sortableColumns: Record<string, SortableArticleField> = {
    headline: "headline",
    source: "source",
    category: "category",
    complianceStatus: "complianceStatus",
    launchStatus: "launchStatus",
    campaignId: "campaignId",
    location: "location",
    publishedAt: "publishedAt",
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="max-h-[calc(100vh-22rem)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortField = sortableColumns[header.column.id];
                  const sortDirection = sortField
                    ? sorting.find((item) => item.id === header.column.id)?.desc
                      ? "desc"
                      : sorting.find((item) => item.id === header.column.id)
                        ? "asc"
                        : false
                    : false;

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : sortField ? (
                        <button
                          type="button"
                          className="inline-flex items-center font-medium hover:text-foreground"
                          onClick={() => {
                            const existing = sorting.find(
                              (item) => item.id === header.column.id,
                            );
                            if (!existing) {
                              onSortingChange([
                                { id: header.column.id, desc: false },
                              ]);
                            } else if (!existing.desc) {
                              onSortingChange([
                                { id: header.column.id, desc: true },
                              ]);
                            } else {
                              onSortingChange([]);
                            }
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <SortIcon direction={sortDirection} />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
