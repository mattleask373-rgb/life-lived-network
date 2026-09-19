import { describe, expect, it } from "vitest";

import { rowToEntry, type ListingRow } from "./listings";

const row: ListingRow = {
  id: "abc",
  creator_id: "user-1",
  kind: "event",
  layer: "not-a-layer",
  title: "A rehearsal anyone can sit in on",
  summary: "Three of us practising in a garage.",
  details: ["Bring nothing"],
  place: "",
  neighbourhood: "",
  x: 40,
  y: 55,
  place_id: null,
  lat: null,
  lng: null,
  when_text: "Thursday evening",
  band: "someday",
  minutes: 90,
  cost: 0,
  currency: "EUR",
  give: null,
  social: "unclear",
  outdoors: false,
  skills: [],
  people_needed: 2,
  contact_note: null,
  accessibility: null,
  status: "published",
  data_quality: "unchecked",
};

describe("rowToEntry is the single normalisation seam", () => {
  it("turns an unknown database shape into a safe domain entity", () => {
    const entry = rowToEntry(row);
    expect(entry.layer).toBe("experience");
    expect(entry.band).toBe("today");
    expect(entry.social).toBe("friendly");
    expect(entry.quality).toBe("unchecked");
    expect(entry.verified).toBe(false);
  });

  it("never leaves a person's location blank or invents an address", () => {
    const entry = rowToEntry(row);
    expect(entry.place).toBe("Shared once you say you're coming");
    expect(entry.neighbourhood).toBe("Nearby");
  });

  it("attributes a listing to its author only when the author is discoverable", () => {
    expect(rowToEntry(row).host).toBe("Posted by someone here");
    expect(rowToEntry(row, "Inês").host).toContain("Inês");
  });

  it("keeps declared capacity visible in the details", () => {
    expect(rowToEntry(row).details).toContain("Room for 2 people");
  });
});
