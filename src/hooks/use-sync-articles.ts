"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SyncArticlesResponse } from "@/types/api";

async function syncArticles(): Promise<SyncArticlesResponse> {
  const response = await fetch("/api/articles/sync", { method: "POST" });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to sync articles");
  }

  return response.json();
}

export function useSyncArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncArticles,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["articles"] }),
        queryClient.invalidateQueries({ queryKey: ["stats"] }),
      ]);
    },
  });
}
