import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { validatePublicContentReport } from "./public-content-report";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20261022230000_extend_public_content_reports.sql",
    import.meta.url,
  ),
  "utf8",
);
const needDetail = readFileSync(new URL("../routes/need.$id.tsx", import.meta.url), "utf8");
const reportControl = readFileSync(
  new URL("../components/report-public-content.tsx", import.meta.url),
  "utf8",
);

const valid = {
  subjectType: "listing",
  subjectId: "5de4c76c-b3e2-4c2a-893a-87c0e0ad2f2b",
  reason: "misleading",
  note: "  The details appear out of date.  ",
};

describe("public content report input contract", () => {
  it("accepts only the public subject types and normalizes the optional note", () => {
    expect(validatePublicContentReport(valid)).toEqual({
      ...valid,
      note: "The details appear out of date.",
    });
    expect(
      validatePublicContentReport({
        ...valid,
        subjectType: "need",
        note: "x".repeat(1100),
      }).note,
    ).toHaveLength(1000);
    expect(
      validatePublicContentReport({
        ...valid,
        subjectType: "profile",
        subjectId: "5de4c76c-b3e2-4c2a-893a-87c0e0ad2f2b",
      }).subjectType,
    ).toBe("profile");
  });

  it("rejects private or unsupported subjects, malformed IDs and unknown reasons", () => {
    expect(() =>
      validatePublicContentReport({ ...valid, subjectType: "connection_message" }),
    ).toThrow(/something public/i);
    expect(() =>
      validatePublicContentReport({ ...valid, subjectType: "need", subjectId: "need-123" }),
    ).toThrow(/isn't available/i);
    expect(() => validatePublicContentReport({ ...valid, reason: "five_stars" })).toThrow(
      /choose a reason/i,
    );
    expect(() => validatePublicContentReport({ ...valid, note: 12 as unknown as string })).toThrow(
      /note isn't valid/i,
    );
  });
});

describe("public report entry points", () => {
  it("lets people report discoverable profiles presented as need-matching previews", () => {
    expect(needDetail).toContain('subjectType="profile"');
    expect(needDetail).toContain("subjectId={r.personId}");
    expect(reportControl).toContain('subjectType: PublicReportSubject;');
    expect(reportControl).toContain("Sign in to send a private report");
  });
});

describe("database-enforced public report contract", () => {
  it("extends the report subject constraint without removing existing conversation reporting", () => {
    expect(migration).toContain("DROP CONSTRAINT IF EXISTS content_reports_subject_type_check");
    expect(migration).toContain("'profile'");
    expect(migration).toContain("'connection_request'");
    expect(migration).toContain("'connection_message'");
    expect(migration).toContain("'listing'");
    expect(migration).toContain("'need'");
  });

  it("preserves connection-request reporting while verifying new public subjects", () => {
    expect(migration).toContain("NEW.reporter_id IS DISTINCT FROM actor");
    expect(migration).toContain("NEW.subject_type = 'connection_request'");
    expect(migration).toContain("FROM public.connection_requests AS r");
    expect(migration).toContain("Only a conversation participant may report it");
  });

  it("derives the reported owner and verifies the currently public subject in the trigger", () => {
    expect(migration).toContain("NEW.reporter_id IS DISTINCT FROM actor");
    expect(migration).toContain("FROM public.listings AS l");
    expect(migration).toContain("l.status = 'published'");
    expect(migration).toContain("FROM public.needs AS n");
    expect(migration).toContain("n.status = 'open'");
    expect(migration).toContain("n.visibility IN ('public', 'local_discovery')");
    expect(migration).toContain("p.discoverable IS TRUE");
    expect(migration).toContain("NEW.reported_user_id IS DISTINCT FROM expected_reported_user");
    expect(migration).toContain("NEW.status := 'submitted'");
    expect(migration).toContain("REVOKE ALL ON FUNCTION private.guard_content_report_insert()");
  });

  it("does not treat a report as an automatic moderation decision", () => {
    expect(migration).toContain("Reporting is a request for review, never a verdict");
    expect(migration).not.toMatch(/NEW\.status\s*:=\s*'resolved'/i);
    expect(migration).not.toMatch(/NEW\.status\s*:=\s*'dismissed'/i);
  });
});
