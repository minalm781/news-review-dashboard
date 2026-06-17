"use client";

import { useQuery } from "@tanstack/react-query";

import type { ArticlesListResponse, ArticlesQueryParams } from "@/types/api";

async function fetchArticles(
  params: ArticlesQueryParams,
): Promise<ArticlesListResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  searchParams.set("sortBy", params.sortBy);
  searchParams.set("sortOrder", params.sortOrder);

  if (params.search) searchParams.set("search", params.search);
  if (params.complianceStatus) {
    searchParams.set("complianceStatus", params.complianceStatus);
  }
  if (params.launchStatus) {
    searchParams.set("launchStatus", params.launchStatus);
  }
  if (params.source) searchParams.set("source", params.source);

  const response = await fetch(`/api/articles?${searchParams.toString()}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load articles");
  }

  return response.json();
}

export function useArticles(params: ArticlesQueryParams) {
  return useQuery({
    queryKey: ["articles", params],
    queryFn: () => fetchArticles(params),
  });
}
