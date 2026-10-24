import { describe, expect, it } from "vitest";

import { duration, eventDate, money } from "./layer-colour";

describe("local presentation", () => {
  it("formats money with the stated currency and useful precision", () => {
    expect(money(1250, "GBP")).toBe("£1,250");
    expect(money(12.5, "EUR")).toBe("€12.50");
    expect(money(0, "GBP")).toBe("Free");
    expect(money(-40, "GBP")).toBe("Pays £40");
    expect(money(0, "GBP", "pt")).toBe("Grátis");
    expect(money(12.5, "EUR", "es")).toContain("12,50");
  });

  it("formats event times in the event's timezone", () => {
    expect(eventDate("2026-09-19T18:00:00Z", "Europe/London")).toContain("19:00");
    expect(eventDate("2026-09-19T18:00:00Z", "Europe/London", "ja")).toContain("19:00");
    expect(eventDate("2026-09-19T18:00:00Z", "Invalid/Zone", "en")).toBe("");
  });

  it("localizes duration labels while preserving English defaults", () => {
    expect(duration(45)).toBe("45 min");
    expect(duration(90, "pt")).toBe("1,5 h");
    expect(duration(0, "ja")).toBe("時間指定なし");
  });
});
