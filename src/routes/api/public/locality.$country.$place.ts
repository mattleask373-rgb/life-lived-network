import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { fetchWorldEntries } from "@/lib/listings";
import { getLocality } from "@/lib/locality.functions";
import { localityPath, toPublicLocalityPayload } from "@/lib/public-locality-api";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
};

export const Route = createFileRoute("/api/public/locality/$country/$place")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const geography = await getLocality({ data: { slug: params.place } });
        if (!geography) throw notFound();

        const canonical = localityPath(geography.place);
        if (canonical !== `/${params.country}/${params.place}`) {
          throw redirect({ to: canonical });
        }

        const entries = await fetchWorldEntries({
          placeId: geography.place.id,
          limit: 60,
        });

        return new Response(JSON.stringify(toPublicLocalityPayload(geography, entries)), {
          headers: JSON_HEADERS,
        });
      },
    },
  },
});
