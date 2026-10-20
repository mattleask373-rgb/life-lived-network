import { createFileRoute } from "@tanstack/react-router";

import { getGatedPlaceSitemapPaths } from "@/lib/gated-place-sitemap.server";
import { PUBLIC_PATHS, sitemapXml, XML_HEADERS } from "@/lib/seo";

/**
 * Server sitemap: fixed public screens plus candidates that passed the same
 * pure indexability gate used by locality and service-locality metadata.
 * public/sitemap.xml remains a static minimal fallback for static deployments.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const dynamicPaths = await getGatedPlaceSitemapPaths();
        const urls = [
          ...PUBLIC_PATHS.map((path) => ({ path })),
          ...dynamicPaths.map((path) => ({ path, changeFrequency: "weekly" as const })),
        ];
        return new Response(sitemapXml(urls), { headers: XML_HEADERS });
      },
    },
  },
});
