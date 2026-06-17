import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatsResponse } from "@/types/api";

const METRICS: Array<{
  key: keyof StatsResponse;
  label: string;
  description: string;
}> = [
  { key: "total", label: "Total Articles", description: "All synced articles" },
  {
    key: "pendingReview",
    label: "Pending Review",
    description: "Awaiting compliance",
  },
  { key: "compliant", label: "Compliant", description: "Ready for launch" },
  {
    key: "nonCompliant",
    label: "Non-Compliant",
    description: "Blocked from launch",
  },
  { key: "launched", label: "Launched", description: "Live campaigns" },
  { key: "processing", label: "Processing", description: "Launch in flight" },
];

export function MetricsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {METRICS.map((metric) => (
        <Card key={metric.key}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MetricsCards({ stats }: { stats: StatsResponse }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {METRICS.map((metric) => (
        <Card key={metric.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {stats[metric.key].toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
