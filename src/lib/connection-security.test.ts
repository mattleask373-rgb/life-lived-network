import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PRIVATE_PATHS, PUBLIC_PATHS } from "./seo";
import {
  canMove,
  isOpen,
  roleFor,
  rowToRequest,
  type ConnectionRequest,
  type ConnectionRequestRow,
} from "./connection";
import { otherPerson, REPORT_REASONS } from "./safety";

describe("conversation security policy and privacy invariants", () => {
  describe("route and indexing privacy", () => {
    it("ensures /conversations is strictly private and excluded from public sitemaps", () => {
      expect(PRIVATE_PATHS).toContain("/conversations");
      expect(PUBLIC_PATHS).not.toContain("/conversations");
    });

    it("ensures conversations route sets noindex, nofollow via privatePage()", () => {
      const src = readFileSync(join(__dirname, "../routes/conversations.tsx"), "utf8");
      expect(src).toContain("privatePage");
      expect(src).toMatch(/head:\s*\(\)\s*=>\s*privatePage\(/);
    });

    it("ensures conversations UI strictly gates query execution behind user authentication", () => {
      const src = readFileSync(join(__dirname, "../routes/conversations.tsx"), "utf8");
      expect(src).toContain("useSession");
      expect(src).toMatch(/enabled:\s*Boolean\(user\)/);
      expect(src).toContain("Sign in");
      expect(src).toMatch(/ready\s*&&\s*!user/);
    });
  });

  describe("server action authentication and authority boundaries", () => {
    const src = readFileSync(join(__dirname, "connection.functions.ts"), "utf8");

    it("verifies every exported server action enforces requireSupabaseAuth middleware", () => {
      const serverFnMatches = src.match(/export const \w+\s*=\s*createServerFn/g) ?? [];
      const middlewareMatches = src.match(/\.middleware\(\[requireSupabaseAuth\]\)/g) ?? [];

      expect(serverFnMatches.length).toBeGreaterThan(0);
      expect(middlewareMatches.length).toBe(serverFnMatches.length);
      expect(serverFnMatches.length).toBe(7); // sendConnectionRequest, moveConnectionRequest, getMyConnections, getConnection, sendConnectionMessage, blockConnectionPerson, reportConnection
    });

    it("verifies server actions never use service_role, admin bypass, or unauthenticated queries", () => {
      expect(src).not.toMatch(/service_role|supabaseAdmin|createAdminClient/);
    });

    it("enforces role isolation so non-participants are denied access", () => {
      const testRow: ConnectionRequestRow = {
        id: "req-1",
        need_id: "need-1",
        sender_id: "alice",
        recipient_id: "bob",
        direction: "offer",
        note: "Hello",
        status: "sent",
        context_title: "Help with garden",
        context_place: "Lewes",
        context_when: "Tomorrow",
        created_at: "2026-10-12T10:00:00.000Z",
        updated_at: "2026-10-12T10:00:00.000Z",
      };
      const req: ConnectionRequest = rowToRequest(testRow);

      expect(roleFor(req, "alice")).toBe("sender");
      expect(roleFor(req, "bob")).toBe("recipient");
      expect(roleFor(req, "eve")).toBeNull();
      expect(otherPerson({ senderId: "alice", recipientId: "bob" }, "alice")).toBe("bob");
      expect(otherPerson({ senderId: "alice", recipientId: "bob" }, "bob")).toBe("alice");
      expect(otherPerson({ senderId: "alice", recipientId: "bob" }, "eve")).toBeNull();
    });

    it("enforces immutable state transitions on settled conversations", () => {
      expect(canMove("recipient", "sent", "accepted")).toBe(true);
      expect(canMove("recipient", "sent", "declined")).toBe(true);
      expect(canMove("recipient", "sent", "withdrawn")).toBe(false);
      expect(canMove("sender", "sent", "withdrawn")).toBe(true);
      expect(canMove("sender", "sent", "accepted")).toBe(false);

      // Once accepted, declined, or withdrawn, neither party can reopen
      for (const terminal of ["accepted", "declined", "withdrawn"] as const) {
        expect(canMove("recipient", terminal, "sent")).toBe(false);
        expect(canMove("recipient", terminal, "accepted")).toBe(false);
        expect(canMove("recipient", terminal, "declined")).toBe(false);
        expect(canMove("sender", terminal, "sent")).toBe(false);
        expect(canMove("sender", terminal, "withdrawn")).toBe(false);
      }
    });

    it("prohibits posting messages to closed conversation threads", () => {
      expect(isOpen("sent")).toBe(true);
      expect(isOpen("accepted")).toBe(true);
      expect(isOpen("declined")).toBe(false);
      expect(isOpen("withdrawn")).toBe(false);
    });

    it("bounds report reasons to authorized plain taxonomy", () => {
      expect(REPORT_REASONS.map((r) => r.id)).toEqual([
        "safety",
        "harassment",
        "spam",
        "misleading",
        "other",
      ]);
    });
  });

  describe("database migration row-level security and schema constraints", () => {
    const migrationsDir = join(__dirname, "../../supabase/migrations");
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const allMigrationsSql = migrationFiles
      .map((f) => readFileSync(join(migrationsDir, f), "utf8"))
      .join("\n\n");

    it("enforces RLS on connection_requests and connection_messages", () => {
      expect(allMigrationsSql).toMatch(
        /ALTER TABLE\s+public\.connection_requests\s+ENABLE ROW LEVEL SECURITY/i,
      );
      expect(allMigrationsSql).toMatch(
        /ALTER TABLE\s+public\.connection_messages\s+ENABLE ROW LEVEL SECURITY/i,
      );
    });

    it("enforces table constraints preventing self-connections and duplicate requests", () => {
      expect(allMigrationsSql).toMatch(
        /CONSTRAINT\s+connection_requests_not_self\s+CHECK\s*\(\s*sender_id\s*<>\s*recipient_id\s*\)/i,
      );
      expect(allMigrationsSql).toMatch(
        /CONSTRAINT\s+connection_requests_once\s+UNIQUE\s*\(\s*need_id\s*,\s*sender_id\s*,\s*recipient_id\s*\)/i,
      );
      expect(allMigrationsSql).toMatch(
        /CONSTRAINT\s+connection_requests_direction_check\s+CHECK\s*\(\s*direction\s+IN\s*\('offer'\s*,\s*'invite'\)\s*\)/i,
      );
      expect(allMigrationsSql).toMatch(
        /CONSTRAINT\s+connection_requests_status_check\s+CHECK\s*\(\s*status\s+IN\s*\('sent'\s*,\s*'accepted'\s*,\s*'declined'\s*,\s*'withdrawn'\)\s*\)/i,
      );
    });

    it("verifies authenticated permissions do not grant DELETE or public/anon grants", () => {
      // Ensure no anon grants on connection tables
      expect(allMigrationsSql).not.toMatch(
        /GRANT\s+.*ON\s+public\.connection_requests\s+TO\s+anon/i,
      );
      expect(allMigrationsSql).not.toMatch(
        /GRANT\s+.*ON\s+public\.connection_messages\s+TO\s+anon/i,
      );

      // Authenticated users get SELECT, INSERT, UPDATE on requests, but never DELETE
      expect(allMigrationsSql).toMatch(
        /GRANT\s+SELECT,\s*INSERT,\s*UPDATE\s+ON\s+public\.connection_requests\s+TO\s+authenticated/i,
      );
      expect(allMigrationsSql).not.toMatch(
        /GRANT\s+.*DELETE.*ON\s+public\.connection_requests\s+TO\s+authenticated/i,
      );

      // Authenticated users get SELECT, INSERT on messages, but NEVER UPDATE OR DELETE (immutable append-only messages)
      expect(allMigrationsSql).toMatch(
        /GRANT\s+SELECT,\s*INSERT\s+ON\s+public\.connection_messages\s+TO\s+authenticated/i,
      );
      expect(allMigrationsSql).not.toMatch(
        /GRANT\s+.*UPDATE.*ON\s+public\.connection_messages\s+TO\s+authenticated/i,
      );
      expect(allMigrationsSql).not.toMatch(
        /GRANT\s+.*DELETE.*ON\s+public\.connection_messages\s+TO\s+authenticated/i,
      );
    });

    it("verifies tightened RLS policies enforce participant scope and block isolation", () => {
      // Tightened policies from 20260919104038
      expect(allMigrationsSql).toMatch(
        /CREATE POLICY "People can send unblocked requests" ON public\.connection_requests FOR INSERT TO authenticated WITH CHECK \(auth\.uid\(\) = sender_id AND NOT private\.people_are_blocked\(sender_id, recipient_id\)\)/,
      );
      expect(allMigrationsSql).toMatch(
        /CREATE POLICY "Unblocked participants can read a request" ON public\.connection_requests FOR SELECT TO authenticated USING \(\(\(auth\.uid\(\) = sender_id\) OR \(auth\.uid\(\) = recipient_id\)\) AND NOT private\.people_are_blocked\(sender_id, recipient_id\)\)/,
      );
      expect(allMigrationsSql).toMatch(
        /CREATE POLICY "Unblocked participants can move a request" ON public\.connection_requests FOR UPDATE TO authenticated USING \(\(\(auth\.uid\(\) = sender_id\) OR \(auth\.uid\(\) = recipient_id\)\) AND NOT private\.people_are_blocked\(sender_id, recipient_id\)\)/,
      );
      expect(allMigrationsSql).toMatch(
        /CREATE POLICY "Unblocked participants can read messages" ON public\.connection_messages FOR SELECT TO authenticated USING \(EXISTS \(SELECT 1 FROM public\.connection_requests r WHERE r\.id = request_id AND \(\(auth\.uid\(\) = r\.sender_id\) OR \(auth\.uid\(\) = r\.recipient_id\)\) AND NOT private\.people_are_blocked\(r\.sender_id, r\.recipient_id\)\)\)/,
      );
      expect(allMigrationsSql).toMatch(
        /CREATE POLICY "Unblocked participants can add messages" ON public\.connection_messages FOR INSERT TO authenticated WITH CHECK \(auth\.uid\(\) = sender_id AND EXISTS \(SELECT 1 FROM public\.connection_requests r WHERE r\.id = request_id AND \(\(auth\.uid\(\) = r\.sender_id\) OR \(auth\.uid\(\) = r\.recipient_id\)\) AND NOT private\.people_are_blocked\(r\.sender_id, r\.recipient_id\)\)\)/,
      );
    });
  });
});
