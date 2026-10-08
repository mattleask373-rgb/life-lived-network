import { absoluteUrl, sitemapXml, type SitemapUrl } from "./seo";

export interface IndexablePageCandidate {
  path: string;
  indexable: boolean;
  lastModified?: string;
}

export interface SitemapPage {
  page: number;
  pageSize: number;
  total: number;
  urls: SitemapUrl[];
  xml: string;
}

export function buildIndexableSitemapPage(
  candidates: readonly IndexablePageCandidate[],
  page = 1,
  pageSize = 500,
): SitemapPage {
  if (!Number.isSafeInteger(page) || page < 1) throw new Error("page must be a positive integer");
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50000) {
    throw new Error("pageSize must be between 1 and 50000");
  }

  const eligible = candidates
    .filter((candidate) => candidate.indexable)
    .map(({ path, lastModified }) => ({
      path: path.startsWith("/") ? path : "/" + path,
      ...(lastModified ? { lastModified } : {}),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const start = (page - 1) * pageSize;
  const urls = eligible.slice(start, start + pageSize);

  return { page, pageSize, total: eligible.length, urls, xml: sitemapXml(urls) };
}

export function sitemapPageUrl(path: string, page: number): string {
  if (!Number.isSafeInteger(page) || page < 1) throw new Error("page must be a positive integer");
  return absoluteUrl(path.replace(/\/+$/, "") + "?page=" + page);
}
