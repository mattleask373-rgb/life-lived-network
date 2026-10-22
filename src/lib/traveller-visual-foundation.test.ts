import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("traveller-facing journey and road-trip surfaces", () => {
  it("keeps journey choices and actions readable and comfortably tappable", () => {
    const src = read("routes/journey.tsx");
    expect(src).toContain("font-display text-4xl leading-tight tracking-tight sm:text-5xl");
    expect(src).toContain("inline-flex min-h-11 items-center rounded-full border px-4 py-2");
    expect(src).toContain("rounded-3xl p-5 shadow-paper sm:p-7");
    expect(src).toContain("flex min-h-11 flex-col justify-center text-left");
  });

  it("uses source-backed photos or a clearly labelled neutral fallback on road-trip results", () => {
    const src = read("routes/road-trip.tsx");
    expect(src).toContain("const photo = cardPhoto(entry);");
    expect(src).toContain('loading="lazy"');
    expect(src).toContain("NO_PHOTO_LABEL");
    expect(src).toContain('role="img"');
    expect(src).toContain("Photo: {photo.credit}");
    expect(src).toContain("Nothing found along this route");
  });

  it("keeps trip inputs and action targets usable on touch devices", () => {
    const src = read("routes/road-trip.tsx");
    expect(src).toContain('label="Setting off from"');
    expect(src).toContain('label="Heading to"');
    expect(src).toContain("min-h-11 w-full rounded-2xl");
    expect(src).toContain("aria-pressed={mode === option.id}");
    expect(src).toContain('aria-label={`Remove ${stop.title}`}');
    expect(src).toContain('className="min-h-11 rounded-full"');
  });
});
