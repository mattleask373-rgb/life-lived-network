import { describe, expect, it } from "vitest";

import { freshness, isCurrent } from "./capability-freshness";
import { FIXTURE_NOW, STALE, SARAH } from "./fixtures/people-and-needs";

const now = FIXTURE_NOW;

describe("freshness", () => {
  it("treats a recently confirmed skill as current", () => {
    expect(
      freshness({
        lastConfirmedAt: (SARAH.capabilities[0] as { lastConfirmedAt: string | null })
          .lastConfirmedAt,
        kind: "capability",
        now,
      }),
    ).toBe("fresh");
  });

  it("does not pretend an unconfirmed statement is fine", () => {
    expect(freshness({ lastConfirmedAt: null, kind: "capability", now })).toBe("unknown");
    expect(isCurrent("unknown")).toBe(false);
  });

  it("calls a year-old skill out of date", () => {
    expect(
      freshness({
        lastConfirmedAt: (STALE.capabilities[0] as { lastConfirmedAt: string | null })
          .lastConfirmedAt,
        kind: "capability",
        now,
      }),
    ).toBe("out_of_date");
  });

  it("holds availability to a much shorter window than skills", () => {
    const threeWeeksAgo = "2026-02-12T09:00:00.000Z";
    expect(freshness({ lastConfirmedAt: threeWeeksAgo, kind: "availability", now })).toBe(
      "may_have_changed",
    );
    expect(freshness({ lastConfirmedAt: threeWeeksAgo, kind: "capability", now })).toBe("fresh");
  });

  it("respects a hard expiry whatever else is true", () => {
    expect(
      freshness({
        lastConfirmedAt: now,
        expiresAt: "2026-03-01T00:00:00.000Z",
        kind: "availability",
        now,
      }),
    ).toBe("out_of_date");
  });
});
