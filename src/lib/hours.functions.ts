/**
 * Open hours, behind the server boundary.
 *
 * Public reading happens on the server with a bounded page; offering, asking and
 * closing stay on the client where RLS already makes ownership the boundary.
 */

import { createServerFn } from "@tanstack/react-start";

import {
  decodeCursor,
  pageLimit,
  splitPageWithLookahead,
  toPage,
  type DiscoveryContext,
  type Page,
} from "./data/contract";
import { asDataError } from "./data/errors";
import { requireQueryRows } from "./data/query-rows";
import type { HourOffer } from "./hours";

export const getOpenHours = createServerFn({ method: "GET" })
  .inputValidator((input: DiscoveryContext | undefined) => input ?? {})
  .handler(async ({ data }): Promise<Page<HourOffer>> => {
    const { observe } = await import("./data/observe.server");
    return observe(
      "hours.page",
      () => readHours(data),
      (page) => page.items.length,
    );
  });

async function readHours(context: DiscoveryContext): Promise<Page<HourOffer>> {
  const limit = pageLimit(context.limit);
  const offset = decodeCursor(context.cursor);

  try {
    const { publicServerClient } = await import("./supabase-public.server");
    const supabase = publicServerClient();

    let query = supabase
      .from("hour_offers")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      // One sentinel row makes hasMore truthful even when the final page is full.
      .range(offset, offset + limit);
    if (context.placeId) query = query.eq("place_id", context.placeId);

    const { data: rows, error } = await query;
    const completeRows = requireQueryRows(rows, error, "Open hours");
    const boundedRows = splitPageWithLookahead(completeRows, limit);
    const offers = boundedRows.items as unknown as HourOffer[];
    const names = new Map<string, string>();
    const ids = [...new Set(offers.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids)
        .eq("discoverable", true);
      const profiles = requireQueryRows(profileRows, profileError, "Open-hours profile");
      for (const p of profiles) {
        if (p.display_name) names.set(p.id, p.display_name);
      }
    }

    return toPage(
      offers.map((r) => {
        const person = names.get(r.user_id);
        return person ? { ...r, person } : r;
      }),
      offset,
      boundedRows.hasMore,
    );
  } catch (error) {
    throw asDataError(error);
  }
}
