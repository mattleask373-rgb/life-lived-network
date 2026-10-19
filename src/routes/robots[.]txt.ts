import { createFileRoute } from "@tanstack/react-router";

import { robotsTxt } from "@/lib/seo";

/**
 * Dynamic robots.txt. Prefer this over platform defaults when static public/
 * files are overridden or not yet published. Content is generated from
 * PRIVATE_PATHS so it cannot drift from the indexability rules.
 */
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(robotsTxt(), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
