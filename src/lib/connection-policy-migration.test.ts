import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20261012174000_harden_connection_request_updates.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("conversation request security migration contract", () => {
  it("revokes anonymous and PUBLIC table privileges on private conversation tables", () => {
    expect(migration).toMatch(
      /REVOKE ALL PRIVILEGES ON TABLE[\s\S]+?public\.content_reports[\s\S]+?FROM PUBLIC, anon;/i,
    );
  });

  it("removes broad request updates and grants only status updates to authenticated users", () => {
    expect(migration).toContain(
      "REVOKE UPDATE ON TABLE public.connection_requests FROM PUBLIC, anon, authenticated;",
    );
    expect(migration).toMatch(
      /REVOKE UPDATE \([\s\S]+?updated_at[\s\S]+?\) ON TABLE public\.connection_requests FROM PUBLIC, anon, authenticated;/i,
    );
    expect(migration).toContain(
      "GRANT UPDATE (status) ON TABLE public.connection_requests TO authenticated;",
    );
  });

  it("matches the established sender and recipient state machine", () => {
    expect(migration).toContain("actor uuid := auth.uid()");
    expect(migration).toContain("IF OLD.status <> 'sent' THEN");
    expect(migration).toContain(
      "IF actor = OLD.recipient_id AND NEW.status IN ('accepted', 'declined') THEN",
    );
    expect(migration).toContain(
      "IF actor = OLD.sender_id AND NEW.status = 'withdrawn' THEN",
    );
  });

  it("guards immutable request identity and captured need context", () => {
    expect(migration).toMatch(
      /NEW\.sender_id,[\s\S]+?NEW\.recipient_id,[\s\S]+?NEW\.context_title,[\s\S]+?NEW\.context_place,[\s\S]+?NEW\.context_when,[\s\S]+?IS DISTINCT FROM ROW/i,
    );
    expect(migration).toContain(
      "CREATE TRIGGER connection_requests_status_guard",
    );
  });

  it("keeps the guard function private and not directly executable by API roles", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION private.guard_connection_request_status_transition()",
    );
    expect(migration).toMatch(/FROM PUBLIC, anon, authenticated;/i);
  });
});
