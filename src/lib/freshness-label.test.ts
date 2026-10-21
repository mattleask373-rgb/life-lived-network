import { describe, expect, it } from "vitest";

import { sourceLastCheckedLabel } from "./freshness-label";

describe("sourceLastCheckedLabel", () => {
  const now = new Date("2026-10-21T12:00:00.000Z");

  it("describes recent checks in plain language", () => {
    expect(sourceLastCheckedLabel("2026-10-21T11:59:30.000Z", now)).toBe(
      "less than a minute ago",
    );
    expect(sourceLastCheckedLabel("2026-10-21T11:55:00.000Z", now)).toBe("5 minutes ago");
    expect(sourceLastCheckedLabel("2026-10-21T10:00:00.000Z", now)).toBe("2 hours ago");
    expect(sourceLastCheckedLabel("2026-10-18T12:00:00.000Z", now)).toBe("3 days ago");
  });

  it("uses an explicit UTC date for older checks", () => {
    expect(sourceLastCheckedLabel("2026-10-01T22:00:00.000Z", now)).toBe("on 2026-10-01 UTC");
  });

  it.each([null, undefined, "", "not-a-date", "2026-10-21T13:00:00.000Z"])(
    "does not invent an age for absent, invalid, or future timestamps: %s",
    (value) => {
      expect(sourceLastCheckedLabel(value, now)).toBeNull();
    },
  );
});
