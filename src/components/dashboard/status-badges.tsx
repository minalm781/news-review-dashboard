import type { ComplianceStatus, LaunchStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const COMPLIANCE_LABELS: Record<ComplianceStatus, string> = {
  pending_review: "Pending Review",
  compliant: "Compliant",
  non_compliant: "Non-Compliant",
};

const LAUNCH_LABELS: Record<LaunchStatus, string> = {
  pending_launch: "Pending Launch",
  processing: "Processing",
  launched: "Launched",
};

export function ComplianceBadge({
  status,
}: {
  status: ComplianceStatus;
}) {
  const variant =
    status === "compliant"
      ? "success"
      : status === "non_compliant"
        ? "destructive"
        : "warning";

  return <Badge variant={variant}>{COMPLIANCE_LABELS[status]}</Badge>;
}

export function LaunchBadge({ status }: { status: LaunchStatus }) {
  const variant =
    status === "launched"
      ? "success"
      : status === "processing"
        ? "info"
        : "muted";

  return <Badge variant={variant}>{LAUNCH_LABELS[status]}</Badge>;
}
