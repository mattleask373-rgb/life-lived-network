import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ReportReason, ReportSubject } from "./safety";

const REPORT_REASONS: readonly ReportReason[] = [
  "safety",
  "harassment",
  "spam",
  "misleading",
  "other",
];

type PublicReportSubject = Extract<ReportSubject, "profile" | "listing" | "need">;

export interface PublicContentReportInput {
  subjectType: PublicReportSubject;
  subjectId: string;
  reason: ReportReason;
  note: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Reject malformed subject identifiers and arbitrary client-supplied report targets. */
function validatePublicContentReport(input: {
  subjectType: string;
  subjectId: string;
  reason: string;
  note?: string;
}): PublicContentReportInput {
  if (!["profile", "listing", "need"].includes(input.subjectType)) {
    throw new Error("Choose something public to report.");
  }
  if (typeof input.subjectId !== "string" || !UUID.test(input.subjectId)) {
    throw new Error("That item isn't available for reporting.");
  }
  if (!REPORT_REASONS.includes(input.reason as ReportReason)) {
    throw new Error("Choose a reason for the report.");
  }
  if (input.note !== undefined && typeof input.note !== "string") {
    throw new Error("That report note isn't valid.");
  }

  return {
    subjectType: input.subjectType as PublicReportSubject,
    subjectId: input.subjectId,
    reason: input.reason as ReportReason,
    note: (input.note ?? "").trim().slice(0, 1000),
  };
}

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

/** Exported pure seam for regression tests; the server handler uses the same validator. */
export { validatePublicContentReport };
