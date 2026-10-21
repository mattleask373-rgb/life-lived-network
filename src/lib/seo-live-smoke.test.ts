import { describe, expect, it } from "vitest";

import {
  DEFAULT_SEO_SMOKE_ORIGIN,
  evaluateSeoSmoke,
  type SeoSmokeDocuments,
  type SmokeDocument,
} from "../scripts/seo-live-smoke";

const origin = DEFAULT_SEO_SMOKE_ORIGIN;

function document(path: string, contentType: string, body: string): SmokeDocument {
  return { status: 200, contentType, body, finalUrl: new URL(path, origin).toString() };
}

function healthyDocuments(): SeoSmokeDocuments {
  const urls = ["/", "/journey", "/road-trip", "/life-list", "/give", "/make"];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `<url><loc>${origin}${path}</loc></url>`).join("\n")}
</urlset>`;
  const privatePaths = [
    "/auth", "/profile", "/conversations", "/need", "/help", "/moderation",
    "/sources", "/memories", "/partners", "/partner-tracker", "/earn",
  ];
  const robots = [
    "User-agent: *",
    "Allow: /",
    ...privatePaths.map((path) => `Disallow: ${path}`),
    `Sitemap: ${origin}/sitemap.xml`,
  ].join("\n");
  const homepage = `<!doctype html><html><head>
<title>Real World Atlas</title>
<meta name="description" content="Discover useful things in the real world.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${origin}/">
</head><body></body></html>`;
  return {
    robots: document("/robots.txt", "text/plain; charset=utf-8", robots),
    sitemap: document("/sitemap.xml", "application/xml; charset=utf-8", sitemap),
    homepage: document("/", "text/html; charset=utf-8", homepage),
  };
}

describe("public SEO live smoke contract", () => {
  it("accepts a correct public robots file, sitemap and rendered homepage", () => {
    expect(evaluateSeoSmoke(healthyDocuments())).toEqual([]);
  });

  it("rejects the currently documented platform-default robots and missing XML sitemap", () => {
    const documents = healthyDocuments();
    documents.robots.body = "User-agent: *\nAllow: /";
    documents.sitemap = {
      status: 404,
      contentType: "text/html; charset=utf-8",
      body: "<!doctype html><title>Not found</title>",
      finalUrl: `${origin}/sitemap.xml`,
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
      `<url><loc>${origin}/auth</loc></url><url><loc>https://attacker.example/private</loc></url></urlset>`,
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
    expect(evaluateSeoSmoke(documents)).toContain("homepage: final response left the expected origin");
  });
});
