import { createFileRoute } from "@tanstack/react-router";

import { fetchPublicServiceSitemapPaths } from "@/lib/locality-sitemap.server";
import { sitemapShard, sitemapShardCount, MAX_SERVICE_SITEMAP_SHARDS } from "@/lib/sitemap-shards";
import { sitemapXml, XML_HEADERS } from "@/lib/seo";

/**
 * Fixed, bounded service-sitemap shard. All eight routes are named by both
 * static and server-generated sitemap indexes. Empty shards remain valid XML;
 * a source result that exceeds configured capacity fails closed.
 */
export const Route = createFileRoute("/api/public/sitemap-services/$shard.xml")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[1-8]$/.test(params.shard)) {
          return new Response("Not found", { status: 404 });
        }

        try {
          const paths = await fetchPublicServiceSitemapPaths();
          if (sitemapShardCount(paths) > MAX_SERVICE_SITEMAP_SHARDS) {
            return new Response(
              "Service sitemap capacity exceeded; increase fixed shard capacity",
              {
                status: 503,
                headers: {
                  "Content-Type": "text/plain; charset=utf-8",
                  "Cache-Control": "no-store",
                },
              },
            );
          }

          const shardPaths = sitemapShard(paths, Number(params.shard));
          if (!shardPaths) {
            return new Response("Invalid service sitemap shard", {
              status: 404,
              headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
            });
          }

          return new Response(
            sitemapXml(shardPaths.map((path) => ({ path, changeFrequency: "weekly" as const }))),
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
