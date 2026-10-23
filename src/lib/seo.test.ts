import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { renderSeoStaticAssets, validatePublicSiteOrigin } from "./seo-static-assets";

import {
  absoluteUrl,
  privatePage,
  publicPage,
  PUBLIC_PATHS,
  PRIVATE_PATHS,
  NOINDEX_PATHS,
  sitemapIndexXml,
  sitemapXml,
  robotsTxt,
  SITE_ORIGIN,
} from "./seo";

describe("generated static crawler assets", () => {
  it("uses the configured canonical HTTPS origin for both static files", () => {
    const assets = renderSeoStaticAssets("https://atlas.example/");
    expect(validatePublicSiteOrigin("https://atlas.example/")).toBe("https://atlas.example");
    expect(assets.robots).toContain("Sitemap: https://atlas.example/sitemap.xml");
    expect(assets.sitemap).toContain(
      "<loc>https://atlas.example/api/public/sitemap-pages.xml</loc>",
    );
    expect(assets.sitemap).toContain(
      "<loc>https://atlas.example/api/public/sitemap-localities.xml</loc>",
    );
    expect(assets.robots).not.toContain("life-lived-network.lovable.app");
    expect(assets.sitemap).not.toContain("life-lived-network.lovable.app");
  });

  it("rejects non-HTTPS, credentialed, path, query and fragment origins", () => {
    for (const invalid of [
      "http://atlas.example",
      "https://user:password@atlas.example",
      "https://atlas.example/app",
      "https://atlas.example?campaign=1",
      "https://atlas.example#section",
      "not-a-url",
    ]) {
      expect(() => validatePublicSiteOrigin(invalid)).toThrow();
    }
  });

  it("runs static asset generation as part of the production build", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    ) as { scripts?: { build?: string } };
    expect(packageJson.scripts?.build).toContain("bun scripts/generate-seo-public-assets.ts");
    expect(packageJson.scripts?.build).toContain("vite build");
  });
});

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

  it("keeps the personal life list out of public indexability", () => {
    expect(NOINDEX_PATHS).toContain("/life-list");
    expect(PRIVATE_PATHS).not.toContain("/life-list");
    expect(PUBLIC_PATHS).not.toContain("/life-list");
    const head = privatePage({
      path: "/life-list",
      title: "Your life list",
      description: "A private list.",
    });
    expect(head.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
    expect(head.links).toEqual([]);
    expect(robotsTxt()).not.toContain("Disallow: /life-list");
  });
});

describe("crawler policy", () => {
  it("explicitly allows ChatGPT Search while preserving private-route exclusions in its own group", () => {
    const policy = robotsTxt();
    const oaiStart = policy.indexOf("User-agent: OAI-SearchBot");
    const wildcardStart = policy.indexOf("User-agent: *", oaiStart);
    expect(oaiStart).toBeGreaterThanOrEqual(0);
    expect(wildcardStart).toBeGreaterThan(oaiStart);
    const oaiGroup = policy.slice(oaiStart, wildcardStart);
    expect(oaiGroup).toContain("Allow: /");
    for (const path of PRIVATE_PATHS) expect(oaiGroup).toContain(`Disallow: ${path}`);
    for (const path of NOINDEX_PATHS) expect(oaiGroup).not.toContain(`Disallow: ${path}`);
    expect(policy).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });

  it("keeps static and server-generated crawler rules aligned", () => {
    const staticPolicy = readFileSync(new URL("../../public/robots.txt", import.meta.url), "utf8");
    const normaliseOrigin = (value: string) =>
      value.replace(/^Sitemap:\s*.*$/m, "Sitemap: <canonical-origin>");
    expect(normaliseOrigin(staticPolicy)).toBe(normaliseOrigin(robotsTxt()));
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
