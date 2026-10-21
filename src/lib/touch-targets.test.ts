import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// No DOM test library is installed, so this guards the source classes that
// give the detail panel's controls a 44px touch target on phones.
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

describe("detail panel touch targets", () => {
  it("dialog close button is 44px", () => {
    const src = read("components/ui/dialog.tsx");
    expect(src).toMatch(/DialogPrimitive\.Close className="[^"]*\bh-11 w-11\b/);
  });
  it("save and go buttons are at least 44px tall", () => {
    const src = read("components/entry-sheet.tsx");
    expect(src).toMatch(/min-h-11 rounded-full px-4 py-2 text-sm transition-colors/);
    expect(src).toMatch(/min-h-11 rounded-full border border-border bg-card px-4 py-2 text-sm/);
  });

  it("keeps map pins and controls comfortably tappable", () => {
    const src = read("components/living-map.tsx");
    expect(src).toContain("h-11 w-11 -translate-x-1/2 -translate-y-full");
    expect(src).toContain(
      "grid h-11 w-11 place-items-center rounded-full border border-border bg-card shadow-lift",
    );
    expect(src).toContain(
      'aria-label={centreName ? `Map around ${centreName}` : "Map of recorded places"}',
    );
  });

  it("sets the Grok visual type and warm paper/cream/forest palette", () => {
    const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    expect(styles).toContain('--font-sans: "Manrope"');
    expect(styles).toContain("--paper: #f3f0e8");
    expect(styles).toContain("--card: #fffcf7");
    expect(styles).toContain("--primary: #0c6b56");
    expect(styles).toContain("--sage: #e3f2eb");
    // Keep the shared shadcn accent semantic as a readable action colour.
    expect(styles).toContain("--accent: oklch(0.652 0.132 46)");
    expect(styles).toContain("--accent-foreground: oklch(0.985 0.012 92)");
  });
});
