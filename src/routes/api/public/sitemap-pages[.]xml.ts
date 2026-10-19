import { createFileRoute } from "@tanstack/react-router";

import { getGatedPlaceSitemapPaths } from "@/lib/gated-place-sitemap.server";
import { PUBLIC_PATHS, sitemapXml, XML_HEADERS } from "@/lib/seo";

/**
 * Existing public screens plus locality/service URLs returned by the shared
 * indexability gates. If dynamic data cannot be verified, no place URLs are added.
 */
export const Route = createFileRoute("/api/public/sitemap-pages.xml")({
  server: {
    handlers: {
      GET: async () => {
        const dynamicPaths = await getGatedPlaceSitemapPaths();
        const urls = [
          ...PUBLIC_PATHS.map((path) => ({ path, changeFrequency: "weekly" as const })),
          ...dynamicPaths.map((path) => ({ path, changeFrequency: "weekly" as const })),
        ];
        return new Response(sitemapXml(urls), { headers: XML_HEADERS });
      },
    },
  },
});
