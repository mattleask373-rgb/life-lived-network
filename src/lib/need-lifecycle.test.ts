import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  isCurrentlyDiscoverableNeed,
  NEED_STALE_AFTER_DAYS,
  needFreshnessCutoff,
  needTimeWindowEnded,
} from "./needs";
import { needLifecycleInput } from "./server-inputs";

const migration = readFileSync(
  new URL("../../supabase/migrations/20261023010000_need_lifecycle_freshness.sql", import.meta.url),
  "utf8",
);
const serverFunctions = readFileSync(new URL("./needs.functions.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../routes/need.index.tsx", import.meta.url), "utf8");

const now = new Date("2026-10-23T00:00:00.000Z");
const freshNeed = {
  status: "open" as const,
  visibility: "local_discovery" as const,
  lastConfirmedAt: "2026-10-22T00:00:00.000Z",
  expiresAt: null,
  endsAt: null,
};

describe("current public need lifecycle", () => {
  it("defines a bounded 30-day reconfirmation window", () => {
    expect(NEED_STALE_AFTER_DAYS).toBe(30);
    expect(needFreshnessCutoff(now)).toBe("2026-09-23T00:00:00.000Z");
    expect(isCurrentlyDiscoverableNeed(freshNeed, now)).toBe(true);
    expect(
      isCurrentlyDiscoverableNeed(
        { ...freshNeed, lastConfirmedAt: "2026-09-22T23:59:59.999Z" },
        now,
      ),
    ).toBe(false);
  });

  it("rejects private, closed, expired, ended and malformed freshness evidence", () => {
    expect(isCurrentlyDiscoverableNeed({ ...freshNeed, visibility: "private" }, now)).toBe(false);
    expect(isCurrentlyDiscoverableNeed({ ...freshNeed, status: "met" }, now)).toBe(false);
    expect(isCurrentlyDiscoverableNeed({ ...freshNeed, expiresAt: "2026-10-22T23:59:59.000Z" }, now))
      .toBe(false);
    expect(isCurrentlyDiscoverableNeed({ ...freshNeed, endsAt: "2026-10-22T23:59:59.000Z" }, now))
      .toBe(false);
    expect(isCurrentlyDiscoverableNeed({ ...freshNeed, expiresAt: "not-a-timestamp" }, now)).toBe(
      false,
    );
    expect(needTimeWindowEnded({ expiresAt: "not-a-timestamp", endsAt: null }, now)).toBe(true);
  });

  it("accepts only the owner lifecycle actions and rejects extra caller fields", () => {
    expect(
      needLifecycleInput.parse({
        id: "7d1f0b8e-3c1a-4c55-9b0e-2a6f3e1d9c10",
        action: "confirm",
      }),
    ).toMatchObject({ action: "confirm" });
    expect(
      needLifecycleInput.parse({
        id: "7d1f0b8e-3c1a-4c55-9b0e-2a6f3e1d9c10",
        action: "met",
      }),
    ).toMatchObject({ action: "met" });
    expect(
      needLifecycleInput.parse({
        id: "7d1f0b8e-3c1a-4c55-9b0e-2a6f3e1d9c10",
        action: "withdrawn",
      }),
    ).toMatchObject({ action: "withdrawn" });
    expect(() =>
      needLifecycleInput.parse({ id: "not-a-uuid", action: "confirm" }),
    ).toThrow();
    expect(() =>
      needLifecycleInput.parse({
        id: "7d1f0b8e-3c1a-4c55-9b0e-2a6f3e1d9c10",
        action: "reopen",
      }),
    ).toThrow();
    expect(() =>
      needLifecycleInput.parse({
        id: "7d1f0b8e-3c1a-4c55-9b0e-2a6f3e1d9c10",
        action: "met",
        creatorId: "another-account",
      }),
    ).toThrow();
  });
});

describe("need lifecycle authorization and discovery parity", () => {
  it("filters server-side public needs by visibility, freshness, expiry and end time", () => {
    expect(serverFunctions).toContain('.in("visibility", ["public", "local_discovery"])');
    expect(serverFunctions).toContain('.gt("last_confirmed_at", needFreshnessCutoff');
    expect(serverFunctions).toContain("expires_at.is.null,expires_at.gt.");
    expect(serverFunctions).toContain("ends_at.is.null,ends_at.gt.");
  });

  it("lets the owner close only open needs and reconfirm without trusting a caller owner ID", () => {
    expect(serverFunctions).toContain("middleware([requireSupabaseAuth])");
    expect(serverFunctions).toContain('.eq("creator_id", context.userId)');
    expect(serverFunctions).toContain('.eq("status", "open")');
    expect(serverFunctions).toContain("update({ status: data.action })");
    expect(serverFunctions).toContain("update({ last_confirmed_at: nowIso })");
  });

  it("keeps RLS and the database trigger as the final guard against stale reads and reopening", () => {
    expect(migration).toContain("status = 'open'");
    expect(migration).toContain("last_confirmed_at > now() - interval '30 days'");
    expect(migration).toContain("(expires_at IS NULL OR expires_at > now())");
    expect(migration).toContain("(ends_at IS NULL OR ends_at > now())");
    expect(migration).toContain("A closed need cannot be reopened");
    expect(migration).toContain("A need whose stated time window has ended cannot be reconfirmed");
    expect(migration).toContain("need_last_confirmed_at <= now() - interval '30 days'");
  });

  it("renders owner controls and avoids linking closed or stale needs to a public matching page", () => {
    expect(page).toContain("Confirm still needed");
    expect(page).toContain("Mark as met");
    expect(page).toContain("Withdraw");
    expect(page).toContain("isCurrentlyDiscoverableNeed(need)");
  });
});
