import type { NextRequest } from "next/server";

export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const headerSecret = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  return headerSecret === secret || bearerSecret === secret;
}
