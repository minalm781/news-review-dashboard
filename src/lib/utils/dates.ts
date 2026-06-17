/**
 * Parses news API pubt strings e.g. "2026-06-09 05:05:21.0"
 */
export function parseNewsPublishedAt(pubt: string): Date | null {
  const cleaned = pubt.trim();
  const normalized = cleaned
    .replace(" ", "T")
    .replace(/\.0$/, "")
    .replace(/(\.\d+)$/, "");

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}
