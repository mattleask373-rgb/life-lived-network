import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20261012174000_harden_connection_request_updates.sql",
    import.meta.url,
  ),
  "utf8",
);
const connectionFunctions = readFileSync(
  new URL("./connection.functions.ts", import.meta.url),
  "utf8",
);

describe("conversation security migration contract", () => {
  it("rebuilds private table permissions from least privilege", () => {
    expect(migration).toMatch(
      /REVOKE ALL PRIVILEGES ON TABLE[\s\S]+?public\.content_reports[\s\S]+?FROM PUBLIC, anon, authenticated;/i,
    );
    expect(migration).toContain(
      "GRANT UPDATE (status) ON TABLE public.connection_requests TO authenticated;",
    );
    expect(migration).toContain(
      "GRANT INSERT (\n  need_id,\n  sender_id,\n  recipient_id,\n  direction,\n  note\n) ON TABLE public.connection_requests TO authenticated;",
    );
    expect(migration).toContain(
      "GRANT INSERT (request_id, sender_id, body)\n  ON TABLE public.connection_messages TO authenticated;",
    );
    expect(migration).not.toContain("  context_title,\n  context_place,\n  context_when\n) ON TABLE public.connection_requests TO authenticated;");
    expect(migration).toContain(
      "GRANT SELECT, DELETE ON TABLE public.user_blocks TO authenticated;",
    );
    expect(migration).toContain(
      "GRANT UPDATE (status, resolution, review_note, reviewed_at, reviewed_by)\n  ON TABLE public.content_reports TO authenticated;",
    );
  });

  it("validates request insert ownership, need state, direction and canonical context", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.guard_connection_request_insert()",
    );
    expect(migration).toContain("NEW.sender_id IS DISTINCT FROM actor");
    expect(migration).toContain("need_status IS DISTINCT FROM 'open'");
    expect(migration).toContain(
      "IF NEW.recipient_id IS DISTINCT FROM need_creator THEN",
    );
    expect(migration).toContain(
      "IF actor IS DISTINCT FROM need_creator THEN",
    );
    expect(migration).toContain("NEW.context_title := need_title;");
    expect(migration).toContain(
      "NEW.context_place := COALESCE(NULLIF(need_place_text, ''), 'Nearby');",
    );
    expect(migration).toContain("CREATE TRIGGER connection_requests_insert_guard");
    expect(connectionFunctions).not.toContain("context_title: snapshot.title");
    expect(connectionFunctions).not.toContain("context_place: snapshot.place");
    expect(connectionFunctions).not.toContain("context_when: snapshot.when");
  });

  it("keeps request identity/context immutable and grants only the status field for updates", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.guard_connection_request_status_transition()",
    );
    expect(migration).toContain("actor uuid := auth.uid()");
    expect(migration).toContain("IF OLD.status <> 'sent' THEN");
    expect(migration).toContain(
      "IF actor = OLD.recipient_id AND NEW.status IN ('accepted', 'declined') THEN",
    );
    expect(migration).toContain("IF actor = OLD.sender_id AND NEW.status = 'withdrawn' THEN");
    expect(migration).toContain("NEW.context_title,");
    expect(migration).toContain("NEW.context_place,");
    expect(migration).toContain("NEW.context_when,");
    expect(migration).toContain("CREATE TRIGGER connection_requests_status_guard");
  });

  it("prevents direct inserts from creating or messaging closed conversations", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.guard_connection_message_insert()",
    );
    expect(migration).toContain("NEW.sender_id IS DISTINCT FROM actor");
    expect(migration).toContain("request_status NOT IN ('sent', 'accepted')");
    expect(migration).toContain("CREATE TRIGGER connection_messages_insert_guard");
  });

  it("keeps trigger functions private to database trigger execution", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION private.guard_connection_request_status_transition()",
    );
    expect(migration).toContain("REVOKE ALL ON FUNCTION private.guard_connection_message_insert()");
    expect(migration).toMatch(/FROM PUBLIC, anon, authenticated;/i);
  });
});
