import { describe, expect, it } from "vitest";
import { buildIndexableSitemapPage, sitemapPageUrl } from "./indexable-sitemap";

describe("indexable sitemap contract", () => {
  it("excludes non-indexable candidates", () => {
    const result = buildIndexableSitemapPage([
      { path: "/z", indexable: true },
      { path: "/demo", indexable: false },
      { path: "a", indexable: true },
    ]);
    expect(result.total).toBe(2);
    expect(result.urls.map((url) => url.path)).toEqual(["/a", "/z"]);
    expect(result.xml).not.toContain("/demo");
  });

  it("paginates deterministically", () => {
    const result = buildIndexableSitemapPage(
      [
        { path: "/a", indexable: true },
        { path: "/b", indexable: true },
        { path: "/c", indexable: true },
      ],
      2,
      2,
    );
    expect(result.total).toBe(3);
    expect(result.urls.map((url) => url.path)).toEqual(["/c"]);
  });

  it("rejects invalid page sizes", () => {
    expect(() => buildIndexableSitemapPage([], 1, 0)).toThrow("pageSize");
    expect(() => buildIndexableSitemapPage([], 1, 50001)).toThrow("pageSize");
  });

  it("builds absolute sitemap navigation", () => {
    expect(sitemapPageUrl("/api/public/sitemap-locality.xml", 2)).toContain("page=2");
  });
});
