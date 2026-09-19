import { describe, expect, it } from "vitest";

import {
  absoluteUrl,
  privatePage,
  publicPage,
  PUBLIC_PATHS,
  PRIVATE_PATHS,
  sitemapIndexXml,
  sitemapXml,
  SITE_ORIGIN,
} from "./seo";

describe("canonical addresses", () => {
  it("drops tracking parameters and fragments", () => {
    expect(absoluteUrl("/road-trip?utm_source=x#stops")).toBe(`${SITE_ORIGIN}/road-trip`);
  });

  it("keeps the root as a single slash and collapses duplicates", () => {
    expect(absoluteUrl("/")).toBe(`${SITE_ORIGIN}/`);
    expect(absoluteUrl("//uk//birmingham/")).toBe(`${SITE_ORIGIN}/uk/birmingham`);
  });
});

describe("what a page says about itself", () => {
  it("a public page is indexable and canonical", () => {
    const head = publicPage({ path: "/journey", title: "T", description: "D" });
    expect(head.links).toEqual([{ rel: "canonical", href: `${SITE_ORIGIN}/journey` }]);
    expect(head.meta).toContainEqual({ name: "robots", content: "index, follow" });
  });

  it("a public page only claims an image when it has one", () => {
    const without = publicPage({ path: "/give", title: "T", description: "D" });
    expect(without.meta.some((m) => m["property"] === "og:image")).toBe(false);
    const withImage = publicPage({
      path: "/give",
      title: "T",
      description: "D",
      image: "https://example.org/a.jpg",
    });
    expect(withImage.meta).toContainEqual({
      property: "og:image",
      content: "https://example.org/a.jpg",
    });
  });

  it("a private page is never indexed and never canonicalised", () => {
    const head = privatePage({ path: "", title: "T", description: "D" });
    expect(head.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
    expect(head.links).toEqual([]);
  });

  it("keeps public and private screens apart", () => {
    for (const path of PRIVATE_PATHS) expect(PUBLIC_PATHS).not.toContain(path);
  });
});

describe("sitemaps", () => {
  it("lists only absolute canonical addresses", () => {
    const xml = sitemapXml([{ path: "/journey?utm_source=x", changeFrequency: "weekly" }]);
    expect(xml).toContain(`<loc>${SITE_ORIGIN}/journey</loc>`);
    expect(xml).not.toContain("utm_source");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
  });

  it("omits a last modified date when none is known", () => {
    expect(sitemapXml([{ path: "/give" }])).not.toContain("lastmod");
  });

  it("indexes child sitemaps", () => {
    const xml = sitemapIndexXml(["/api/public/sitemap-pages.xml"]);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain(`${SITE_ORIGIN}/api/public/sitemap-pages.xml`);
  });
});
