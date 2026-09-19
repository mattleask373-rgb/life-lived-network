/**
 * Safety review, kept deliberately small.
 *
 * A report is someone saying "please look at this". It is not a verdict.
 * Nothing about a person changes because a report exists; something only
 * changes when a reviewer has actually looked and written down what they
 * decided. The two states are kept apart on purpose.
 */

export type ReportStatus = "open" | "reviewed";

export type ReportResolution =
  "" | "no_action" | "guidance_given" | "content_removed" | "account_restricted";

export const RESOLUTIONS: { id: Exclude<ReportResolution, "">; label: string }[] = [
  { id: "no_action", label: "Nothing needed" },
  { id: "guidance_given", label: "Spoke to the person" },
  { id: "content_removed", label: "Removed what was reported" },
  { id: "account_restricted", label: "Restricted the account" },
];

export const REASON_LABEL: Record<string, string> = {
  safety: "Feels unsafe",
  harassment: "Harassment",
  spam: "Spam",
  misleading: "Misleading information",
  other: "Something else",
};

export const SUBJECT_LABEL: Record<string, string> = {
  profile: "A person's profile",
  connection_request: "A connection",
  connection_message: "A message",
};

export interface ReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  subject_type: string;
  subject_id: string;
  reason: string;
  note: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  resolution: string;
  review_note: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  subjectType: string;
  subjectId: string;
  reason: string;
  note: string;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  resolution: ReportResolution;
  reviewNote: string;
}

export function rowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reportedUserId: row.reported_user_id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    reason: row.reason,
    note: row.note ?? "",
    status: row.status === "reviewed" ? "reviewed" : "open",
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    resolution: (row.resolution ?? "") as ReportResolution,
    reviewNote: row.review_note ?? "",
  };
}

/** Filing a report is never, on its own, a decision about anybody. */
export function isModerationDecision(report: Report): boolean {
  return report.status === "reviewed" && report.resolution !== "" && report.reviewedAt !== null;
}

/** Only a recorded decision can restrict someone; a pending report cannot. */
export function restrictsPerson(report: Report): boolean {
  return isModerationDecision(report) && report.resolution === "account_restricted";
}

export function isValidResolution(value: string): value is Exclude<ReportResolution, ""> {
  return RESOLUTIONS.some((r) => r.id === value);
}
