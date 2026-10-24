import { describe, expect, it } from "vitest";

import { buildPlaceIndex, type Place } from "./places";
import { filterEntriesByText, parseQuerySearch, planFrontDoor } from "./search-context";
import type { WorldEntry } from "./world-data";

function place(p: Partial<Place> & Pick<Place, "id" | "name" | "slug" | "kind">): Place {
  return {
    parent_id: null,
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: null,
    lng: null,
    blurb: "",
    ...p,
  };
}

const index = buildPlaceIndex([
  place({ id: "gb", name: "United Kingdom", slug: "united-kingdom", kind: "country" }),
  place({ id: "bham", name: "Birmingham", slug: "birmingham", kind: "city", parent_id: "gb" }),
  place({ id: "brx", name: "Brixton", slug: "brixton", kind: "neighbourhood", parent_id: "gb" }),
  place({ id: "nt1", name: "Newtown", slug: "newtown-powys", kind: "town", parent_id: "gb" }),
  place({ id: "nt2", name: "Newtown", slug: "newtown-wm", kind: "town", parent_id: "gb" }),
]);

/** What the router does: serialise search to a URL, read it back, validate. */
function roundTrip(search: Record<string, unknown>) {
  const url = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) if (typeof v === "string") url.set(k, v);
  return parseQuerySearch(Object.fromEntries(new URLSearchParams(url.toString())));
}

function locality(text: string) {
  const plan = planFrontDoor(index, text);
  if (plan.kind !== "locality") throw new Error(`expected locality, got ${plan.kind}`);
  return { ...plan.target, search: roundTrip({ ...plan.target.search }) };
}

describe("front door keeps place and query through the URL", () => {
  it("Drake Birmingham", () => {
    expect(locality("Drake Birmingham")).toEqual({
      params: { country: "gb", place: "birmingham" },
      search: { q: "Drake", from: "Drake Birmingham" },
    });
  });

  it("gardener Brixton", () => {
    expect(locality("gardener Brixton")).toEqual({
      params: { country: "gb", place: "brixton" },
      search: { q: "gardener", from: "gardener Brixton" },
    });
  });

  it("I need a gardener in Brixton", () => {
    expect(locality("I need a gardener in Brixton")).toEqual({
      params: { country: "gb", place: "brixton" },
      search: { q: "I need a gardener", from: "I need a gardener in Brixton" },
    });
  });

  it("no place named: falls back to the existing intent routing", () => {
    expect(planFrontDoor(index, "I need a gardener").kind).toBe("none");
    expect(planFrontDoor(index, "gardener Brix").kind).toBe("none");
  });

  it("ambiguous place: offers every candidate, picks none, keeps the text", () => {
    const plan = planFrontDoor(index, "gardener Newtown");
    expect(plan.kind).toBe("ambiguous");
    if (plan.kind !== "ambiguous") return;
    expect(plan.choices.map((c) => c.target.params.place).sort()).toEqual([
      "newtown-powys",
      "newtown-wm",
    ]);
    for (const c of plan.choices) {
      expect(roundTrip({ ...c.target.search })).toEqual({
        q: "gardener",
        from: "gardener Newtown",
      });
    }
  });
});

describe("parseQuerySearch", () => {
  it("drops non-strings and blanks, trims and caps length", () => {
    expect(parseQuerySearch({ q: 5, from: "   " })).toEqual({});
    expect(parseQuerySearch({ q: "  a   b " }).q).toBe("a b");
    expect(parseQuerySearch({ q: "x".repeat(500) }).q).toHaveLength(200);
  });

  it("preserves a known map layer and drops an unknown one", () => {
    expect(parseQuerySearch({ layer: "music" })).toEqual({ layer: "music" });
    expect(parseQuerySearch({ layer: "secret-inventory" })).toEqual({});
    expect(parseQuerySearch({ layer: ["work"] })).toEqual({});
  });
});

describe("filterEntriesByText", () => {
  const e = (id: string, title: string) =>
    ({ id, title, summary: "", host: "", details: [] }) as unknown as WorldEntry;
  const entries = [e("1", "Drake live at the arena"), e("2", "Garden swap")];

  it("is a plain all-words text filter that keeps order", () => {
    expect(filterEntriesByText(entries, "drake").map((x) => x.id)).toEqual(["1"]);
    expect(filterEntriesByText(entries, "gardener")).toEqual([]);
    expect(filterEntriesByText(entries, "")).toEqual([]);
  });
});

describe("need doorway keeps typed text", () => {
  it("'I need a gardener' round-trips to /need with q and from", async () => {
    const { classifyPossibilityIntent } = await import("./possibility-intent");
    const { intentTarget } = await import("./search-context");
    const text = "I need a gardener";
    expect(planFrontDoor(index, text).kind).toBe("none");
    const intent = classifyPossibilityIntent(text);
    expect(intent.href).toBe("/need");
    const t = intentTarget(intent.href, text);
    expect(t.to).toBe("/need");
    expect(roundTrip({ ...t.search })).toEqual({ q: text, from: text });
  });
  it("help, give, and journey preserve the typed text without interpreting it", async () => {
    const { intentTarget } = await import("./search-context");
    for (const [href, text] of [
      ["/help", "I can help with gardening"],
      ["/give", "I want to give an hour"],
      ["/journey", "I'm travelling next week"],
    ] as const) {
      const target = intentTarget(href, text);
      expect(target.to).toBe(href);
      expect(roundTrip({ ...target.search })).toEqual({ q: text, from: text });
    }
    expect(intentTarget("/", "Explore Birmingham")).toEqual({ to: "/" });
  });
  it("blank text adds no parameters to any destination", async () => {
    const { intentTarget } = await import("./search-context");
    expect(intentTarget("/help", "   ")).toEqual({ to: "/help" });
    expect(intentTarget("/give", "")).toEqual({ to: "/give" });
    expect(intentTarget("/journey", " ")).toEqual({ to: "/journey" });
  });
  it("blank text adds no params, so plain /need links are unchanged", async () => {
    const { intentTarget } = await import("./search-context");
    expect(intentTarget("/need", "   ")).toEqual({ to: "/need" });
    expect(parseQuerySearch({})).toEqual({});
  });
  it("a named place still wins over the need doorway", () => {
    expect(planFrontDoor(index, "I need a gardener in Brixton").kind).toBe("locality");
  });
});
