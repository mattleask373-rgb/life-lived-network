import { describe, expect, it } from "vitest";
import { isLocalityIndexable, localitySitemapUrls } from "./locality-sitemap";

describe("locality sitemap", () => {
  it("excludes thin localities", () => {
    expect(isLocalityIndexable(0)).toBe(false);
    expect(isLocalityIndexable(2)).toBe(false);
    expect(isLocalityIndexable(3)).toBe(true);
  });

  it("lists only indexable unique paths", () => {
    const urls = localitySitemapUrls([
      { countrySegment: "gb", slug: "bristol", realEntryCount: 5 },
      { countrySegment: "gb", slug: "sparse", realEntryCount: 1 },
      { countrySegment: "gb", slug: "bristol", realEntryCount: 8 },
    ]);
    expect(urls).toHaveLength(1);
    expect(urls[0]?.path).toBe("/gb/bristol");
  });

  it("omits lastModified when unknown", () => {
    const urls = localitySitemapUrls([
      { countrySegment: "gb", slug: "york", realEntryCount: 3 },
    ]);
    expect(urls[0]?.lastModified).toBeUndefined();
  });
});
