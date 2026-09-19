/**
 * UK-wide geography.
 *
 * The point of these tests is that there is no Kings Heath code, no Birmingham
 * code and no London code — only one set of helpers answering for whatever
 * locality data exists. The fixture below mirrors the shape of the real
 * dataset: a world region holding separate countries, nations inside the United
 * Kingdom, differing administrative layers per nation, cities, towns, villages
 * and neighbourhoods, and repeated names kept apart by their path.
 */
import { describe, expect, it } from "vitest";
import {
  ancestorsOf,
  buildPlaceIndex,
  countryOf,
  descendantSlugsOf,
  isWithin,
  placeBySlug,
  placePath,
  searchPlaces,
  type Place,
  type PlaceKind,
} from "./places";

function p(
  id: string,
  name: string,
  kind: PlaceKind,
  parent_id: string | null,
  overrides: Partial<Place> = {},
): Place {
  return {
    id,
    slug: id,
    name,
    kind,
    parent_id,
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: null,
    lng: null,
    blurb: "",
    ...overrides,
  };
}

const ie = { country_code: "IE", currency: "EUR", timezone: "Europe/Dublin" };

const places: Place[] = [
  p("uk-and-ireland", "United Kingdom & Ireland", "region", null),
  // Two separate countries. Neither is inside the other.
  p("united-kingdom", "United Kingdom", "country", "uk-and-ireland"),
  p("ireland", "Ireland", "country", "uk-and-ireland", ie),

  // Nations of the UK, each free to use its own administrative layer.
  p("england", "England", "region", "united-kingdom"),
  p("scotland", "Scotland", "region", "united-kingdom"),
  p("wales", "Wales", "region", "united-kingdom"),
  p("northern-ireland", "Northern Ireland", "region", "united-kingdom"),

  // England: counties and metropolitan areas.
  p("west-midlands", "West Midlands", "area", "england"),
  p("birmingham", "Birmingham", "city", "west-midlands"),
  p("kings-heath", "Kings Heath", "neighbourhood", "birmingham"),
  p("moseley", "Moseley", "neighbourhood", "birmingham"),
  p("coventry", "Coventry", "city", "west-midlands"),
  p("greater-london", "Greater London", "area", "england"),
  p("london", "London", "city", "greater-london"),
  p("peckham", "Peckham", "neighbourhood", "london"),
  p("greater-manchester", "Greater Manchester", "area", "england"),
  p("manchester", "Manchester", "city", "greater-manchester"),
  p("chorlton", "Chorlton", "neighbourhood", "manchester"),
  p("west-of-england", "West of England", "area", "england"),
  p("bristol", "Bristol", "city", "west-of-england"),
  p("merseyside", "Merseyside", "area", "england"),
  p("liverpool", "Liverpool", "city", "merseyside"),
  p("west-yorkshire", "West Yorkshire", "area", "england"),
  p("leeds", "Leeds", "city", "west-yorkshire"),
  p("south-yorkshire", "South Yorkshire", "area", "england"),
  p("sheffield", "Sheffield", "city", "south-yorkshire"),
  p("nottinghamshire", "Nottinghamshire", "area", "england"),
  p("nottingham", "Nottingham", "city", "nottinghamshire"),
  p("leicestershire", "Leicestershire", "area", "england"),
  p("leicester", "Leicester", "city", "leicestershire"),
  p("tyne-and-wear", "Tyne and Wear", "area", "england"),
  p("newcastle-upon-tyne", "Newcastle upon Tyne", "city", "tyne-and-wear"),
  p("hampshire", "Hampshire", "area", "england"),
  p("southampton", "Southampton", "city", "hampshire"),
  p("herefordshire", "Herefordshire", "area", "england"),
  p("kington", "Kington", "town", "herefordshire"),
  p("weobley", "Weobley", "village", "herefordshire"),

  // Scotland: council areas rather than counties.
  p("city-of-edinburgh", "City of Edinburgh", "area", "scotland"),
  p("edinburgh", "Edinburgh", "city", "city-of-edinburgh"),
  p("leith", "Leith", "neighbourhood", "edinburgh"),
  p("glasgow-city", "Glasgow City", "area", "scotland"),
  p("glasgow", "Glasgow", "city", "glasgow-city"),
  p("aberdeen-city", "Aberdeen City", "area", "scotland"),
  p("aberdeen", "Aberdeen", "city", "aberdeen-city"),

  // Wales.
  p("cardiff-area", "Cardiff", "area", "wales", { slug: "cardiff-area" }),
  p("cardiff", "Cardiff", "city", "cardiff-area"),
  p("swansea-area", "Swansea", "area", "wales", { slug: "swansea-area" }),
  p("swansea", "Swansea", "city", "swansea-area"),

  // Northern Ireland: local government districts.
  p("belfast-area", "Belfast", "area", "northern-ireland", { slug: "belfast-area" }),
  p("belfast", "Belfast", "city", "belfast-area"),
  p("derry-city-and-strabane", "Derry City and Strabane", "area", "northern-ireland"),
  p("derry", "Derry", "city", "derry-city-and-strabane"),

  // Republic of Ireland, unchanged by any of the above.
  p("leinster", "Leinster", "region", "ireland", ie),
  p("county-dublin", "County Dublin", "area", "leinster", ie),
  p("dublin", "Dublin", "city", "county-dublin", ie),

  // The rest of the world still works the same way.
  p("portugal", "Portugal", "country", null, { country_code: "PT", currency: "EUR", timezone: "Europe/Lisbon" }),
  p("lisbon", "Lisbon", "city", "portugal", { country_code: "PT", currency: "EUR", timezone: "Europe/Lisbon" }),
];

const index = buildPlaceIndex(places);

const CITIES = [
  "birmingham",
  "london",
  "manchester",
  "bristol",
  "liverpool",
  "leeds",
  "sheffield",
  "nottingham",
  "leicester",
  "coventry",
  "newcastle-upon-tyne",
  "southampton",
  "edinburgh",
  "glasgow",
  "aberdeen",
  "cardiff",
  "swansea",
  "belfast",
  "derry",
];

describe("UK-wide localities", () => {
  it("resolves every priority city through the same helper", () => {
    for (const slug of CITIES) {
      expect(placeBySlug(index, slug), slug).not.toBeNull();
      expect(countryOf(index, slug)?.name, slug).toBe("United Kingdom");
    }
  });

  it("keeps Dublin in Ireland and Lisbon in Portugal", () => {
    expect(countryOf(index, "dublin")?.name).toBe("Ireland");
    expect(countryOf(index, "lisbon")?.name).toBe("Portugal");
  });

  it("never makes the United Kingdom a parent of the Republic of Ireland", () => {
    expect(isWithin(index, "ireland", "united-kingdom")).toBe(false);
    expect(isWithin(index, "dublin", "united-kingdom")).toBe(false);
    expect(descendantSlugsOf(index, "united-kingdom")).not.toContain("dublin");
    // They do share the world region the app opens on.
    expect(isWithin(index, "dublin", "uk-and-ireland")).toBe(true);
    expect(isWithin(index, "birmingham", "uk-and-ireland")).toBe(true);
  });

  it("keeps Kings Heath inside Birmingham, the West Midlands, England and the UK", () => {
    expect(ancestorsOf(index, "kings-heath").map((x) => x.name)).toEqual([
      "Birmingham",
      "West Midlands",
      "England",
      "United Kingdom",
      "United Kingdom & Ireland",
    ]);
    expect(placePath(index, "kings-heath")).toBe("Kings Heath, Birmingham, West Midlands");
  });

  it("widens and narrows discovery through the same descendant walk", () => {
    const heath = descendantSlugsOf(index, "kings-heath");
    expect(heath).toEqual(["kings-heath"]);

    const city = descendantSlugsOf(index, "birmingham");
    expect(city).toContain("kings-heath");
    expect(city).toContain("moseley");
    expect(city).not.toContain("coventry");

    const county = descendantSlugsOf(index, "west-midlands");
    expect(county).toContain("kings-heath");
    expect(county).toContain("coventry");
    expect(county).not.toContain("london");

    const nation = descendantSlugsOf(index, "england");
    expect(nation).toContain("kings-heath");
    expect(nation).toContain("peckham");
    expect(nation).not.toContain("edinburgh");

    const uk = descendantSlugsOf(index, "united-kingdom");
    for (const slug of CITIES) expect(uk, slug).toContain(slug);
  });

  it("supports different administrative layers per nation without special cases", () => {
    expect(ancestorsOf(index, "leith").map((x) => x.kind)).toEqual([
      "city",
      "area",
      "region",
      "country",
      "region",
    ]);
    expect(ancestorsOf(index, "derry").map((x) => x.name)).toEqual([
      "Derry City and Strabane",
      "Northern Ireland",
      "United Kingdom",
      "United Kingdom & Ireland",
    ]);
  });

  it("keeps a district and the city of the same name apart", () => {
    expect(searchPlaces(index, "cardiff").map((x) => x.slug)).toEqual([
      "cardiff-area",
      "cardiff",
    ]);
    expect(placePath(index, "cardiff")).toBe("Cardiff, Cardiff, Wales");
  });

  it("finds towns and villages, not only cities", () => {
    expect(searchPlaces(index, "kington").map((x) => x.kind)).toEqual(["town"]);
    expect(searchPlaces(index, "weobley").map((x) => x.kind)).toEqual(["village"]);
    expect(isWithin(index, "weobley", "england")).toBe(true);
  });

  it("returns a bounded number of search results however large the world grows", () => {
    expect(searchPlaces(index, "a", 5).length).toBeLessThanOrEqual(5);
  });
});
