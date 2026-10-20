import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync("src/styles.css", "utf8");
const entryCard = readFileSync("src/components/entry-card.tsx", "utf8");
const placePicker = readFileSync("src/components/place-picker.tsx", "utf8");

describe("Grok visual foundation integration", () => {
  it("uses the loaded Manrope body face and Fraunces display face", () => {
    expect(styles).toContain('--font-sans: "Manrope"');
    expect(styles).toContain('--font-display: "Fraunces"');
  });

  it("keeps the prototype's paper, cream and forest colour anchors", () => {
    expect(styles).toContain("--paper: #f3f0e8");
    expect(styles).toContain("--card: #fffcf7");
    expect(styles).toContain("--ink: #1b1916");
    expect(styles).toContain("--border: #e4ded3");
    expect(styles).toContain("--primary: #0c6b56");
    expect(styles).toContain("--sage: #e3f2eb");
  });

  it("renders only source-backed photos and an explicit honest fallback", () => {
    expect(entryCard).toContain("entry.photos?.find");
    expect(entryCard).toContain("No photo supplied");
    expect(entryCard).toContain("Photo: {photo.credit}");
    expect(entryCard).toContain("<TrustChip entry={entry} />");
    expect(entryCard).toContain("Demonstration");
    expect(entryCard).not.toContain("@/data/atlas");
    expect(entryCard).not.toContain("listing.image");
  });

  it("keeps place browsing searchable, honest and reachable with touch targets", () => {
    expect(placePicker).toContain('aria-label="Place search results"');
    expect(placePicker).toContain('role="status"');
    expect(placePicker).toContain("min-h-12");
    expect(placePicker).toContain("min-h-11");
    expect(placePicker).not.toContain("@/data/atlas");
  });
});
