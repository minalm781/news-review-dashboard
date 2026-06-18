"use client";

import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  ArticleFiltersBar,
  type ArticleFilters,
} from "@/components/dashboard/article-filters";
import {
  ArticlesEmptyState,
  ArticlesErrorState,
  ArticlesTable,
  ArticlesTableSkeleton,
} from "@/components/dashboard/articles-table";
import {
  MetricsCards,
  MetricsCardsSkeleton,
} from "@/components/dashboard/metrics-cards";
import { Button } from "@/components/ui/button";
import { useArticles } from "@/hooks/use-articles";
import { useStats } from "@/hooks/use-stats";
import { useSyncArticles } from "@/hooks/use-sync-articles";
import { formatDate } from "@/lib/utils";
import type { SortableArticleField } from "@/types/api";

const DEFAULT_FILTERS: ArticleFilters = {
  search: "",
  complianceStatus: "all",
  launchStatus: "all",
  source: "",
  category: "",
};

async function launchArticle(articleId: string) {
  const res = await fetch("/api/launch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articleId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to start campaign");
  }
  return res.json();
}

export function DashboardShell() {
  const [filters, setFilters] = useState<ArticleFilters>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "publishedAt", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const sortBy = (sorting[0]?.id as SortableArticleField | undefined) ?? "publishedAt";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 25,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
      search: debouncedSearch || undefined,
      complianceStatus:
        filters.complianceStatus === "all"
          ? undefined
          : filters.complianceStatus,
      launchStatus:
        filters.launchStatus === "all" ? undefined : filters.launchStatus,
      source: filters.source || undefined,
      category: filters.category || undefined,
    }),
    [page, sortBy, sortOrder, debouncedSearch, filters],
  );

  const queryClient = useQueryClient();
  const articlesQuery = useArticles(queryParams);
  const statsQuery = useStats();
  const syncMutation = useSyncArticles();

  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const launchMutation = useMutation({
    mutationFn: launchArticle,
    onMutate: (articleId) => setLaunchingId(articleId),
    onSettled: () => {
      setLaunchingId(null);
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const selectedCount = Object.keys(rowSelection).length;
  const hasFilters =
    Boolean(debouncedSearch) ||
    filters.complianceStatus !== "all" ||
    filters.launchStatus !== "all" ||
    Boolean(filters.source) ||
    Boolean(filters.category);

  function handleRefresh() {
    syncMutation.mutate(undefined, {
      onSuccess: () => {
        setPage(1);
        setRowSelection({});
      },
    });
  }

  const isRefreshing =
    syncMutation.isPending ||
    articlesQuery.isFetching ||
    statsQuery.isFetching;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              NextGen A360
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              News Review Screen
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Last synced:{" "}
              {syncMutation.data?.lastSyncedAt
                ? formatDate(syncMutation.data.lastSyncedAt)
                : articlesQuery.data?.lastSyncedAt
                  ? formatDate(articlesQuery.data.lastSyncedAt)
                  : "—"}
            </p>
            {syncMutation.isError ? (
              <p className="mt-1 text-sm text-destructive">
                Sync failed: {syncMutation.error.message}
              </p>
            ) : null}
            {syncMutation.isSuccess ? (
              <p className="mt-1 text-sm text-emerald-700">
                Synced {syncMutation.data.inserted} new article
                {syncMutation.data.inserted === 1 ? "" : "s"} (
                {syncMutation.data.skipped} skipped)
              </p>
            ) : null}
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
            {syncMutation.isPending ? "Syncing…" : "Refresh"}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 lg:px-8">
        {statsQuery.isLoading ? (
          <MetricsCardsSkeleton />
        ) : statsQuery.isError ? (
          <ArticlesErrorState
            message={statsQuery.error.message}
            onRetry={() => void statsQuery.refetch()}
          />
        ) : statsQuery.data ? (
          <MetricsCards stats={statsQuery.data} />
        ) : null}

        <ArticleFiltersBar
          filters={filters}
          sources={articlesQuery.data?.sources ?? []}
          categories={articlesQuery.data?.categories ?? []}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
            setRowSelection({});
          }}
        />

        {articlesQuery.isLoading ? (
          <ArticlesTableSkeleton />
        ) : articlesQuery.isError ? (
          <ArticlesErrorState
            message={articlesQuery.error.message}
            onRetry={() => void articlesQuery.refetch()}
          />
        ) : !articlesQuery.data ? null : articlesQuery.data.data.length === 0 ? (
          <ArticlesEmptyState hasFilters={hasFilters} />
        ) : (
          <ArticlesTable
            articles={articlesQuery.data.data}
            sorting={sorting}
            onSortingChange={(next) => {
              setSorting(next);
              setPage(1);
            }}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            page={articlesQuery.data.meta.page}
            totalPages={articlesQuery.data.meta.totalPages}
            onPageChange={setPage}
            onLaunch={(articleId) => launchMutation.mutate(articleId)}
            launchingId={launchingId}
          />
        )}

        {selectedCount > 0 ? (
          <div className="sticky bottom-4 z-20 mx-auto flex max-w-[1600px] items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-lg">
            <p className="text-sm font-medium">
              {selectedCount} article{selectedCount === 1 ? "" : "s"} selected
            </p>
            <Button disabled title="Bulk launch available in Phase 4">
              Launch Selected
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
