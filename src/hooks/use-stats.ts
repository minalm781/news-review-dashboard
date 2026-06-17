"use client";

import { useQuery } from "@tanstack/react-query";

import type { StatsResponse } from "@/types/api";

async function fetchStats(): Promise<StatsResponse> {
  const response = await fetch("/api/stats");

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load stats");
  }

  return response.json();
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });
}
