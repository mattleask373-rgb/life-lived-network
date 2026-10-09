import { describe, expect, it } from "vitest";

import {
  asBookingState,
  availabilityLine,
  isService,
  nextStepFor,
  providerLine,
  qualificationLine,
  servicePossibilities,
} from "./services";
import type { WorldEntry } from "./world-data";

function entry(over: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "s1",
    layer: "people",
    kind: "service",
    title: "An hour of hands-on therapy",
    place: "A treatment room",
    neighbourhood: "Kings Heath",
    placeId: "place-kh",
    x: 50,
    y: 50,
    when: "Weekday mornings",
    band: "tomorrow",
    minutes: 60,
    cost: 45,
    summary: "A paid therapy service offered by a practice.",
    details: [],
    social: "quiet",
    outdoors: false,
    skills: ["massage"],
    organisation: "A practice building",
    ...over,
  } as WorldEntry;
}

describe("booking truthfulness", () => {
  it("treats unknown booking words as no booking pathway", () => {
    expect(asBookingState("maybe")).toBe("not_bookable");
    expect(asBookingState(undefined)).toBe("not_bookable");
    expect(asBookingState("enquire")).toBe("enquire");
  });

  it("never offers a booking action without a usable pathway", () => {
    expect(nextStepFor(entry({ bookingState: "bookable" })).kind).toBe("none");
    expect(nextStepFor(entry({ bookingState: "external" })).kind).toBe("none");
  });

  it("refuses unsafe booking addresses", () => {
    const step = nextStepFor(
      entry({ bookingState: "external", bookingUrl: "javascript:alert(1)" }),
    );
    expect(step.kind).toBe("none");
    expect(step.href).toBeUndefined();
  });

  it("uses a configured external pathway", () => {
    const step = nextStepFor(
      entry({ bookingState: "external", bookingUrl: "https://example.org/fixtures/room-hire" }),
    );
    expect(step.kind).toBe("external");
    expect(step.href).toContain("example.org");
  });

  it("offers an enquiry, not an appointment", () => {
    const step = nextStepFor(entry({ bookingState: "enquire" }));
    expect(step.kind).toBe("enquire");
    expect(step.href).toBeUndefined();
  });

  it("gives a demonstration record no actionable step at all", () => {
    const step = nextStepFor(
      entry({
        demonstration: true,
        bookingState: "external",
        bookingUrl: "https://example.org/fixtures/room-hire",
      }),
    );
    expect(step.kind).toBe("none");
    expect(step.href).toBeUndefined();
  });
});

describe("provider and qualification facts", () => {
  it("never invents a provider", () => {
    expect(providerLine(entry({ organisation: "", providerNote: "" }))).toBe(
      "Provider not yet named",
    );
  });

  it("never turns a skill into a qualification", () => {
    const line = qualificationLine(entry({ skills: ["massage", "physiotherapy"] }));
    expect(line.toLowerCase()).toContain("no qualification");
  });

  it("recognises a service by kind or by organisation", () => {
    expect(isService(entry())).toBe(true);
    expect(isService(entry({ kind: "gathering", organisation: "" }))).toBe(false);
  });
});

describe("services answering a need", () => {
  const world = [
    entry({ id: "here-enquire", bookingState: "enquire" }),
    entry({
      id: "here-external",
      bookingState: "external",
      bookingUrl: "https://example.org/fixtures/room-hire",
    }),
    entry({ id: "elsewhere", placeId: "place-bristol", bookingState: "enquire" }),
    entry({ id: "expired", quality: "expired", bookingState: "enquire" }),
    entry({ id: "cancelled", cancellation: "cancelled", bookingState: "enquire" }),
    entry({ id: "not-a-service", kind: "gathering", organisation: "" }),
  ];

  it("keeps to the locality and leaves out expired or cancelled records", () => {
    const found = servicePossibilities(world, { placeId: "place-kh", text: "therapy massage" }, 10);
    const ids = found.map((f) => f.id);
    expect(ids).toContain("here-enquire");
    expect(ids).toContain("here-external");
    expect(ids).not.toContain("elsewhere");
    expect(ids).not.toContain("expired");
    expect(ids).not.toContain("cancelled");
    expect(ids).not.toContain("not-a-service");
  });

  it("puts a real booking pathway before an enquiry, deterministically", () => {
    const found = servicePossibilities(world, { placeId: "place-kh", text: "therapy" }, 10);
    expect(found[0]?.id).toBe("here-external");
    const again = servicePossibilities(world, { placeId: "place-kh", text: "therapy" }, 10);
    expect(again.map((f) => f.id)).toEqual(found.map((f) => f.id));
  });

  it("returns nothing when no word is shared", () => {
    expect(
      servicePossibilities(world, { placeId: "place-kh", text: "kayaking whitewater" }, 10),
    ).toHaveLength(0);
  });

  it("stays within the limit asked for", () => {
    expect(servicePossibilities(world, { placeId: "place-kh", text: "therapy" }, 1)).toHaveLength(
      1,
    );
  });
});

describe("provider-stated times", () => {
  it("labels times as stated by the provider, never confirmed", () => {
    expect(availabilityLine(entry({ when: "Weekday mornings" }))).toBe(
      "Times as stated by the provider: Weekday mornings",
    );
  });
  it("says times are not stated when empty", () => {
    expect(availabilityLine(entry({ when: "  " }))).toBe("Times not stated");
  });
});
