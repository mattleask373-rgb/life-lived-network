import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PRODUCTION_BASELINE_MIGRATION = "20260919145602_7285e584-b13a-4180-a13b-d5e3ba4102cd.sql";
const MIGRATIONS_DIR = path.resolve(__dirname, "../../supabase/migrations");

type MigrationClass = "agent-control-plane" | "product-security" | "product-schema";

interface MigrationReviewRecord {
  classification: MigrationClass;
  trackingIssue: string;
  purpose: string;
  affectedTables: string[];
  changesRls: boolean;
  changesPrivileges: boolean;
  requiresIndependentReview: boolean;
}

/**
 * This is a classification inventory, not approval to apply a migration.
 *
 * New migrations after the known production baseline must declare their intent
 * and risk here. Product-security migrations are valid: they must not be
 * blanket-rejected merely because they repair grants, RLS or app tables.
 *
 * Static tests cannot prove which database a deploy path targets or that a
 * human approved a change. Those remain separate environment/review gates.
 */
const MIGRATION_REVIEW_REGISTRY: Record<string, MigrationReviewRecord> = {
  "20261007171000_remove_unfenced_heartbeat.sql": {
    classification: "agent-control-plane",
    trackingIssue: "#33 / #47",
    purpose:
      "Remove the legacy unfenced heartbeat overload and restrict tokenized heartbeat execution to service_role.",
    affectedTables: [],
    changesRls: false,
    changesPrivileges: true,
    requiresIndependentReview: true,
  },
  "20261007172000_fence_release.sql": {
    classification: "agent-control-plane",
    trackingIssue: "#33 / #47",
    purpose:
      "Require lease generation and opaque token when releasing an agent task; mutate agent_tasks only.",
    affectedTables: ["agent_tasks"],
    changesRls: false,
    changesPrivileges: true,
    requiresIndependentReview: true,
  },
};

const PROTECTED_PRODUCTION_TABLES = [
  "availability_windows",
  "connection_messages",
  "connection_requests",
  "content_reports",
  "contribution_preferences",
  "hour_offers",
  "journey_places",
  "journeys",
  "listing_photos",
  "listings",
  "needs",
  "opportunity_preferences",
  "person_capabilities",
  "place_memories",
  "places",
  "profiles",
  "saved_items",
  "service_areas",
  "source_records",
  "sources",
  "user_blocks",
  "user_roles",
];

const KNOWN_APPLICATION_TABLES = [...PROTECTED_PRODUCTION_TABLES, "agent_tasks"];

interface PendingMigration {
  filename: string;
  content: string;
}

function getPendingMigrations(): PendingMigration[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((filename) => filename.endsWith(".sql"))
    .sort();
  const baselineIndex = files.indexOf(PRODUCTION_BASELINE_MIGRATION);

  if (baselineIndex === -1) {
    throw new Error("Production baseline migration not found in " + MIGRATIONS_DIR);
  }

  return files.slice(baselineIndex + 1).map((filename) => ({
    filename,
    content: readFileSync(path.join(MIGRATIONS_DIR, filename), "utf8"),
  }));
}

function modifyingTablePattern(table: string): RegExp {
  return new RegExp(
    "\\b(?:ALTER\\s+TABLE|DROP\\s+TABLE|TRUNCATE(?:\\s+TABLE)?|INSERT\\s+INTO|UPDATE|DELETE\\s+FROM)\\s+(?:public\\.)?" +
      table +
      "\\b",
    "i",
  );
}

function touchedApplicationTables(content: string): string[] {
  return KNOWN_APPLICATION_TABLES
    .filter((table) => modifyingTablePattern(table).test(content))
    .sort();
}

function changesRls(content: string): boolean {
  return /\b(?:CREATE|ALTER|DROP)\s+POLICY\b|\bDISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i.test(content);
}

function changesPrivileges(content: string): boolean {
  return /\b(?:GRANT|REVOKE)\b|\bALTER\s+DEFAULT\s+PRIVILEGES\b/i.test(content);
}

describe("Pending migration inventory", () => {
  it("classifies every migration beyond the recorded production baseline", () => {
    const pending = getPendingMigrations();
    const pendingNames = pending.map(({ filename }) => filename);

    expect(pendingNames.length).toBeGreaterThan(0);
    expect(pendingNames).toContain("20261007171000_remove_unfenced_heartbeat.sql");
    expect(pendingNames).toContain("20261007172000_fence_release.sql");

    for (const { filename, content } of pending) {
      const record = MIGRATION_REVIEW_REGISTRY[filename];
      expect(record, "Pending migration needs a risk classification: " + filename).toBeDefined();
      expect(
        record.trackingIssue.trim().length,
        filename + " needs a tracking issue",
      ).toBeGreaterThan(0);
      expect(record.purpose.trim().length, filename + " needs a stated purpose").toBeGreaterThan(0);
      expect(
        record.requiresIndependentReview,
        filename + " requires independent review",
      ).toBe(true);
      expect(record.affectedTables).toEqual(touchedApplicationTables(content));
      expect(record.changesRls).toBe(changesRls(content));
      expect(record.changesPrivileges).toBe(changesPrivileges(content));
    }

    for (const filename of Object.keys(MIGRATION_REVIEW_REGISTRY)) {
      expect(
        pendingNames,
        "Registry entry must refer to a pending migration: " + filename,
      ).toContain(filename);
    }
  });
});

describe("Agent control-plane migration isolation", () => {
  const pending = getPendingMigrations().filter(
    ({ filename }) => MIGRATION_REVIEW_REGISTRY[filename]?.classification === "agent-control-plane",
  );

  it("does not mutate protected application tables from an agent-control-plane migration", () => {
    for (const { filename, content } of pending) {
      for (const table of PROTECTED_PRODUCTION_TABLES) {
        expect(
          modifyingTablePattern(table).test(content),
          "Agent-control-plane migration " + filename + " modifies protected table " + table,
        ).toBe(false);
      }
    }
  });

  it("limits agent-control-plane UPDATE statements to agent_tasks", () => {
    for (const { filename, content } of pending) {
      const updateMatches = [...content.matchAll(/\bUPDATE\s+([a-zA-Z0-9_.]+)/gi)];

      for (const match of updateMatches) {
        const targetTable = match[1].toLowerCase().replace(/^public\./, "");
        expect(
          targetTable,
          "Agent-control-plane migration " + filename + " attempts UPDATE on " + targetTable,
        ).toBe("agent_tasks");
      }
    }
  });

  it("does not create, alter or drop RLS policies from the agent-control-plane category", () => {
    const policyPatterns = [
      /\bCREATE\s+POLICY\b/i,
      /\bALTER\s+POLICY\b/i,
      /\bDROP\s+POLICY\b/i,
      /\bDISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i,
    ];

    for (const { filename, content } of pending) {
      for (const pattern of policyPatterns) {
        expect(
          pattern.test(content),
          "Agent-control-plane migration " + filename + " changes RLS: " + pattern,
        ).toBe(false);
      }
    }
  });
});

describe("Migration detector regression tests", () => {
  it("recognizes protected-table DDL and DML statements", () => {
    const statements = [
      "ALTER TABLE public.connection_requests ADD COLUMN reviewed boolean",
      "DROP TABLE connection_requests",
      "TRUNCATE TABLE public.connection_requests",
      "INSERT INTO public.connection_requests (id) VALUES ('x')",
      "UPDATE public.connection_requests SET status = 'sent'",
      "DELETE FROM public.connection_requests WHERE true",
    ];

    for (const statement of statements) {
      expect(modifyingTablePattern("connection_requests").test(statement), statement).toBe(true);
    }
  });

  it("does not treat a different table or the agent_tasks control plane as a protected-table change", () => {
    expect(
      modifyingTablePattern("connection_requests").test(
        "UPDATE public.agent_tasks SET status = 'READY'",
      ),
    ).toBe(false);
    expect(
      modifyingTablePattern("connection_requests").test(
        "UPDATE public.connection_requests_archive SET status = 'sent'",
      ),
    ).toBe(false);
  });
});

describe("SECURITY DEFINER migration review", () => {
  it("requires every pending SECURITY DEFINER function to revoke PUBLIC execute", () => {
    for (const { filename, content } of getPendingMigrations()) {
      if (!/\bSECURITY\s+DEFINER\b/i.test(content)) continue;

      expect(
        /REVOKE\s+ALL\s+ON\s+FUNCTION[\s\S]+?FROM\s+PUBLIC/i.test(content),
        "Migration " + filename + " defines SECURITY DEFINER but does not revoke PUBLIC execute",
      ).toBe(true);
    }
  });
});
