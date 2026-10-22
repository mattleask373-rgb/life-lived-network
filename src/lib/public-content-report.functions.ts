import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validatePublicContentReport } from "./public-content-report";

/**
 * File a private, reviewable report about a public listing, open public need,
 * or discoverable profile. The owner is read from the canonical subject record;
 * caller-provided reported_user_id is never accepted.
 */
export const reportPublicContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { subjectType: string; subjectId: string; reason: string; note?: string }) =>
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
      const { data: need, error } = await context.supabase
        .from("needs")
        .select("id, creator_id")
        .eq("id", data.subjectId)
        .eq("status", "open")
        .in("visibility", ["public", "local_discovery"])
        .maybeSingle();
      if (error) throw error;
      if (!need) throw new Error("That public need is no longer available.");
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

    const { error: reportError } = await context.supabase.from("content_reports").upsert(
      {
        reporter_id: context.userId,
        reported_user_id: reportedUserId,
        subject_type: data.subjectType,
        subject_id: data.subjectId,
        reason: data.reason,
        note: data.note,
      },
      { onConflict: "reporter_id,subject_type,subject_id", ignoreDuplicates: true },
    );
    if (reportError) throw reportError;
    return { reported: true };
  });
