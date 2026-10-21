import { createFileRoute } from "@tanstack/react-router";

import { getGatedPlaceSitemapPaths } from "@/lib/gated-place-sitemap.server";
import { sitemapShardCount } from "@/lib/sitemap-shards";
import { sitemapIndexXml, XML_HEADERS } from "@/lib/seo";

/**
 * Index for fixed public screens plus data-backed locality/service sitemap shards.
 * Dynamic children are calculated through the same fail-closed gates as page metadata.
 */
export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const candidates = await getGatedPlaceSitemapPaths();
        const paths = ["/api/public/sitemap-pages.xml"];
        for (let shard = 1; shard <= sitemapShardCount(candidates.localityPaths); shard += 1) {
          paths.push("/api/public/sitemap-localities/" + shard + ".xml");
        }
        for (let shard = 1; shard <= sitemapShardCount(candidates.servicePaths); shard += 1) {
          paths.push("/api/public/sitemap-services/" + shard + ".xml");
        }
        return new Response(sitemapIndexXml(paths), { headers: XML_HEADERS });
      },
    },
  },
});
