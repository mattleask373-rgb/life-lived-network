import { describe, expect, it } from "vitest";

import { eventDate, money } from "./layer-colour";

describe("local presentation", () => {
  it("formats money with the stated currency and useful precision", () => {
    expect(money(1250, "GBP")).toBe("£1,250");
    expect(money(12.5, "EUR")).toBe("€12.50");
    expect(money(0, "GBP")).toBe("Free");
    expect(money(-40, "GBP")).toBe("Pays £40");
  });

  it("formats event times in the event's timezone", () => {
    expect(eventDate("2026-09-19T18:00:00Z", "Europe/London")).toContain("19:00");
  });
});
