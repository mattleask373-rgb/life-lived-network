import { describe, expect, it } from "vitest";

import {
  SERVICE_CATEGORIES,
  categoriesOf,
  categoriesPresent,
  categoryBySlug,
  categoryOf,
  inCategory,
} from "./service-taxonomy";
import type { WorldEntry } from "./world-data";

function entry(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: overrides.id ?? "e1",
    layer: "work",
    title: "Something",
    place: "Somewhere",
    neighbourhood: "Somewhere",
    x: 50,
    y: 50,
    when: "Today",
    band: "today",
    minutes: 60,
    cost: 0,
    summary: "",
    details: [],
    host: "Someone",
    verified: false,
    social: "friendly",
    outdoors: false,
    organisation: "A practice",
    ...overrides,
  };
}

/** The same record, offered by nobody — not a service at all. */
function notAService(overrides: Partial<WorldEntry> = {}): WorldEntry {
  const { organisation: _unused, ...rest } = entry(overrides);
  return rest as WorldEntry;
}

describe("service taxonomy", () => {
  it("has unique, url-safe category slugs", () => {
    const slugs = SERVICE_CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it("trusts a declared category and says so", () => {
    const match = categoryOf(entry({ serviceCategory: "sports-massage", title: "An hour" }));
    expect(match?.category.slug).toBe("sports-massage");
    expect(match?.basis).toBe("declared");
  });

  it("recognises a category from the words the record itself uses", () => {
    const match = categoryOf(entry({ title: "Sports massage appointment" }));
    expect(match?.category.slug).toBe("sports-massage");
    expect(match?.basis).toBe("matched");
    expect(match?.evidence).toContain("sports massage");
  });

  it("prefers the more specific category when both words appear", () => {
    const matches = categoriesOf(entry({ title: "Wedding photography", summary: "photographer" }));
    expect(matches[0]?.category.slug).toBe("wedding-photography");
    expect(matches.some((m) => m.category.slug === "photography")).toBe(true);
  });

  it("places nothing it cannot recognise", () => {
    expect(categoryOf(entry({ title: "A quiet afternoon" }))).toBeNull();
    expect(inCategory(entry({ title: "A quiet afternoon" }), "yoga")).toBe(false);
  });

  it("never invents a category from an unknown declared slug", () => {
    expect(categoryBySlug("brain-surgery-kings-heath")).toBeNull();
    // Falls back to the record's own words rather than to a made-up category.
    expect(categoryOf(entry({ serviceCategory: "nonsense", title: "Gardening" }))?.category.slug).toBe(
      "gardening",
    );
  });

  it("lists only categories that genuinely contain something current", () => {
    const present = categoriesPresent([
      entry({ id: "a", title: "Osteopathy appointment" }),
      entry({ id: "b", title: "Osteopathic check-up" }),
      entry({ id: "c", title: "Yoga class", quality: "expired" }),
      entry({ id: "d", title: "Plumbing callout", cancellation: "cancelled" }),
      notAService({ id: "e", title: "Gardening hour" }),
    ]);
    const slugs = present.map((p) => p.category.slug);
    expect(slugs).toContain("osteopathy");
    expect(slugs).not.toContain("yoga");
    expect(slugs).not.toContain("plumbing");
    // Not offered as a service by anybody, so not a service category.
    expect(slugs).not.toContain("gardening");
    expect(present[0]?.entries).toHaveLength(2);
  });

  it("marks a category made only of trial records", () => {
    const present = categoriesPresent([
      entry({ id: "a", title: "Sports massage", demonstration: true }),
      entry({ id: "b", title: "Osteopathy", demonstration: false }),
    ]);
    expect(present.find((p) => p.category.slug === "sports-massage")?.demonstrationOnly).toBe(true);
    expect(present.find((p) => p.category.slug === "osteopathy")?.demonstrationOnly).toBe(false);
  });
});
