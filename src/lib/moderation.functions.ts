/**
 * The safety review surface, behind the server.
 *
 * Authorisation is enforced twice: the access rules in the database only let
 * a named admin or moderator read reports or record a review, and these
 * handlers refuse anyone else before they reach the data. Nothing here is
 * reachable without signing in.
 *
 * Only what a reviewer needs is loaded: the report, who filed it, who it is
 * about, and the small snapshot the report was filed against. No journeys,
 * no coordinates, no availability, no unrelated profile details.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  isValidResolution,
  rowToReport,
  type Report,
  type ReportRow,
} from "./moderation";

const MAX_LIST = 100;
const MAX_NOTE = 1000;

export interface ReviewerReport extends Report {
  reporterName: string;
  reportedName: string;
  reviewerName: string | null;
  /** The plain snapshot the report was filed against, where one exists. */
  contextTitle: string;
  contextPlace: string;
}

async function requireReviewer(context: { supabase: any; userId: string }): Promise<void> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .in("role", ["admin", "moderator"]);
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("This is not open to you.");
}

/** Are you allowed to review reports? Used only to decide what to render. */
export const amISafetyReviewer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ reviewer: boolean }> => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["admin", "moderator"]);
    if (error) throw error;
    return { reviewer: Boolean(data && data.length) };
  });

/** Every report, unreviewed first. Reviewers only. */
export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReviewerReport[]> => {
    await requireReviewer(context);

    const { data: rows, error } = await context.supabase
      .from("content_reports")
      .select("*")
      .order("status", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(MAX_LIST);
    if (error) throw error;

    const reports = (rows ?? []).map((r) => rowToReport(r as unknown as ReportRow));
    if (!reports.length) return [];

    const people = [
      ...new Set(
        reports
          .flatMap((r) => [r.reporterId, r.reportedUserId, r.reviewedBy])
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const requestIds = [
      ...new Set(
        reports.filter((r) => r.subjectType === "connection_request").map((r) => r.subjectId),
      ),
    ];

    const [{ data: profiles }, { data: requests }] = await Promise.all([
      context.supabase.from("profiles").select("id, display_name").in("id", people),
      requestIds.length
        ? context.supabase
            .from("connection_requests")
            .select("id, context_title, context_place")
            .in("id", requestIds)
        : Promise.resolve({ data: [] as { id: string }[] }),
    ]);

    const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name as string]));
    const contexts = new Map(
      (requests ?? []).map((r: Record<string, unknown>) => [
        r['id'] as string,
        {
          title: (r['context_title'] as string) ?? "",
          place: (r['context_place'] as string) ?? "",
        },
      ]),
    );

    return reports.map((report) => {
      const snapshot = contexts.get(report.subjectId);
      return {
        ...report,
        reporterName: names.get(report.reporterId) || "Someone",
        reportedName: report.reportedUserId
          ? names.get(report.reportedUserId) || "Someone"
          : "Not about a person",
        reviewerName: report.reviewedBy ? names.get(report.reviewedBy) || "A reviewer" : null,
        contextTitle: snapshot?.title ?? "",
        contextPlace: snapshot?.place ?? "",
      };
    });
  });

/**
 * Write down what a reviewer decided. Marking something reviewed is a
 * separate act from the report being filed, and is always attributed.
 */
export const recordReportReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { id: string; resolution: string; reviewNote?: string; reviewed?: boolean }) => input,
  )
  .handler(async ({ data, context }): Promise<Report> => {
    await requireReviewer(context);

    const reviewed = data.reviewed !== false;
    if (reviewed && !isValidResolution(data.resolution)) {
      throw new Error("Choose what you decided before saving.");
    }

    const { data: row, error } = await context.supabase
      .from("content_reports")
      .update({
        status: reviewed ? "reviewed" : "open",
        resolution: reviewed ? data.resolution : "",
        review_note: (data.reviewNote ?? "").trim().slice(0, MAX_NOTE),
        reviewed_at: reviewed ? new Date().toISOString() : null,
        reviewed_by: reviewed ? context.userId : null,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw error;
    return rowToReport(row as unknown as ReportRow);
  });
