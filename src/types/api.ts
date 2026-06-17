import type {
  ComplianceStatus,
  LaunchStatus,
} from "@prisma/client";

export interface ArticleDto {
  id: string;
  url: string;
  headline: string;
  source: string | null;
  category: string | null;
  location: string | null;
  publishedAt: string | null;
  summary: string | null;
  complianceStatus: ComplianceStatus;
  complianceReason: string | null;
  complianceCheckedAt: string | null;
  complianceRetryCount: number;
  complianceErrorMessage: string | null;
  launchStatus: LaunchStatus;
  campaignId: string | null;
  launchedAt: string | null;
  launchErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticlesListResponse {
  data: ArticleDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  lastSyncedAt: string | null;
  sources: string[];
}

export interface StatsResponse {
  total: number;
  pendingReview: number;
  compliant: number;
  nonCompliant: number;
  launched: number;
  processing: number;
}

export interface ArticlesQueryParams {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  search?: string;
  complianceStatus?: ComplianceStatus;
  launchStatus?: LaunchStatus;
  source?: string;
}

export type SortableArticleField =
  | "headline"
  | "source"
  | "category"
  | "complianceStatus"
  | "launchStatus"
  | "publishedAt"
  | "location"
  | "campaignId";

export interface SyncArticlesResponse {
  inserted: number;
  skipped: number;
  duplicatesInResponse: number;
  totalFetched: number;
  lastSyncedAt: string;
  complianceDueAt: string;
}
