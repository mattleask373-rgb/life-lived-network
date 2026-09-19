import { describe, expect, it } from "vitest";
import {
  isModerationDecision,
  isValidResolution,
  restrictsPerson,
  rowToReport,
  type ReportRow,
} from "./moderation";

function row(extra: Partial<ReportRow> = {}): ReportRow {
  return {
    id: "report-1",
    reporter_id: "sarah",
    reported_user_id: "david",
    subject_type: "connection_request",
    subject_id: "request-1",
    reason: "safety",
    note: "Asked me to meet somewhere odd.",
    status: "open",
    created_at: "2026-09-19T10:00:00.000Z",
    reviewed_at: null,
    reviewed_by: null,
    resolution: "",
    review_note: "",
    ...extra,
  };
}

describe("a report is not a verdict", () => {
  it("treats a fresh report as unreviewed and undecided", () => {
    const report = rowToReport(row());
    expect(report.status).toBe("open");
    expect(isModerationDecision(report)).toBe(false);
    expect(restrictsPerson(report)).toBe(false);
  });

  it("still holds nothing decided if it is marked reviewed with no resolution", () => {
    const report = rowToReport(
      row({ status: "reviewing", reviewed_at: "2026-09-19T12:00:00.000Z", resolution: "" }),
    );
    expect(isModerationDecision(report)).toBe(false);
    expect(restrictsPerson(report)).toBe(false);
  });

  it("counts a decision only once someone has looked and written it down", () => {
    const report = rowToReport(
      row({
        status: "dismissed",
        reviewed_at: "2026-09-19T12:00:00.000Z",
        reviewed_by: "moderator",
        resolution: "no_action",
        review_note: "Nothing of concern.",
      }),
    );
    expect(isModerationDecision(report)).toBe(true);
    expect(restrictsPerson(report)).toBe(false);
    expect(report.reviewNote).toBe("Nothing of concern.");
  });

  it("restricts someone only on that specific recorded outcome", () => {
    const report = rowToReport(
      row({
        status: "dismissed",
        reviewed_at: "2026-09-19T12:00:00.000Z",
        reviewed_by: "moderator",
        resolution: "account_restricted",
      }),
    );
    expect(restrictsPerson(report)).toBe(true);
  });

  it("accepts only the resolutions it knows about", () => {
    expect(isValidResolution("no_action")).toBe(true);
    expect(isValidResolution("banned_forever")).toBe(false);
    expect(isValidResolution("")).toBe(false);
  });
});
