import type { ReportReason, ReportSubject } from "./safety";

const REPORT_REASONS: readonly ReportReason[] = [
  "safety",
  "harassment",
  "spam",
  "misleading",
  "other",
];

export type PublicReportSubject = Extract<ReportSubject, "profile" | "listing" | "need">;

export interface PublicContentReportInput {
  subjectType: PublicReportSubject;
  subjectId: string;
  reason: ReportReason;
  note: string;
  placeId: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Reject malformed subjects and client-supplied target identities. */
export function validatePublicContentReport(input: {
  subjectType: string;
  subjectId: string;
  reason: string;
  note?: string;
  placeId?: string | null;
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
  if (
    input.placeId !== undefined &&
    input.placeId !== null &&
    (typeof input.placeId !== "string" || !UUID.test(input.placeId))
  ) {
    throw new Error("That locality isn't valid for reporting.");
  }
  if (input.note !== undefined && typeof input.note !== "string") {
    throw new Error("That report note isn't valid.");
  }

  return {
    subjectType: input.subjectType as PublicReportSubject,
    subjectId: input.subjectId,
    reason: input.reason as ReportReason,
    note: (input.note ?? "").trim().slice(0, 1000),
    placeId: input.placeId ?? null,
  };
}
