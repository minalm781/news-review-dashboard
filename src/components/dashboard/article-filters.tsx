"use client";

import type { ComplianceStatus, LaunchStatus } from "@prisma/client";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ArticleFilters {
  search: string;
  complianceStatus: ComplianceStatus | "all";
  launchStatus: LaunchStatus | "all";
  source: string;
}

interface ArticleFiltersBarProps {
  filters: ArticleFilters;
  sources: string[];
  onChange: (filters: ArticleFilters) => void;
}

export function ArticleFiltersBar({
  filters,
  sources,
  onChange,
}: ArticleFiltersBarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="relative md:col-span-2 xl:col-span-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search headlines, URLs, sources…"
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
        />
      </div>

      <Select
        value={filters.complianceStatus}
        onValueChange={(value) =>
          onChange({
            ...filters,
            complianceStatus: value as ArticleFilters["complianceStatus"],
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Compliance status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All compliance statuses</SelectItem>
          <SelectItem value="pending_review">Pending Review</SelectItem>
          <SelectItem value="compliant">Compliant</SelectItem>
          <SelectItem value="non_compliant">Non-Compliant</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.launchStatus}
        onValueChange={(value) =>
          onChange({
            ...filters,
            launchStatus: value as ArticleFilters["launchStatus"],
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Launch status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All launch statuses</SelectItem>
          <SelectItem value="pending_launch">Pending Launch</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="launched">Launched</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.source || "all"}
        onValueChange={(value) =>
          onChange({ ...filters, source: value === "all" ? "" : value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {sources.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
