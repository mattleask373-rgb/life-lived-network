import { describe, expect, it } from "vitest";
import { localityJsonLd, localityPageMeta } from "./locality-seo";

describe("locality SEO", () => {
  it("noindexes thin localities", () => {
    const head = localityPageMeta({
      name: "Sparse",
      countrySegment: "gb",
      slug: "sparse",
      realEntryCount: 0,
      indexable: false,
    });
    expect(head.meta).toContainEqual({ name: "robots", content: "noindex, follow" });
  });

  it("indexes localities with enough real records", () => {
    const head = localityPageMeta({
      name: "Bristol",
      countrySegment: "gb",
      slug: "bristol",
      blurb: "A real city.",
      realEntryCount: 5,
      indexable: true,
    });
    expect(head.meta).toContainEqual({ name: "robots", content: "index, follow" });
    expect(head.links[0]?.href).toContain("/gb/bristol");
  });

  it("emits Place JSON-LD without ratings", () => {
    const raw = localityJsonLd({
      name: "Bristol",
      countrySegment: "gb",
      slug: "bristol",
      realEntryCount: 5,
      indexable: true,
    });
    expect(raw).toContain("Place");
    expect(raw).toContain("Bristol");
    expect(raw).not.toContain("aggregateRating");
  });
});
