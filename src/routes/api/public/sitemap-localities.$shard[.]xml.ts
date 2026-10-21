import { createFileRoute } from "@tanstack/react-router";

import { getGatedPlaceSitemapPaths } from "@/lib/gated-place-sitemap.server";
import { SITEMAP_URLS_PER_SHARD, sitemapShard } from "@/lib/sitemap-shards";
import { sitemapXml, XML_HEADERS } from "@/lib/seo";

/** A numbered shard contains at most 40,000 canonical, indexable locality URLs. */
export const Route = createFileRoute("/api/public/sitemap-localities/$shard.xml")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[1-9][0-9]*$/.test(params.shard)) {
          return new Response("Not found", { status: 404 });
        }
        const shardNumber = Number(params.shard);
        if (!Number.isSafeInteger(shardNumber)) {
          return new Response("Not found", { status: 404 });
        }
        const paths = await getGatedPlaceSitemapPaths();
        const urls = sitemapShard(paths.localityPaths, shardNumber).map((path) => ({ path }));
        return new Response(sitemapXml(urls), { headers: XML_HEADERS });
      },
    },
  },
});
