import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validatePublicContentReport } from "./public-content-report";
import { needFreshnessCutoff } from "./needs";

/**
 * File a private, reviewable report about a public listing, open public need,
 * or discoverable profile. The owner is read from the canonical subject record;
 * caller-provided reported_user_id is never accepted.
 */
export const reportPublicContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { subjectType: string; subjectId: string; reason: string; note?: string; placeId?: string | null }) =>
      validatePublicContentReport(input),
  )
  .handler(async ({ data, context }): Promise<{ reported: true }> => {
    let reportedUserId: string | null = null;

    if (data.subjectType === "listing") {
      const { data: listing, error } = await context.supabase
        .from("listings")
        .select("id, creator_id")
        .eq("id", data.subjectId)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!listing) throw new Error("That public listing is no longer available.");
      reportedUserId = listing.creator_id;
    } else if (data.subjectType === "need") {
      const { publicServerClient } = await import("./supabase-public.server");
      const publicSupabase = publicServerClient();
      const now = new Date();
      const nowIso = now.toISOString();
      let readClient = publicSupabase;
      let inside: string[] | null = null;
      if (data.placeId) {
        const { loadPlaceIndex } = await import("./place-index.server");
        const { descendantIdsOf } = await import("./places");
        const index = await loadPlaceIndex(publicSupabase);
        if (!index.byId.has(data.placeId)) throw new Error("That locality isn't available.");
        inside = descendantIdsOf(index, data.placeId);
        if (inside.length > 400) throw new Error("Choose a smaller locality.");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        readClient = supabaseAdmin;
      }
      const { data: need, error } = await readClient
        .from("needs")
        .select("id, creator_id, visibility, place_id")
        .eq("id", data.subjectId)
        .eq("status", "open")
        .in("visibility", inside ? ["public", "local_discovery"] : ["public"])
        .gt("last_confirmed_at", needFreshnessCutoff(now))
        .or(
          `and(or(expires_at.is.null,expires_at.gt.${nowIso}),or(ends_at.is.null,ends_at.gt.${nowIso}))`,
        )
        .maybeSingle();
      if (error) throw error;
      if (
        !need ||
        (need.visibility === "local_discovery" &&
          (!inside || !need.place_id || !inside.includes(need.place_id)))
      ) {
        throw new Error("That public need is no longer available in this locality.");
      }
      reportedUserId = need.creator_id;
    } else {
      const { data: profile, error } = await context.supabase
        .from("profiles")
        .select("id")
        .eq("id", data.subjectId)
        .eq("discoverable", true)
        .maybeSingle();
      if (error) throw error;
      if (!profile) throw new Error("That public profile is no longer available.");
      reportedUserId = profile.id;
    }

    if (reportedUserId === context.userId) {
      throw new Error("You can't report your own content.");
    }

    const { error: reportError } = await context.supabase.from("content_reports").insert({
      reporter_id: context.userId,
      reported_user_id: reportedUserId,
      subject_type: data.subjectType,
      subject_id: data.subjectId,
      reason: data.reason,
      note: data.note,
    });

    // A duplicate report is an idempotent outcome. Do not expose
    // the existing report or its status to the caller.
    if (reportError?.code === "23505") {
      return { reported: true };
    }

    if (reportError) throw reportError;
    return { reported: true };
  });
