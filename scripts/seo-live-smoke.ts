import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const DEFAULT_SEO_SMOKE_ORIGIN = "https://life-lived-network.lovable.app";

const PUBLIC_PATHS = ["/", "/journey", "/road-trip", "/life-list", "/give", "/make"];
const PRIVATE_PATHS = [
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

export interface SmokeDocument {
  status: number;
  contentType: string | null;
  body: string;
  finalUrl: string;
  networkError?: string;
}

export interface SeoSmokeDocuments {
  robots: SmokeDocument;
  sitemap: SmokeDocument;
  homepage: SmokeDocument;
}

function escapedRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Checks the public origin at the HTTP boundary, not just source-code intent. */
export function evaluateSeoSmoke(
  documents: SeoSmokeDocuments,
  expectedOrigin = DEFAULT_SEO_SMOKE_ORIGIN,
): string[] {
  const failures: string[] = [];
  const origin = new URL(expectedOrigin).origin;

  for (const [label, document] of Object.entries(documents)) {
    if (document.networkError) {
      failures.push(`${label}: request failed (${document.networkError})`);
    }
    if (document.status !== 200) {
      failures.push(`${label}: expected HTTP 200, received ${document.status}`);
    }
    try {
      if (new URL(document.finalUrl).origin !== origin) {
        failures.push(`${label}: final response left the expected origin`);
      }
    } catch {
      failures.push(`${label}: response did not provide a valid final URL`);
    }
  }

  if (!/text\/plain/i.test(documents.robots.contentType ?? "")) {
    failures.push("robots.txt: expected a text/plain content type");
  }
  const sitemapDirective = new RegExp(
    `^Sitemap:\s*${escapedRegExp(origin)}\\/sitemap\\.xml\\s*$`,
    "im",
  );
  if (!sitemapDirective.test(documents.robots.body)) {
    failures.push("robots.txt: missing the canonical Sitemap directive");
  }
  for (const path of PRIVATE_PATHS) {
    const rule = new RegExp(`^Disallow:\\s*${escapedRegExp(path)}\\s*$`, "im");
    if (!rule.test(documents.robots.body)) {
      failures.push(`robots.txt: missing private-route crawler rule for ${path}`);
    }
  }

  if (!/\b(?:application|text)\/xml\b/i.test(documents.sitemap.contentType ?? "")) {
    failures.push("sitemap.xml: expected an XML content type");
  }
  if (!/<urlset\b/i.test(documents.sitemap.body)) {
    failures.push("sitemap.xml: response is not a urlset XML document");
  }
  const locations = Array.from(
    documents.sitemap.body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi),
    (match) => (match[1] ?? "").replace(/&amp;/g, "&").trim(),
  );
  if (locations.length < PUBLIC_PATHS.length) {
    failures.push(
      `sitemap.xml: expected at least ${PUBLIC_PATHS.length} canonical public URLs, found ${locations.length}`,
    );
  }
  const parsedLocations: URL[] = [];
  for (const location of locations) {
    try {
      const url = new URL(location);
      parsedLocations.push(url);
      if (url.origin !== origin || url.protocol !== "https:") {
        failures.push(`sitemap.xml: URL is outside the canonical HTTPS origin: ${location}`);
      }
      if (PRIVATE_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) {
        failures.push(`sitemap.xml: private route must not be listed: ${url.pathname}`);
      }
    } catch {
      failures.push(`sitemap.xml: invalid absolute URL in loc: ${location}`);
    }
  }
  for (const path of PUBLIC_PATHS) {
    if (!parsedLocations.some((url) => url.pathname === path)) {
      failures.push(`sitemap.xml: missing required public path ${path}`);
    }
  }

  if (!/text\/html/i.test(documents.homepage.contentType ?? "")) {
    failures.push("homepage: expected an HTML content type");
  }
  const canonicalTag = documents.homepage.body.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0];
  const canonicalHref = canonicalTag?.match(/\bhref=["']([^"']+)["']/i)?.[1];
  if (canonicalHref !== `${origin}/`) {
    failures.push("homepage: missing or incorrect canonical link");
  }
  const robotsTag = documents.homepage.body.match(
    /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i,
  )?.[0];
  const robotsContent = robotsTag?.match(/\bcontent=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
  if (!robotsContent.includes("index") || robotsContent.includes("noindex")) {
    failures.push("homepage: robots metadata must permit indexing");
  }
  if (!/<title>\s*[^<]+<\/title>/i.test(documents.homepage.body)) {
    failures.push("homepage: missing a non-empty title element");
  }
  if (!/<meta\\b(?=[^>]*\\bname=["']description["'])(?=[^>]*\bcontent=["'][^"']+["'])[^>]*>/i.test(documents.homepage.body)) {
    failures.push("homepage: missing a non-empty meta description");
  }

  return failures;
}

async function fetchDocument(path: string, origin: string): Promise<SmokeDocument> {
  const url = new URL(path, origin).toString();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "RealWorldAtlas-SeoSmoke/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: await response.text(),
      finalUrl: response.url,
    };
  } catch (error) {
    return {
      status: 0,
      contentType: null,
      body: "",
      finalUrl: url,
      networkError: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runSeoSmoke(): Promise<number> {
  const configuredOrigin = process.env.SEO_SMOKE_ORIGIN?.trim() || DEFAULT_SEO_SMOKE_ORIGIN;
  const parsedOrigin = new URL(configuredOrigin);
  if (parsedOrigin.protocol !== "https:" || parsedOrigin.username || parsedOrigin.password) {
    throw new Error("SEO_SMOKE_ORIGIN must be an HTTPS origin without embedded credentials");
  }
  const origin = parsedOrigin.origin;
  const [robots, sitemap, homepage] = await Promise.all([
    fetchDocument("/robots.txt", origin),
    fetchDocument("/sitemap.xml", origin),
    fetchDocument("/", origin),
  ]);
  const documents = { robots, sitemap, homepage };
  const failures = evaluateSeoSmoke(documents, origin);

  console.log(`Public SEO smoke check — ${new Date().toISOString()}`);
  console.log(`Origin: ${origin}`);
  for (const [label, document] of Object.entries(documents)) {
    console.log(`- ${label}: HTTP ${document.status}; content-type ${document.contentType ?? "(none)"}`);
  }
  if (failures.length) {
    console.error(`FAILED: ${failures.length} check(s)`);
    for (const failure of failures) console.error(`  - ${failure}`);
    return 1;
  }
  console.log("PASSED: robots, sitemap, canonical URL, and public indexing metadata");
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runSeoSmoke()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
