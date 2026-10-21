import { createFileRoute } from "@tanstack/react-router";

import { fetchPublicServiceSitemapPaths } from "@/lib/locality-sitemap.server";
import { sitemapXml, XML_HEADERS } from "@/lib/seo";

/**
 * Only service-in-place URLs whose rendered first page passes the canonical
 * service listing and indexability gates. No empty or demonstration-only pages.
 */
export const Route = createFileRoute("/api/public/sitemap-services.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const paths = await fetchPublicServiceSitemapPaths();
          return new Response(
            sitemapXml(paths.map((path) => ({ path, changeFrequency: "weekly" as const }))),
            { headers: XML_HEADERS },
          );
        } catch {
          return new Response("Service sitemap temporarily unavailable", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
          });
        }
      },
    },
  },
});
