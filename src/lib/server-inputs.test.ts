import { describe, expect, it } from "vitest";
import {
  canonicalizeNeedPlace,
  createNeedInput,
  moveConnectionInput,
  needIdInput,
  refreshSourceInput,
} from "./server-inputs";

const placeId = "8a7d1b6c-5f4e-4a32-9c10-1b2d3e4f5a60";

const validNeedDraft = () => ({
  category: "  Gardening ",
  title: "Help with a garden",
  description: "A small, overgrown garden needs clearing.",
  intent: "help",
  place_id: placeId,
  place_text: "Client says somewhere else",
  lat: 10,
  lng: 20,
  timezone: "UTC",
  starts_at: "2026-10-15T12:00:00.000Z",
  ends_at: "2026-10-15T14:00:00.000Z",
  duration_minutes: 120,
  flexibility: "some",
  budget: 0,
  currency: "GBP",
  payment_type: "contribution",
  required_skills: [" gardening "],
  required_qualifications: [],
  recurring: false,
  urgency: "soon",
  visibility: "local_discovery",
});

const id = "7d1f0b8e-3c1a-4c55-9b0e-2a6f3e1d9c10";

describe("server action inputs", () => {
  it("accepts well-formed requests", () => {
    expect(moveConnectionInput.parse({ id, status: "accepted" }).status).toBe("accepted");
    expect(needIdInput.parse({ needId: id }).needId).toBe(id);
    expect(refreshSourceInput.parse({ sourceId: id, placeSlug: "kings-heath" }).placeSlug).toBe(
      "kings-heath",
    );
  });
  it("rejects unknown statuses and non-uuid ids", () => {
    expect(() => moveConnectionInput.parse({ id, status: "approved" })).toThrow();
    expect(() => moveConnectionInput.parse({ id: "1 or 1=1", status: "sent" })).toThrow();
    expect(() => needIdInput.parse({ needId: "abc" })).toThrow();
  });
  it("rejects odd slugs and out-of-range days", () => {
    expect(() => refreshSourceInput.parse({ sourceId: id, placeSlug: "a,b.eq.x" })).toThrow();
    expect(() => refreshSourceInput.parse({ sourceId: id, placeSlug: "x", days: 999 })).toThrow();
  });
});


describe("createNeedInput runtime boundary", () => {
  it("accepts valid values, trims bounded text, and normalises category", () => {
    const parsed = createNeedInput.parse(validNeedDraft());
    expect(parsed.category).toBe("gardening");
    expect(parsed.title).toBe("Help with a garden");
    expect(parsed.required_skills).toEqual(["gardening"]);
  });

  it("rejects oversized text, oversized arrays, invalid numeric values, and unknown enums", () => {
    expect(() => createNeedInput.parse({ ...validNeedDraft(), title: "x".repeat(201) })).toThrow();
    expect(
      () => createNeedInput.parse({ ...validNeedDraft(), description: "x".repeat(4001) }),
    ).toThrow();
    expect(() =>
      createNeedInput.parse({
        ...validNeedDraft(),
        required_skills: Array.from({ length: 21 }, (_, i) => "skill-" + i),
      }),
    ).toThrow();
    expect(() => createNeedInput.parse({ ...validNeedDraft(), lat: 91 })).toThrow();
    expect(() => createNeedInput.parse({ ...validNeedDraft(), budget: -1 })).toThrow();
    expect(() => createNeedInput.parse({ ...validNeedDraft(), urgency: "immediately" })).toThrow();
  });

  it("rejects extra database-owned fields and malformed time ranges", () => {
    expect(() =>
      createNeedInput.parse({ ...validNeedDraft(), creator_id: "attacker-controlled" }),
    ).toThrow();
    expect(() =>
      createNeedInput.parse({
        ...validNeedDraft(),
        starts_at: null,
        ends_at: "2026-10-15T14:00:00.000Z",
      }),
    ).toThrow();
    expect(() =>
      createNeedInput.parse({
        ...validNeedDraft(),
        starts_at: "2026-10-15T14:00:00.000Z",
        ends_at: "2026-10-15T12:00:00.000Z",
      }),
    ).toThrow();
  });
});

describe("canonical place normalization for a posted need", () => {
  const canonicalPlace = {
    id: placeId,
    name: "Bristol",
    lat: 51.4545,
    lng: -2.5879,
    timezone: "Europe/London",
    currency: "GBP",
  };

  it("uses canonical place name, centre coordinates, timezone and currency", () => {
    const parsed = createNeedInput.parse(validNeedDraft());
    const safe = canonicalizeNeedPlace(parsed, canonicalPlace);
    expect(safe).toMatchObject({
      place_id: placeId,
      place_text: "Bristol",
      lat: 51.4545,
      lng: -2.5879,
      timezone: "Europe/London",
      currency: "GBP",
    });
  });

  it("refuses a missing or mismatched canonical place", () => {
    const parsed = createNeedInput.parse(validNeedDraft());
    expect(() => canonicalizeNeedPlace(parsed, null)).toThrow(/valid locality/i);
    expect(() =>
      canonicalizeNeedPlace(parsed, {
        ...canonicalPlace,
        id: "99999999-9999-4999-9999-999999999999",
      }),
    ).toThrow(/valid locality/i);
  });

  it("drops client coordinates and location labels when no canonical place is selected", () => {
    const parsed = createNeedInput.parse({
      ...validNeedDraft(),
      place_id: null,
      place_text: "My house at 12 High Street",
      lat: 51.5,
      lng: -0.1,
    });
    expect(canonicalizeNeedPlace(parsed, null)).toMatchObject({
      place_id: null,
      place_text: "Nearby",
      lat: null,
      lng: null,
      timezone: "UTC",
      currency: "EUR",
    });
  });
});
