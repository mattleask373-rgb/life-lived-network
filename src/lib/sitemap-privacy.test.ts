import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PRIVATE_PATHS, PUBLIC_PATHS, SITE_ORIGIN, robotsTxt } from "./seo";

vi.mock("@/lib/gated-place-sitemap.server", () => ({
  getGatedPlaceSitemapPaths: vi.fn(async () => []),
}));

import { getGatedPlaceSitemapPaths } from "@/lib/gated-place-sitemap.server";
import { Route as IndexRoute } from "@/routes/api/public/sitemap[.]xml";
import { Route as PagesRoute } from "@/routes/api/public/sitemap-pages[.]xml";
import { Route as RobotsRoute } from "@/routes/robots[.]txt";
import { Route as SitemapRoute } from "@/routes/sitemap[.]xml";

type Handler = () => Response | Promise<Response>;
const handler = (route: unknown): Handler =>
  (route as { options: { server: { handlers: { GET: Handler } } } }).options.server.handlers.GET;

async function body(route: unknown): Promise<{ xml: string; res: Response }> {
  const res = await handler(route)();
  return { xml: await res.text(), res };
}

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? "");
const gatedPaths = ["/gb/example-place", "/gb/example-place/cleaning"];

afterEach(() => {
  vi.mocked(getGatedPlaceSitemapPaths).mockReset().mockResolvedValue([]);
});

describe("public sitemap privacy", () => {
  it("pages sitemap lists fixed public screens and no dynamic paths unless gate-approved", async () => {
    const { xml, res } = await body(PagesRoute);
    expect(res.headers.get("content-type")).toContain("xml");
    expect(locs(xml).sort()).toEqual(PUBLIC_PATHS.map((path) => `${SITE_ORIGIN}${path}`).sort());
  });

  it("only includes dynamic locality/service paths returned by the shared gate adapter", async () => {
    vi.mocked(getGatedPlaceSitemapPaths).mockResolvedValue(gatedPaths);

    const pages = await body(PagesRoute);
    const root = await body(SitemapRoute);
    for (const path of gatedPaths) {
      expect(locs(pages.xml)).toContain(`${SITE_ORIGIN}${path}`);
      expect(locs(root.xml)).toContain(`${SITE_ORIGIN}${path}`);
    }
  });

  it("never lists private, account, moderation or source screens", async () => {
    const { xml } = await body(PagesRoute);
    for (const path of PRIVATE_PATHS) expect(locs(xml)).not.toContain(`${SITE_ORIGIN}${path}`);
  });

  it("robots.txt disallows every route marked private", () => {
    const robots = readFileSync(new URL("../../public/robots.txt", import.meta.url), "utf8");
    const rules = robots.split(/\r?\n/);
    for (const path of PRIVATE_PATHS) expect(rules).toContain(`Disallow: ${path}`);
  });

  it("robots.txt advertises static fallback and dynamic sitemap index", () => {
    const robots = readFileSync(new URL("../../public/robots.txt", import.meta.url), "utf8");
    expect(robots).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
    expect(robots).toContain(`Sitemap: ${SITE_ORIGIN}/api/public/sitemap.xml`);
  });

  it("static public/sitemap.xml lists exactly the fixed public screens", () => {
    const sitemap = readFileSync(new URL("../../public/sitemap.xml", import.meta.url), "utf8");
    expect(locs(sitemap).sort()).toEqual(PUBLIC_PATHS.map((path) => `${SITE_ORIGIN}${path}`).sort());
    for (const path of PRIVATE_PATHS) expect(locs(sitemap)).not.toContain(`${SITE_ORIGIN}${path}`);
  });

  it("generated robotsTxt matches the static public/robots.txt", () => {
    const staticRobots = readFileSync(new URL("../../public/robots.txt", import.meta.url), "utf8");
    expect(robotsTxt()).toBe(staticRobots);
  });

  it("dynamic /robots.txt route serves the generated policy", async () => {
    const { xml: text, res } = await body(RobotsRoute);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(text).toBe(robotsTxt());
    for (const path of PRIVATE_PATHS) expect(text).toContain(`Disallow: ${path}`);
    expect(text).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
    expect(text).toContain(`Sitemap: ${SITE_ORIGIN}/api/public/sitemap.xml`);
  });

  it("fixed pages never contain record-level identifiers or query strings", async () => {
    const { xml } = await body(PagesRoute);
    for (const loc of locs(xml)) {
      const path = loc.slice(SITE_ORIGIN.length);
      expect(path).not.toMatch(/[?#]/);
      expect(path).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
      expect(path.split("/").filter(Boolean).length).toBeLessThanOrEqual(1);
    }
    expect(xml.toLowerCase()).not.toMatch(/demo|blocked|reported|fixture/);
  });

  it("keeps known personal and internal screens private", () => {
    expect(PRIVATE_PATHS).toContain("/earn");
    expect(PRIVATE_PATHS).toContain("/memories");
    expect(PRIVATE_PATHS).toContain("/profile");
    expect(PRIVATE_PATHS).toContain("/conversations");
  });

  it("dynamic /sitemap.xml lists fixed public screens and gate-approved dynamic paths", async () => {
    const { xml, res } = await body(SitemapRoute);
    expect(res.headers.get("content-type")).toContain("xml");
    for (const path of PUBLIC_PATHS) expect(locs(xml)).toContain(`${SITE_ORIGIN}${path}`);
    for (const path of PRIVATE_PATHS) expect(locs(xml)).not.toContain(`${SITE_ORIGIN}${path}`);
  });

  it("index names the public pages sitemap", async () => {
    const { xml } = await body(IndexRoute);
    expect(locs(xml)).toEqual([`${SITE_ORIGIN}/api/public/sitemap-pages.xml`]);
  });
});
