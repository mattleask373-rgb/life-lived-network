/**
 * The internal source panel, behind the server.
 *
 * Only a named admin or moderator may see which sources exist or ask one to
 * refresh. That is checked here, against the same roles the safety review
 * surface uses, before anything touches a source; the credential itself never
 * leaves the server and is never returned.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import type { IngestOutcome, SourceRow } from "./ingest/contract";

/** What a reviewer may see about a source. No credential, ever. */
export interface SourcePanelRow {
  id: string;
  name: string;
  kind: string;
  accessMethod: string;
  attribution: string;
  status: string;
  enabled: boolean;
  storeImages: boolean;
  refreshMinutes: number;
  lastRunAt: string | null;
  lastOutcome: string;
  consecutiveFailures: number;
  /** Whether a credential is present. Never the credential. */
  credentialPresent: boolean;
}

async function assertReviewer(context: {
  supabase: { from: (t: string) => any };
  userId: string;
}): Promise<void> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .in("role", ["admin", "moderator"]);
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("This is not open to you.");
}

export const listSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SourcePanelRow[]> => {
    await assertReviewer(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("sources")
      .select("*")
      .order("name", { ascending: true })
      .limit(50);
    if (error) throw error;
    const credentialPresent = Boolean(process.env["TICKETMASTER_API_KEY"]);
    return ((data ?? []) as unknown as SourceRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind,
      accessMethod: row.access_method,
      attribution: row.attribution,
      status: row.status,
      enabled: row.enabled,
      storeImages: row.store_images,
      refreshMinutes: row.refresh_minutes,
      lastRunAt: row.last_run_at,
      lastOutcome: row.last_outcome,
      consecutiveFailures: row.consecutive_failures,
      credentialPresent,
    }));
  });

export interface RefreshInput {
  sourceId: string;
  /** Locality slug, from the existing chooser. Geography stays the hierarchy's. */
  placeSlug: string;
  days?: number;
  force?: boolean;
}

/**
 * Ask a source for a locality's next few days. Bounded, reviewer-only, and
 * harmless when it fails: existing activity is left exactly as it was.
 */
export const refreshSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: RefreshInput) => input)
  .handler(async ({ data, context }): Promise<IngestOutcome> => {
    await assertReviewer(context as never);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: place, error } = await supabaseAdmin
      .from("places")
      .select("id, slug, country_code, lat, lng, kind")
      .eq("slug", data.placeSlug)
      .maybeSingle();
    if (error) throw error;
    if (!place) throw new Error("That locality does not exist.");

    const days = Math.min(Math.max(data.days ?? 14, 1), 60);
    const startsAfter = new Date().toISOString();
    const endsBefore = new Date(Date.now() + days * 86400000).toISOString();

    const { refreshSourceRun } = await import("./ingest/refresh.server");
    return refreshSourceRun({
      sourceId: data.sourceId,
      placeId: place.id,
      countryCode: place.country_code || "GB",
      lat: place.lat === null ? null : Number(place.lat),
      lng: place.lng === null ? null : Number(place.lng),
      // A city centre covers more ground than a village; both stay approximate.
      radiusKm: place.kind === "neighbourhood" ? 5 : place.kind === "city" ? 20 : 30,
      startsAfter,
      endsBefore,
      ...(data.force ? { force: true } : {}),
    });
  });
