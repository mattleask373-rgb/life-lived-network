import { describe, expect, it } from "vitest";

import { sourceLastCheckedLabel } from "./freshness-label";

const NOW = new Date("2026-10-21T12:00:00.000Z");

describe("sourceLastCheckedLabel", () => {
  it("describes recent timestamps without claiming the source is live", () => {
    expect(sourceLastCheckedLabel("2026-10-21T11:59:30.000Z", NOW)).toBe("less than a minute ago");
    expect(sourceLastCheckedLabel("2026-10-21T11:48:00.000Z", NOW)).toBe("12 minutes ago");
    expect(sourceLastCheckedLabel("2026-10-21T08:00:00.000Z", NOW)).toBe("4 hours ago");
    expect(sourceLastCheckedLabel("2026-10-19T12:00:00.000Z", NOW)).toBe("2 days ago");
  });

  it("uses a stable UTC date for checks older than a week", () => {
    expect(sourceLastCheckedLabel("2026-10-01T12:00:00.000Z", NOW)).toBe("on 2026-10-01 UTC");
  });

  it("does not invent an age when the timestamp is absent, invalid or in the future", () => {
    expect(sourceLastCheckedLabel(null, NOW)).toBeNull();
    expect(sourceLastCheckedLabel(undefined, NOW)).toBeNull();
    expect(sourceLastCheckedLabel("not-a-timestamp", NOW)).toBeNull();
    expect(sourceLastCheckedLabel("2026-10-21T13:00:00.000Z", NOW)).toBeNull();
  });
});
