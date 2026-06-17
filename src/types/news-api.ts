/**
 * Shape from GET newsheadlines.press/hapi/launcherNews
 * Validated at runtime via src/lib/validators/news-api.ts
 */
export interface NewsApiArticle {
  /** headline */
  t: string;
  /** url */
  u: string;
  /** source domain */
  site: string;
  img?: string;
  /** published timestamp string e.g. "2026-06-04 10:48:55.0" */
  pubt: string;
  /** category */
  cat: string;
}

export interface NewsApiResponse {
  status: number;
  md?: { ver?: string };
  resultSet: NewsApiArticle[];
}
