import { ComplianceStatus, LaunchStatus } from "@prisma/client";
import { z } from "zod";

export const articlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z
    .enum([
      "headline",
      "source",
      "category",
      "complianceStatus",
      "launchStatus",
      "publishedAt",
      "location",
      "campaignId",
    ])
    .default("publishedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().trim().optional(),
  complianceStatus: z.nativeEnum(ComplianceStatus).optional(),
  launchStatus: z.nativeEnum(LaunchStatus).optional(),
  source: z.string().trim().optional(),
});

export type ArticlesQueryInput = z.infer<typeof articlesQuerySchema>;
