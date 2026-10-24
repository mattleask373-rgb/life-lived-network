import { describe, expect, it } from "vitest";

import type { SourceEvent } from "./contract";
import { normaliseEvent } from "./normalise";

const base: SourceEvent = {
  externalId: "event-123",
  title: "An event",
  summary: "",
  details: [],
  startsAt: "2027-06-10T18:00:00.000Z",
  timezone: "Europe/London",
  venueName: "A venue",
  category: "music",
  sourceUrl: "https://events.example.test/event-123",
  state: "live",
};

describe("normaliseEvent price evidence", () => {
  it("keeps an explicit zero with a valid currency as a known free price", () => {
    expect(normaliseEvent({ ...base, cost: 0, currency: "gbp" })).toMatchObject({
      cost: 0,
      currency: "GBP",
    });
  });

  it("keeps paid non-GBP amounts and normalizes code case", () => {
    expect(normaliseEvent({ ...base, cost: 125, currency: "aud" })).toMatchObject({
      cost: 125,
      currency: "AUD",
    });
  });

  it("does not invent an amount or default an absent currency to GBP", () => {
    expect(normaliseEvent({ ...base, cost: null })).toMatchObject({
      cost: null,
      currency: "",
    });
    expect(normaliseEvent({ ...base, cost: 15, currency: "not-a-currency" })).toMatchObject({
      cost: 15,
      currency: "",
    });
  });

  it("rejects negative provider prices instead of converting them into free", () => {
    expect(normaliseEvent({ ...base, cost: -1, currency: "USD" })).toMatchObject({
      cost: null,
      currency: "USD",
    });
  });
});
