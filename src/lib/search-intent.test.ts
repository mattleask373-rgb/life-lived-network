import { describe, expect, it } from "vitest";

import { buildPlaceIndex, type Place } from "./places";
import { normalizeQuery, parseSearchIntent } from "./search-intent";

function place(
  id: string,
  name: string,
  kind: Place["kind"],
  parent_id: string | null,
  country_code = "GB",
): Place {
  return {
    id,
    name,
    kind,
    parent_id,
    slug: id,
    country_code,
    timezone: "Europe/London",
    currency: "GBP",
    lat: null,
    lng: null,
    blurb: "",
  };
}

const index = buildPlaceIndex([
  place("root", "United Kingdom & Ireland", "region", null, "GB"),
  place("gb", "United Kingdom", "country", "root", "GB"),
  place("birmingham", "Birmingham", "city", "gb", "GB"),
  place("kings-heath", "Kings Heath", "neighbourhood", "birmingham", "GB"),
  place("lisbon-country", "Portugal", "country", "root", "PT"),
  place("lisbon", "Lisbon", "city", "lisbon-country", "PT"),
]);

describe("search intent and locality context", () => {
  it("normalizes empty and malformed queries without inventing context", () => {
    expect(normalizeQuery("   !!!   ")).toBe("");
    const parsed = parseSearchIntent("  !!!  ", index);
    expect(parsed.intentFamily).toBe("unknown");
    expect(parsed.locality).toBeNull();
    expect(parsed.subject).toBeNull();
    expect(parsed.targetRoute.to).toBe("/");
  });

  it("preserves a requested subject and locality for local service discovery", () => {
    const parsed = parseSearchIntent("gardener in Birmingham", index);
    expect(parsed.intentFamily).toBe("local_service");
    expect(parsed.locality?.place.id).toBe("birmingham");
    expect(parsed.subject).toBe("gardener");
    expect(parsed.targetRoute.to).toBe("/gb/birmingham");
    expect(parsed.targetRoute.search).toEqual({ subject: "gardener", intent: "local_service" });
  });

  it("keeps explicit need wording and locality together for the needs journey", () => {
    const parsed = parseSearchIntent("I need a gardener in Kings Heath", index);
    expect(parsed.intentFamily).toBe("need");
    expect(parsed.locality?.place.id).toBe("kings-heath");
    expect(parsed.targetRoute.to).toBe("/gb/kings-heath");
    expect(parsed.targetRoute.search).toEqual({ subject: "gardener", intent: "need" });
  });

  it("preserves time context for local searches", () => {
    const parsed = parseSearchIntent("live music in Birmingham tonight", index);
    expect(parsed.intentFamily).toBe("whats_on");
    expect(parsed.locality?.place.id).toBe("birmingham");
    expect(parsed.timeframe).toBe("tonight");
    expect(parsed.targetRoute.search).toMatchObject({ intent: "whats_on", timeframe: "tonight" });
  });

  it("uses the canonical locality country code rather than assuming the UK", () => {
    const parsed = parseSearchIntent("things to do in Lisbon", index);
    expect(parsed.locality?.place.id).toBe("lisbon");
    expect(parsed.targetRoute.to).toBe("/pt/lisbon");
  });

  it("does not create a locality match when the supplied place index is absent", () => {
    const parsed = parseSearchIntent("gardener in Birmingham", null);
    expect(parsed.locality).toBeNull();
    expect(parsed.targetRoute.to).toBe("/");
    expect(parsed.normalizedQuery).toBe("gardener in birmingham");
  });
});
