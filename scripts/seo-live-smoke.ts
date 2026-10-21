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
const SITEMAP_CHILD_PATHS = [
  "/api/public/sitemap-pages.xml",
  "/api/public/sitemap-localities.xml",
  "/api/public/sitemap-services.xml",
] as const;

export interface SmokeDocument {
  status: number;
  contentType: string | null;
  body: string;
  finalUrl: string;
  networkError?: string;
}

export interface SitemapChildSmokeDocument {
  path: string;
  document: SmokeDocument;
}

export interface SeoSmokeDocuments {
  robots: SmokeDocument;
  sitemap: SmokeDocument;
  homepage: SmokeDocument;
  /** Required when /sitemap.xml is a sitemap index. */
  sitemapChildren?: SitemapChildSmokeDocument[];
}

function escapedRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}

function extractLocations(xml: string): string[] {
  return Array.from(
    xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi),
    (match) => (match[1] ?? "").replace(/&amp;/g, "&").trim(),
  );
}

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );
}

/** Every URL must be canonical, same-origin HTTPS, non-private and unique. */
function validateSitemapLocations(
  label: string,
  locations: string[],
  origin: string,
  failures: string[],
): URL[] {
  const parsed: URL[] = [];
  const seen = new Set<string>();

  for (const location of locations) {
    try {
      const url = new URL(location);
      parsed.push(url);

      if (url.origin !== origin || url.protocol !== "https:") {
        failures.push(label + ": URL is outside the canonical HTTPS origin: " + location);
      }
      if (isPrivatePath(url.pathname)) {
        failures.push(label + ": private route must not be listed: " + url.pathname);
      }
      if (url.search || url.hash) {
        failures.push(label + ": canonical sitemap URL must not contain query or fragment: " + location);
      }

      const canonical = url.origin + url.pathname;
      if (seen.has(canonical)) {
        failures.push(label + ": duplicate canonical URL: " + canonical);
      }
      seen.add(canonical);
    } catch {
      failures.push(label + ": invalid absolute URL in loc: " + location);
    }
  }

  return parsed;
}

function validateUrlset(
  label: string,
  body: string,
  origin: string,
  failures: string[],
  requiredPaths: string[] = [],
  exactRequiredPaths = false,
): void {
  if (!/<urlset\b/i.test(body)) {
    failures.push(label + ": expected a urlset XML document");
    return;
  }

  const locations = extractLocations(body);
  const parsed = validateSitemapLocations(label, locations, origin, failures);
  for (const path of requiredPaths) {
    if (!parsed.some((url) => url.pathname === path)) {
      failures.push(label + ": missing required public path " + path);
    }
  }

  if (exactRequiredPaths) {
    const actual = parsed.map((url) => url.pathname).sort();
    const expected = [...requiredPaths].sort();
    if (actual.length !== expected.length || actual.some((path, index) => path !== expected[index])) {
      failures.push(label + ": fixed-pages sitemap must contain exactly the configured public paths");
    }
  }
}

/** Checks the published site, supporting both a legacy URL set and an index. */
export function evaluateSeoSmoke(
  documents: SeoSmokeDocuments,
  expectedOrigin = DEFAULT_SEO_SMOKE_ORIGIN,
): string[] {
  const failures: string[] = [];
  const origin = new URL(expectedOrigin).origin;

  for (const [label, document] of Object.entries({
    "robots.txt": documents.robots,
    "sitemap.xml": documents.sitemap,
    homepage: documents.homepage,
  })) {
    if (document.networkError) failures.push(label + ": request failed (" + document.networkError + ")");
    if (document.status !== 200) {
      failures.push(label + ": expected HTTP 200, received " + document.status);
    }
    try {
      if (new URL(document.finalUrl).origin !== origin) {
        failures.push(label + ": final response left the expected origin");
      }
    } catch {
      failures.push(label + ": response did not provide a valid final URL");
    }
  }

  if (!/text\/plain/i.test(documents.robots.contentType ?? "")) {
    failures.push("robots.txt: expected a text/plain content type");
  }
  const sitemapDirective = new RegExp(
    "^Sitemap:\\s*" + escapedRegExp(origin) + "\\/sitemap\\.xml\\s*$",
    "im",
  );
  if (!sitemapDirective.test(documents.robots.body)) {
    failures.push("robots.txt: missing the canonical Sitemap directive");
  }
  for (const path of PRIVATE_PATHS) {
    const rule = new RegExp("^Disallow:\\s*" + escapedRegExp(path) + "\\s*$", "im");
    if (!rule.test(documents.robots.body)) {
      failures.push("robots.txt: missing private-route crawler rule for " + path);
    }
  }

  if (!/\b(?:application|text)\/xml\b/i.test(documents.sitemap.contentType ?? "")) {
    failures.push("sitemap.xml: expected an XML content type");
  }

  if (/<urlset\b/i.test(documents.sitemap.body)) {
    // Backward-compatible contract for a direct URL set.
    validateUrlset("sitemap.xml", documents.sitemap.body, origin, failures, PUBLIC_PATHS, true);
  } else if (/<sitemapindex\b/i.test(documents.sitemap.body)) {
    const locations = extractLocations(documents.sitemap.body);
    const parsedIndex = validateSitemapLocations("sitemap.xml index", locations, origin, failures);
    const indexedPaths = parsedIndex.map((url) => url.pathname);

    for (const path of SITEMAP_CHILD_PATHS) {
      if (!indexedPaths.includes(path)) {
        failures.push("sitemap.xml: missing child sitemap " + path);
      }
    }
    for (const path of indexedPaths) {
      if (!(SITEMAP_CHILD_PATHS as readonly string[]).includes(path)) {
        failures.push("sitemap.xml: unmonitored child sitemap " + path + "; add an explicit smoke contract");
      }
    }

    const children = documents.sitemapChildren ?? [];
    for (const path of SITEMAP_CHILD_PATHS) {
      if (!indexedPaths.includes(path)) continue;
      const child = children.find((entry) => entry.path === path);
      if (!child) {
        failures.push("sitemap.xml: child sitemap response was not checked for " + path);
        continue;
      }

      const label = "sitemap child " + path;
      const document = child.document;
      if (document.networkError) failures.push(label + ": request failed (" + document.networkError + ")");
      if (document.status !== 200) {
        failures.push(label + ": expected HTTP 200, received " + document.status);
      }
      if (!/\b(?:application|text)\/xml\b/i.test(document.contentType ?? "")) {
        failures.push(label + ": expected an XML content type");
      }
      try {
        if (new URL(document.finalUrl).origin !== origin) {
          failures.push(label + ": final response left the expected origin");
        }
      } catch {
        failures.push(label + ": response did not provide a valid final URL");
      }

      validateUrlset(
        label,
        document.body,
        origin,
        failures,
        path === "/api/public/sitemap-pages.xml" ? PUBLIC_PATHS : [],
        path === "/api/public/sitemap-pages.xml",
      );
    }
  } else {
    failures.push("sitemap.xml: response is neither a urlset nor a sitemap index");
  }

  if (!/text\/html/i.test(documents.homepage.contentType ?? "")) {
    failures.push("homepage: expected an HTML content type");
  }
  const canonicalTag = documents.homepage.body.match(
    /<link\b[^>]*rel=["']canonical["'][^>]*>/i,
  )?.[0];
  const canonicalHref = canonicalTag?.match(/\bhref=["']([^"']+)["']/i)?.[1];
  if (canonicalHref !== origin + "/") {
    failures.push("homepage: missing or incorrect canonical link");
  }
  const robotsTag = documents.homepage.body.match(
    /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i,
  )?.[0];
  const robotsContent = robotsTag?.match(/\bcontent=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
  if (!robotsContent.includes("index") || robotsContent.includes("noindex")) {
    failures.push("homepage: robots metadata must permit indexing");
  }
  if (!/<title>\s*[^<]+\s*<\/title>/i.test(documents.homepage.body)) {
    failures.push("homepage: missing a non-empty title element");
  }
  if (
    !/<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["'][^"']+["'])[^>]*>/i.test(
      documents.homepage.body,
    )
  ) {
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

  const sitemapChildren: SitemapChildSmokeDocument[] = [];
  if (/<sitemapindex\b/i.test(sitemap.body)) {
    const locations = extractLocations(sitemap.body);
    const childPaths = new Set<string>();
    for (const location of locations) {
      try {
        const url = new URL(location);
        if (
          url.origin === origin &&
          !url.search &&
          !url.hash &&
          (SITEMAP_CHILD_PATHS as readonly string[]).includes(url.pathname)
        ) {
          childPaths.add(url.pathname);
        }
      } catch {
        // The validator below reports malformed URLs.
      }
    }

    for (const path of childPaths) {
      sitemapChildren.push({ path, document: await fetchDocument(path, origin) });
    }
  }

  const documents = { robots, sitemap, homepage, sitemapChildren };
  const failures = evaluateSeoSmoke(documents, origin);

  console.log("Public SEO smoke check — " + new Date().toISOString());
  console.log("Origin: " + origin);
  for (const [label, document] of Object.entries({ robots, sitemap, homepage })) {
    console.log(
      "- " + label + ": HTTP " + document.status + "; content-type " + (document.contentType ?? "(none)"),
    );
  }
  for (const child of sitemapChildren) {
    console.log(
      "- " + child.path + ": HTTP " + child.document.status + "; content-type " + (child.document.contentType ?? "(none)"),
    );
  }
  if (failures.length) {
    console.error("FAILED: " + failures.length + " check(s)");
    for (const failure of failures) console.error("  - " + failure);
    return 1;
  }
  console.log("PASSED: robots, sitemap(s), canonical URL, and public indexing metadata");
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
