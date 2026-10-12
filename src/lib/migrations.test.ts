import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

// The canonical production baseline: last migration applied to production database
const PRODUCTION_BASELINE_MIGRATION = "20260919145602_7285e584-b13a-4180-a13b-d5e3ba4102cd.sql";

// All protected production application tables containing real user or atlas data
const PROTECTED_PRODUCTION_TABLES = [
  "places",
  "place_memories",
  "needs",
  "profiles",
  "listings",
  "hour_offers",
  "connection_requests",
  "content_reports",
  "sources",
  "localities",
  "regions",
  "countries",
  "users",
  "audit_log",
  "safety_reviewers",
];

const MIGRATIONS_DIR = path.resolve(__dirname, "../../supabase/migrations");

function getPendingMigrations(): { filename: string; content: string }[] {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const baselineIndex = files.indexOf(PRODUCTION_BASELINE_MIGRATION);
  if (baselineIndex === -1) {
    throw new Error(`Production baseline migration not found in ${MIGRATIONS_DIR}`);
  }
  const pendingFiles = files.slice(baselineIndex + 1);
  return pendingFiles.map((filename) => ({
    filename,
    content: fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf-8"),
  }));
}

describe("Pending migration catalog", () => {
  it("identifies exactly the pending migrations beyond production baseline", () => {
    const pending = getPendingMigrations();
    expect(pending.length).toBeGreaterThan(0);
    const filenames = pending.map((p) => p.filename);
    expect(filenames).toContain("20261007171000_remove_unfenced_heartbeat.sql");
    expect(filenames).toContain("20261007172000_fence_release.sql");
  });
});

describe("Migration fencing: table protection", () => {
  const pending = getPendingMigrations();

  it("never modifies protected production data or schema", () => {
    for (const { filename, content } of pending) {
      for (const table of PROTECTED_PRODUCTION_TABLES) {
        // Match table modifications: ALTER TABLE, DROP TABLE, TRUNCATE, INSERT INTO, UPDATE, DELETE FROM
        const dangerousPatterns = [
          new RegExp(`\\bALTER\\s+TABLE\\s+(?:public\\.)?${table}\\b`, "i"),
          new RegExp(`\\bDROP\\s+TABLE\\s+(?:public\\.)?${table}\\b`, "i"),
          new RegExp(`\\bTRUNCATE\\s+(?:TABLE\\s+)?(?:public\\.)?${table}\\b`, "i"),
          new RegExp(`\\bINSERT\\s+INTO\\s+(?:public\\.)?${table}\\b`, "i"),
          new RegExp(`\\bUPDATE\\s+(?:public\\.)?${table}\\b`, "i"),
          new RegExp(`\\bDELETE\\s+FROM\\s+(?:public\\.)?${table}\\b`, "i"),
        ];

        for (const pattern of dangerousPatterns) {
          expect(
            pattern.test(content),
            `Pending migration ${filename} violates table fence: matched ${pattern} on table '${table}'`,
          ).toBe(false);
        }
      }
    }
  });

  it("fences table modifications strictly to agent control plane (agent_tasks)", () => {
    for (const { filename, content } of pending) {
      // Find all UPDATE statements in pending migrations
      const updateMatches = [...content.matchAll(/\bUPDATE\s+([a-zA-Z0-9_.]+)/gi)];
      for (const match of updateMatches) {
        const targetTable = match[1].toLowerCase().replace(/^public\./, "");
        expect(
          targetTable,
          `Pending migration ${filename} attempts UPDATE on '${targetTable}', but only 'agent_tasks' is permitted`,
        ).toBe("agent_tasks");
      }
    }
  });
});

describe("Migration fencing: security policies and RLS", () => {
  const pending = getPendingMigrations();

  it("never creates, alters, or drops RLS policies", () => {
    for (const { filename, content } of pending) {
      const policyPatterns = [
        /\bCREATE\s+POLICY\b/i,
        /\bALTER\s+POLICY\b/i,
        /\bDROP\s+POLICY\b/i,
        /\bDISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i,
      ];

      for (const pattern of policyPatterns) {
        expect(
          pattern.test(content),
          `Pending migration ${filename} modifies security policy: matched ${pattern}`,
        ).toBe(false);
      }
    }
  });

  it("enforces that any security definer functions revoke public access and grant only to service_role", () => {
    for (const { filename, content } of pending) {
      if (/\bSECURITY\s+DEFINER\b/i.test(content)) {
        // Must revoke from PUBLIC
        expect(
          /REVOKE\s+ALL\s+ON\s+FUNCTION.+FROM\s+PUBLIC/i.test(content),
          `Pending migration ${filename} defines a SECURITY DEFINER function but fails to REVOKE from PUBLIC`,
        ).toBe(true);

        // Must NOT grant to anon or authenticated
        expect(/TO\s+anon\b/i.test(content)).toBe(false);
        expect(/TO\s+authenticated\b/i.test(content)).toBe(false);
      }
    }
  });
});
