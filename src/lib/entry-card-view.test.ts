import { describe, expect, it } from "vitest";
import { cardPhoto } from "./entry-card-view";

const p = (o: Partial<{ url: string; alt: string; credit: string }> = {}) => ({
  url: "https://example.org/a.jpg",
  sourceUrl: "https://example.org",
  credit: "Jo Bloggs",
  alt: "Garden at dusk",
  ...o,
});

describe("cardPhoto", () => {
  it("returns null when no photos are supplied", () => {
    expect(cardPhoto({ title: "T" })).toBeNull();
    expect(cardPhoto({ title: "T", photos: [] })).toBeNull();
  });

  it("skips photos without a URL rather than inventing one", () => {
    expect(cardPhoto({ title: "T", photos: [p({ url: " " })] })).toBeNull();
  });

  it("uses the source alt text and credit", () => {
    expect(cardPhoto({ title: "T", photos: [p()] })).toEqual({
      url: "https://example.org/a.jpg",
      alt: "Garden at dusk",
      credit: "Jo Bloggs",
    });
  });

  it("falls back to a truthful alt when the source gave none", () => {
    expect(cardPhoto({ title: "Choir", photos: [p({ alt: "" })] })?.alt).toBe(
      "Photo supplied with “Choir”",
    );
  });
});
