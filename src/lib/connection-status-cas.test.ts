import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./connection.functions.ts", import.meta.url), "utf8");
const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20261022110000_harden_connection_request_updates.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("connection status concurrency and database guards", () => {
  it("updates only if the status still matches the state checked before the write", () => {
    const start = source.indexOf("export const moveConnectionRequest");
    const end = source.indexOf("/** Everything you're part of", start);
    const moveHandler = source.slice(start, end);
    const updateQuery = moveHandler.slice(
      moveHandler.indexOf(".update({ status: data.status })"),
      moveHandler.indexOf("if (error) throw error;"),
    );

    expect(updateQuery).toContain('.eq("id", data.id)');
    expect(updateQuery).toContain('.eq("status", request.status)');
    expect(updateQuery).toContain(".maybeSingle()");
    expect(updateQuery.indexOf('.eq("id", data.id)')).toBeLessThan(
      updateQuery.indexOf('.eq("status", request.status)'),
    );
    expect(moveHandler).toContain("This request changed before your update could be saved");
  });

  it("limits authenticated writes to required connection columns", () => {
    expect(migration).toContain(
      "REVOKE UPDATE ON TABLE public.connection_requests FROM authenticated;",
    );
    expect(migration).toContain(
      "GRANT UPDATE (status) ON TABLE public.connection_requests TO authenticated;",
    );
    expect(migration).toContain(
      "REVOKE INSERT ON TABLE public.connection_requests FROM authenticated;",
    );
    expect(migration).toContain(
      "GRANT INSERT (request_id, sender_id, body) ON TABLE public.connection_messages TO authenticated;",
    );
  });

  it("enforces permitted transitions and immutable request details in the database", () => {
    expect(migration).toContain("CREATE TRIGGER connection_requests_guard_insert");
    expect(migration).toContain("CREATE TRIGGER connection_requests_guard_update");
    expect(migration).toContain("CREATE TRIGGER connection_messages_guard_insert");
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION private.people_are_blocked(uuid, uuid) TO authenticated;",
    );
    expect(migration).toContain("NEW.status IS DISTINCT FROM 'sent'");
    expect(migration).toContain("NEW.status IN ('accepted', 'declined')");
    expect(migration).toContain("NEW.status = 'withdrawn'");
    expect(migration).toContain("NEW.status IN ('sent', 'accepted')");
    expect(migration).toContain("Unblocked participants can add messages to open requests");
    expect(migration).toContain(
      "need_id, sender_id, recipient_id, direction, note, context_title, context_place, context_when",
    );
    expect(migration).toContain("NEW.recipient_id IS DISTINCT FROM v_need_creator");
    expect(migration).toContain("NEW.context_title := v_need_title");
    expect(migration).toContain("connection request details cannot be changed");
  });
});
