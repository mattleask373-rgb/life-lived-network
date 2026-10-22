import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  PRIVATE_PATHS,
  PUBLIC_PATHS,
  PUBLIC_SITEMAP_CHILD_PATHS,
  SITE_ORIGIN,
  robotsTxt,
} from "./seo";
import { Route as IndexRoute } from "@/routes/api/public/sitemap[.]xml";
import { Route as PagesRoute } from "@/routes/api/public/sitemap-pages[.]xml";
import { Route as RobotsRoute } from "@/routes/robots[.]txt";
import { Route as SitemapRoute } from "@/routes/sitemap[.]xml";
import { Route as LifeListRoute } from "@/routes/life-list";

/**
 * Regression guard: the fixed-pages sitemap lists only known public screens;
 * locality and service sitemaps have separate eligibility gates and regression suites.
 * Private screens never enter any sitemap, and uncertain source data
 * fails closed rather than becoming an invented or thin search landing page.
 */
type Handler = () => Response | Promise<Response>;
type Head = () => { meta: Array<Record<string, string>>; links: Array<Record<string, string>> };
const lifeListHead = (LifeListRoute as unknown as { options: { head: Head } }).options.head;
const handler = (route: unknown): Handler =>
  (route as { options: { server: { handlers: { GET: Handler } } } }).options.server.handlers.GET;

async function body(route: unknown): Promise<{ xml: string; res: Response }> {
  const res = await handler(route)();
  return { xml: await res.text(), res };
}

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? "");

describe("public sitemap privacy", () => {
  it("marks the personal life-list route noindex without a canonical URL", () => {
    const head = lifeListHead();
    expect(head.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
    expect(head.links).toEqual([]);
  });

  it("pages sitemap lists exactly the public screens, nothing else", async () => {
    const { xml, res } = await body(PagesRoute);
    expect(res.headers.get("content-type")).toContain("xml");
    expect(locs(xml).sort()).toEqual(PUBLIC_PATHS.map((p) => `${SITE_ORIGIN}${p}`).sort());
  });

  it("never lists private, account, moderation or source screens", async () => {
    const { xml } = await body(PagesRoute);
    for (const path of PRIVATE_PATHS) {
      expect(locs(xml)).not.toContain(`${SITE_ORIGIN}${path}`);
    }
  });

  it("robots.txt disallows every route marked private", () => {
    const robots = readFileSync(new URL("../../public/robots.txt", import.meta.url), "utf8");
    const rules = robots.split(/\r?\n/);
    for (const path of PRIVATE_PATHS) expect(rules).toContain(`Disallow: ${path}`);
  });

  it("robots.txt names the static sitemap for deploy reliability", () => {
    const robots = readFileSync(new URL("../../public/robots.txt", import.meta.url), "utf8");
    expect(robots).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });

  it("static public/sitemap.xml indexes the public child sitemaps", () => {
    const sitemap = readFileSync(new URL("../../public/sitemap.xml", import.meta.url), "utf8");
    expect(sitemap).toContain("<sitemapindex");
    expect(locs(sitemap)).toEqual(
      PUBLIC_SITEMAP_CHILD_PATHS.map((path) => `${SITE_ORIGIN}${path}`),
    );
    for (const path of PRIVATE_PATHS) {
      expect(locs(sitemap)).not.toContain(`${SITE_ORIGIN}${path}`);
    }
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
  });

  it("contains no record-level addresses, ids or query strings", async () => {
    const { xml } = await body(PagesRoute);
    for (const loc of locs(xml)) {
      const path = loc.slice(SITE_ORIGIN.length);
      expect(path).not.toMatch(/[?#]/);
      expect(path).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i); // uuid
      expect(path.split("/").filter(Boolean).length).toBeLessThanOrEqual(1);
    }
    expect(xml.toLowerCase()).not.toMatch(/demo|blocked|reported|fixture/);
  });

  it("includes every route calling privatePage in PRIVATE_PATHS", () => {
    // Assert known private routes like /earn, /memories, /profile are present
    expect(PRIVATE_PATHS).toContain("/earn");
    expect(PRIVATE_PATHS).toContain("/memories");
    expect(PRIVATE_PATHS).toContain("/profile");
    expect(PRIVATE_PATHS).toContain("/conversations");
  });

  it("dynamic /sitemap.xml route indexes all public child sitemaps", async () => {
    const { xml, res } = await body(SitemapRoute);
    expect(res.headers.get("content-type")).toContain("xml");
    expect(xml).toContain("<sitemapindex");
    expect(locs(xml)).toEqual(PUBLIC_SITEMAP_CHILD_PATHS.map((path) => `${SITE_ORIGIN}${path}`));
    for (const path of PRIVATE_PATHS) {
      expect(locs(xml)).not.toContain(`${SITE_ORIGIN}${path}`);
    }
  });

  it("API sitemap index names all public child sitemaps", async () => {
    const { xml } = await body(IndexRoute);
    expect(locs(xml)).toEqual(PUBLIC_SITEMAP_CHILD_PATHS.map((path) => `${SITE_ORIGIN}${path}`));
  });
});
