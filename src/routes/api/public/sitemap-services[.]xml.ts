import { createFileRoute } from "@tanstack/react-router";

/** Backward-compatible alias; the canonical sitemap index lists numbered shards. */
export const Route = createFileRoute("/api/public/sitemap-services.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(null, {
          status: 308,
          headers: {
            Location: "/api/public/sitemap-services/1.xml",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
