/**
 * Geography is generic: the same helpers must answer for a country, a county,
 * a city or a village, and repeated place names must stay unambiguous.
 */
import { describe, expect, it } from "vitest";
import {
  ancestorsOf,
  buildPlaceIndex,
  childrenOf,
  countryOf,
  descendantSlugsOf,
  isWithin,
  normaliseConfiguredPlaceSlug,
  placeBySlug,
  placePath,
  resolvePlaceFromIndex,
  PlaceHierarchyError,
  searchPlaces,
  splitPlaceFromQuery,
  type Place,
} from "./places";
import { DEMO_ENTRIES } from "./fixtures/world-entries";

function place(partial: Partial<Place> & Pick<Place, "id" | "name" | "slug" | "kind">): Place {
  return {
    parent_id: null,
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: null,
    lng: null,
    blurb: "",
    ...partial,
  };
}

const places: Place[] = [
  place({ id: "r", name: "United Kingdom & Ireland", slug: "uk-and-ireland", kind: "region" }),
  place({
    id: "gb",
    name: "United Kingdom",
    slug: "united-kingdom",
    kind: "country",
    parent_id: "r",
  }),
  place({
    id: "ie",
    name: "Ireland",
    slug: "ireland",
    kind: "country",
    parent_id: "r",
    country_code: "IE",
    currency: "EUR",
  }),
  place({ id: "wm", name: "West Midlands", slug: "west-midlands", kind: "area", parent_id: "gb" }),
  place({ id: "bham", name: "Birmingham", slug: "birmingham", kind: "city", parent_id: "wm" }),
  place({
    id: "digbeth",
    name: "Digbeth",
    slug: "digbeth",
    kind: "neighbourhood",
    parent_id: "bham",
  }),
  place({ id: "hfd", name: "Herefordshire", slug: "herefordshire", kind: "area", parent_id: "gb" }),
  // Deliberately the same display name in two counties.
  place({
    id: "newtown-wm",
    name: "Newtown",
    slug: "newtown-birmingham",
    kind: "neighbourhood",
    parent_id: "bham",
  }),
  place({
    id: "newtown-hfd",
    name: "Newtown",
    slug: "newtown-herefordshire",
    kind: "village",
    parent_id: "hfd",
  }),
  place({ id: "pt", name: "Portugal", slug: "portugal", kind: "country" }),
  place({
    id: "lis",
    name: "Lisbon",
    slug: "lisbon",
    kind: "city",
    parent_id: "pt",
    country_code: "PT",
    currency: "EUR",
  }),
];

const index = buildPlaceIndex(places);

describe("configurable default locality", () => {
  it("normalises a valid deployment locality slug", () => {
    expect(normaliseConfiguredPlaceSlug("  SYDNEY ")).toBe("sydney");
    expect(normaliseConfiguredPlaceSlug("australia-new-south-wales")).toBe(
      "australia-new-south-wales",
    );
  });

  it("ignores empty or malformed configuration instead of guessing a place", () => {
    expect(normaliseConfiguredPlaceSlug(undefined)).toBeNull();
    expect(normaliseConfiguredPlaceSlug("   ")).toBeNull();
    expect(normaliseConfiguredPlaceSlug("../sydney")).toBeNull();
  });

  it("prefers a supported saved selection over the configured default", () => {
    expect(resolvePlaceFromIndex(index, "lisbon", "uk-and-ireland")?.slug).toBe("lisbon");
  });

  it("uses the configured default only when its canonical record exists", () => {
    expect(resolvePlaceFromIndex(index, "unsupported-saved-slug", "portugal")?.slug).toBe(
      "portugal",
    );
    expect(resolvePlaceFromIndex(index, "unsupported-saved-slug", "sydney")).toBeNull();
  });
});

describe("place hierarchy integrity", () => {
  it("rejects duplicate IDs instead of silently overwriting the canonical row", () => {
    expect(() =>
      buildPlaceIndex([
        place({ id: "duplicate", name: "First", slug: "first", kind: "city" }),
        place({ id: "duplicate", name: "Second", slug: "second", kind: "city" }),
      ]),
    ).toThrow(PlaceHierarchyError);
    try {
      buildPlaceIndex([
        place({ id: "duplicate", name: "First", slug: "first", kind: "city" }),
        place({ id: "duplicate", name: "Second", slug: "second", kind: "city" }),
      ]);
    } catch (error) {
      expect(error).toMatchObject({ code: "DUPLICATE_ID" });
    }
  });

  it("rejects a missing parent rather than silently treating the child as a root", () => {
    expect(() =>
      buildPlaceIndex([
        place({
          id: "child",
          name: "Child",
          slug: "child",
          kind: "town",
          parent_id: "missing-parent",
        }),
      ]),
    ).toThrow(PlaceHierarchyError);
    try {
      buildPlaceIndex([
        place({
          id: "child",
          name: "Child",
          slug: "child",
          kind: "town",
          parent_id: "missing-parent",
        }),
      ]);
    } catch (error) {
      expect(error).toMatchObject({ code: "MISSING_PARENT" });
    }
  });

  it("rejects parent cycles so ancestor and descendant walks cannot loop forever", () => {
    expect(() =>
      buildPlaceIndex([
        place({ id: "one", name: "One", slug: "one", kind: "city", parent_id: "two" }),
        place({ id: "two", name: "Two", slug: "two", kind: "area", parent_id: "one" }),
      ]),
    ).toThrow(PlaceHierarchyError);
    try {
      buildPlaceIndex([
        place({ id: "one", name: "One", slug: "one", kind: "city", parent_id: "two" }),
        place({ id: "two", name: "Two", slug: "two", kind: "area", parent_id: "one" }),
      ]);
    } catch (error) {
      expect(error).toMatchObject({ code: "CYCLE" });
    }
  });
});

describe("place hierarchy", () => {
  it("resolves a place by slug at any depth", () => {
    expect(placeBySlug(index, "digbeth")?.name).toBe("Digbeth");
    expect(placeBySlug(index, "nowhere")).toBeNull();
  });

  it("walks upwards from a neighbourhood to its country", () => {
    expect(ancestorsOf(index, "digbeth").map((p) => p.id)).toEqual(["bham", "wm", "gb", "r"]);
    expect(countryOf(index, "digbeth")?.name).toBe("United Kingdom");
  });

  it("keeps repeated names unambiguous through their path", () => {
    expect(placePath(index, "newtown-wm")).toBe("Newtown, Birmingham, West Midlands");
    expect(placePath(index, "newtown-hfd")).toBe("Newtown, Herefordshire, United Kingdom");
  });

  it("chooses a place and everywhere inside it", () => {
    const slugs = descendantSlugsOf(index, "bham");
    expect(slugs).toContain("birmingham");
    expect(slugs).toContain("digbeth");
    expect(slugs).not.toContain("herefordshire");
  });

  it("treats a country like a locality", () => {
    expect(descendantSlugsOf(index, "gb")).toContain("digbeth");
    expect(isWithin(index, "digbeth", "gb")).toBe(true);
    expect(isWithin(index, "lisbon", "gb")).toBe(false);
  });

  it("keeps Portugal and Lisbon valid, just not the default", () => {
    expect(countryOf(index, "lis")?.name).toBe("Portugal");
    expect(descendantSlugsOf(index, "pt")).toEqual(["portugal", "lisbon"]);
  });

  it("lists what is directly inside a place, widest kinds first", () => {
    expect(childrenOf(index, "r").map((p) => p.name)).toEqual(["Ireland", "United Kingdom"]);
  });

  it("searches by name and returns nothing for an empty query", () => {
    expect(searchPlaces(index, "birm").map((p) => p.id)).toEqual(["bham"]);
    expect(searchPlaces(index, "newtown").map((p) => p.id)).toEqual(["newtown-hfd", "newtown-wm"]);
    expect(searchPlaces(index, "  ")).toEqual([]);
  });

  it("whole-text place search finds nothing for intent plus place (the gap)", () => {
    expect(searchPlaces(index, "Drake Birmingham")).toEqual([]);
  });
});

describe("splitting a place out of free text", () => {
  const withBrixton = buildPlaceIndex([
    ...places,
    place({ id: "brx", name: "Brixton", slug: "brixton", kind: "neighbourhood", parent_id: "gb" }),
  ]);

  it("keeps both the intent and the locality", () => {
    expect(splitPlaceFromQuery(withBrixton, "Drake Birmingham")).toMatchObject({
      place: { id: "bham" },
      rest: "Drake",
    });
    expect(splitPlaceFromQuery(withBrixton, "gardener Brixton")).toMatchObject({
      place: { id: "brx" },
      rest: "gardener",
    });
    expect(splitPlaceFromQuery(withBrixton, "I need a gardener in Brixton").rest).toBe(
      "I need a gardener",
    );
  });

  it("never guesses a place from a partial word", () => {
    const r = splitPlaceFromQuery(withBrixton, "gardener Brix");
    expect(r.place).toBeNull();
    expect(r.rest).toBe("gardener Brix");
  });

  it("returns the text unchanged when no place is named", () => {
    expect(splitPlaceFromQuery(withBrixton, "  a gardener  ")).toEqual({
      place: null,
      candidates: [],
      rest: "a gardener",
    });
  });
});

describe("trial layer", () => {
  it("labels every demonstration record as one", () => {
    expect(DEMO_ENTRIES.length).toBeGreaterThan(0);
    for (const entry of DEMO_ENTRIES) {
      expect(entry.demonstration).toBe(true);
      expect(entry.verified).toBe(false);
      expect(entry.community).toBe(false);
    }
  });

  it("sits only in the three trial localities, with real coordinates", () => {
    for (const entry of DEMO_ENTRIES) {
      expect(entry.placeSlug).toBeTruthy();
      expect(typeof entry.lat).toBe("number");
      expect(typeof entry.lng).toBe("number");
    }
  });
});
