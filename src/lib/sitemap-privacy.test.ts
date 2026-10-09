import { describe, expect, it } from "vitest";

import { PRIVATE_PATHS, PUBLIC_PATHS, SITE_ORIGIN } from "./seo";
import { Route as IndexRoute } from "@/routes/api/public/sitemap[.]xml";
import { Route as PagesRoute } from "@/routes/api/public/sitemap-pages[.]xml";

/**
 * Regression guard: the public sitemaps list fixed public screens only.
 * They never read records, so private, blocked, reported, demonstration or
 * otherwise ineligible entries cannot appear. If record-level sitemaps are
 * added later, they must come with their own eligibility tests.
 */
type Handler = () => Response | Promise<Response>;
const handler = (route: unknown): Handler =>
  (route as { options: { server: { handlers: { GET: Handler } } } }).options.server.handlers.GET;

async function body(route: unknown): Promise<{ xml: string; res: Response }> {
  const res = await handler(route)();
  return { xml: await res.text(), res };
}

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

describe("public sitemap privacy", () => {
  it("pages sitemap lists exactly the public screens, nothing else", async () => {
    const { xml, res } = await body(PagesRoute);
    expect(res.headers.get("content-type")).toContain("xml");
    expect(locs(xml).sort()).toEqual(PUBLIC_PATHS.map((p) => `${SITE_ORIGIN}${p === "/" ? "/" : p}`).sort());
  });

  it("never lists private, account, moderation or source screens", async () => {
    const { xml } = await body(PagesRoute);
    for (const path of PRIVATE_PATHS) {
      expect(locs(xml)).not.toContain(`${SITE_ORIGIN}${path}`);
    }
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

  it("index names only the pages sitemap", async () => {
    const { xml } = await body(IndexRoute);
    expect(locs(xml)).toEqual([`${SITE_ORIGIN}/api/public/sitemap-pages.xml`]);
  });
});
