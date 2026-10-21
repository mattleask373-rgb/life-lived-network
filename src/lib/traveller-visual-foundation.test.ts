import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("Grok traveller-facing visual foundation", () => {
  it("keeps journey preferences easy to read and tap", () => {
    const src = read("routes/journey.tsx");
    expect(src).toContain("font-display text-4xl leading-tight tracking-tight sm:text-5xl");
    expect(src).toContain("inline-flex min-h-11 items-center rounded-full border px-4 py-2");
    expect(src).toContain("rounded-3xl p-5 shadow-paper sm:p-7");
  });

  it("uses real source photos or an honest neutral fallback on route discoveries", () => {
    const src = read("routes/road-trip.tsx");
    expect(src).toContain("const photo = cardPhoto(entry);");
    expect(src).toContain('loading="lazy"');
    expect(src).toContain("NO_PHOTO_LABEL");
    expect(src).toContain("Photo: {photo.credit}");
    expect(src).toContain('role="img"');
    expect(src).toContain("Nothing found along this route");
  });

  it("keeps trip inputs, route context and actions accessible", () => {
    const src = read("routes/road-trip.tsx");
    expect(src).toContain('label="Setting off from"');
    expect(src).toContain('label="Heading to"');
    expect(src).toContain("min-h-11 w-full rounded-2xl");
    expect(src).toContain("aria-pressed={mode === option.id}");
    expect(src).toContain("aria-label={`Remove ${stop.title}`}");
  });
});
