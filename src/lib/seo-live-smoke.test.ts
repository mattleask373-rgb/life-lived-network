import { describe, expect, it } from "vitest";

import {
  DEFAULT_SEO_SMOKE_ORIGIN,
  evaluateSeoSmoke,
  SITEMAP_CHILD_PATHS as childPaths,
  type SeoSmokeDocuments,
  type SitemapChildSmokeDocument,
  type SmokeDocument,
} from "../../scripts/seo-live-smoke";

const origin = DEFAULT_SEO_SMOKE_ORIGIN;
const publicPaths = ["/", "/journey", "/road-trip", "/life-list", "/give", "/make"];
const privatePaths = [
  "/auth",
  "/profile",
  "/conversations",
  "/need",
  "/help",
  "/moderation",
  "/sources",
  "/memories",
  "/partners",
  "/partner-tracker",
  "/earn",
];
function document(path: string, contentType: string, body: string): SmokeDocument {
  return { status: 200, contentType, body, finalUrl: new URL(path, origin).toString() };
}

function urlset(paths: string[]): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((path) => "<url><loc>" + origin + path + "</loc></url>").join("\n") +
    "\n</urlset>"
  );
}

function sitemapIndex(paths: readonly string[]): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((path) => "<sitemap><loc>" + origin + path + "</loc></sitemap>").join("\n") +
    "\n</sitemapindex>"
  );
}

function healthyDocuments(): SeoSmokeDocuments {
  const robots = [
    "User-agent: *",
    "Allow: /",
    ...privatePaths.map((path) => "Disallow: " + path),
    "Sitemap: " + origin + "/sitemap.xml",
  ].join("\n");
  const homepage =
    "<!doctype html><html><head>\n" +
    "<title>Real World Atlas</title>\n" +
    '<meta name="description" content="Discover useful things in the real world.">\n' +
    '<meta name="robots" content="index, follow">\n' +
    '<link rel="canonical" href="' +
    origin +
    '/">\n' +
    "</head><body></body></html>";

  return {
    robots: document("/robots.txt", "text/plain; charset=utf-8", robots),
    sitemap: document("/sitemap.xml", "application/xml; charset=utf-8", urlset(publicPaths)),
    homepage: document("/", "text/html; charset=utf-8", homepage),
  };
}

function healthyIndexDocuments(): SeoSmokeDocuments {
  const children: SitemapChildSmokeDocument[] = childPaths.map((path, index) => {
    const childUrls =
      index === 0
        ? publicPaths
        : index === 1
          ? ["/gb/birmingham", "/gb/lisbon"]
          : index === 2
            ? ["/gb/birmingham/gardening"]
            : [];
    return {
      path,
      document: document(path, "application/xml; charset=utf-8", urlset(childUrls)),
    };
  });
  const docs = healthyDocuments();
  docs.sitemap = document(
    "/sitemap.xml",
    "application/xml; charset=utf-8",
    sitemapIndex(childPaths),
  );
  docs.sitemapChildren = children;
  return docs;
}

describe("public SEO live smoke contract", () => {
  it("accepts a correct public robots file, URL-set sitemap and rendered homepage", () => {
    expect(evaluateSeoSmoke(healthyDocuments())).toEqual([]);
  });

  it("accepts a sitemap index and validates every child sitemap", () => {
    expect(evaluateSeoSmoke(healthyIndexDocuments())).toEqual([]);
  });

  it("rejects a sitemap index that omits a required child sitemap", () => {
    const docs = healthyIndexDocuments();
    docs.sitemap.body = sitemapIndex(childPaths.slice(0, 2));
    const failures = evaluateSeoSmoke(docs);
    expect(failures).toContain("sitemap.xml: missing child sitemap " + childPaths[2]);
  });

  it("rejects an unmonitored child sitemap rather than fetching arbitrary index URLs", () => {
    const docs = healthyIndexDocuments();
    docs.sitemap.body = sitemapIndex([...childPaths, "/api/private/export.xml"]);
    const failures = evaluateSeoSmoke(docs);
    expect(failures).toContain(
      "sitemap.xml: unmonitored child sitemap /api/private/export.xml; add an explicit smoke contract",
    );
  });

  it("rejects a child endpoint that rewrites to another same-origin sitemap", () => {
    const docs = healthyIndexDocuments();
    const localities = docs.sitemapChildren?.find((child) => child.path === childPaths[1]);
    if (!localities) throw new Error("Test fixture is missing the locality child sitemap");
    localities.document.finalUrl = new URL(childPaths[0]!, origin).toString();
    expect(evaluateSeoSmoke(docs)).toContain(
      "sitemap child " + childPaths[1] + ": redirected to unexpected path " + childPaths[0],
    );
  });

  it("rejects a child sitemap failure and private or cross-origin listed URLs", () => {
    const docs = healthyIndexDocuments();
    const services = docs.sitemapChildren?.find((child) => child.path === childPaths[2]);
    if (!services) throw new Error("Test fixture is missing the service child sitemap");
    services.document.status = 503;
    services.document.body = urlset(["/auth", "/gb/birmingham/gardening"]).replace(
      "</urlset>",
      "<url><loc>https://attacker.example/private</loc></url></urlset>",
    );
    const failures = evaluateSeoSmoke(docs);
    expect(failures).toContain(
      "sitemap child " + childPaths[2] + ": expected HTTP 200, received 503",
    );
    expect(failures).toContain(
      "sitemap child " + childPaths[2] + ": private route must not be listed: /auth",
    );
    expect(failures).toContain(
      "sitemap child " +
        childPaths[2] +
        ": URL is outside the canonical HTTPS origin: https://attacker.example/private",
    );
  });

  it("rejects the documented platform-default robots and missing XML sitemap", () => {
    const documents = healthyDocuments();
    documents.robots.body = "User-agent: *\nAllow: /";
    documents.sitemap = {
      status: 404,
      contentType: "text/html; charset=utf-8",
      body: "<!doctype html><title>Not found</title>",
      finalUrl: origin + "/sitemap.xml",
    };
    documents.homepage.body = "<!doctype html><title>Real World Atlas</title>";
    const failures = evaluateSeoSmoke(documents);
    expect(failures).toContain("robots.txt: missing the canonical Sitemap directive");
    expect(failures).toContain("sitemap.xml: expected HTTP 200, received 404");
    expect(failures).toContain("sitemap.xml: expected an XML content type");
    expect(failures).toContain("homepage: missing or incorrect canonical link");
  });

  it("rejects private URLs in a sitemap and cross-origin URLs", () => {
    const documents = healthyDocuments();
    documents.sitemap.body = documents.sitemap.body.replace(
      "</urlset>",
      "<url><loc>" +
        origin +
        "/auth</loc></url>" +
        "<url><loc>https://attacker.example/private</loc></url></urlset>",
    );
    const failures = evaluateSeoSmoke(documents);
    expect(failures).toContain("sitemap.xml: private route must not be listed: /auth");
    expect(failures).toContain(
      "sitemap.xml: URL is outside the canonical HTTPS origin: https://attacker.example/private",
    );
  });

  it("rejects a final response that redirects to a different origin", () => {
    const documents = healthyDocuments();
    documents.homepage.finalUrl = "https://attacker.example/";
    expect(evaluateSeoSmoke(documents)).toContain(
      "homepage: final response left the expected origin",
    );
  });

  it("requires a sitemap child response for every child named by the index", () => {
    const documents = healthyIndexDocuments();
    documents.sitemapChildren = documents.sitemapChildren?.filter(
      (child) => child.path !== childPaths[1],
    );
    expect(evaluateSeoSmoke(documents)).toContain(
      "sitemap.xml: child sitemap response was not checked for " + childPaths[1],
    );
  });
});
