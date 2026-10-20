import { describe, expect, it } from "vitest";

import {
  breadcrumbListSchema,
  eventSchema,
  localBusinessSchema,
  safeJsonLd,
} from "./structured-data";
import type { WorldEntry } from "./world-data";

describe("BreadcrumbList structured data", () => {
  it("uses canonical absolute item URLs and sequential positions", () => {
    const schema = breadcrumbListSchema([
      { name: "Real World Atlas", path: "/" },
      { name: "Example Place", path: "/gb/example-place?utm_source=test" },
    ]);

    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Real World Atlas",
        item: expect.stringMatching(/\/$/),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Example Place",
        item: expect.stringMatching(/\/gb\/example-place$/),
      },
    ]);
  });

  it("drops blank crumbs and escapes script-closing text before embedding", () => {
    const schema = breadcrumbListSchema([
      { name: " ", path: "/" },
      { name: "Example </script><script>alert(1)</script>", path: "/gb/example" },
    ]);
    const embedded = safeJsonLd(schema);

    expect(schema.itemListElement).toHaveLength(1);
    expect(embedded).not.toContain("</script>");
    expect(embedded).toContain("\\u003c/script>");
  });
});

function verifiedEntry(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "event-1",
    layer: "music",
    title: "Evening concert",
    place: "Town Hall",
    neighbourhood: "Town centre",
    x: 20,
    y: 35,
    when: "tonight",
    band: "tonight",
    minutes: 120,
    cost: 0,
    summary: "A concert with published details.",
    details: [],
    host: "A recorded organiser",
    verified: true,
    social: "friendly",
    outdoors: false,
    kind: "event",
    quality: "verified",
    startsAt: "2026-11-10T18:00:00+11:00",
    endsAt: "2026-11-10T20:00:00+11:00",
    timezone: "Australia/Sydney",
    origin: "resident",
    ...overrides,
  };
}

describe("Event structured data", () => {
  it("uses verified facts and keeps the stored place label without inventing an address", () => {
    const schema = eventSchema(verifiedEntry());
    expect(schema).toMatchObject({
      "@type": "Event",
      name: "Evening concert",
      startDate: "2026-11-10T07:00:00.000Z",
      endDate: "2026-11-10T09:00:00.000Z",
      location: { "@type": "Place", name: "Town Hall" },
    });
    expect(schema).not.toHaveProperty("offers");
    expect(schema).not.toHaveProperty("organizer");
    expect(schema).not.toHaveProperty("location.address");
  });

  it("fails closed for demo, unverified, cancelled, undated, timezone-invalid, or generic-place entries", () => {
    expect(eventSchema(verifiedEntry({ demonstration: true }))).toBeNull();
    expect(eventSchema(verifiedEntry({ verified: false }))).toBeNull();
    expect(eventSchema(verifiedEntry({ cancellation: "postponed" }))).toBeNull();
    expect(eventSchema(verifiedEntry({ startsAt: "2026-11-10T18:00:00" }))).toBeNull();
    expect(eventSchema(verifiedEntry({ timezone: "Not/A_Real_Zone" }))).toBeNull();
    expect(eventSchema(verifiedEntry({ place: "Shared once you say you're coming" }))).toBeNull();
    expect(
      eventSchema(
        verifiedEntry({
          startsAt: "2026-11-10T18:00:00+11:00",
          endsAt: "2026-11-10T17:00:00+11:00",
        }),
      ),
    ).toBeNull();
  });
});

describe("LocalBusiness structured data", () => {
  const group = (entry: WorldEntry) => ({
    organisation: "Harbour Studio",
    entries: [entry],
  });

  it("requires a verified current record and explicit public URL without inventing address", () => {
    const schema = localBusinessSchema(
      group(
        verifiedEntry({
          kind: "service",
          title: "Studio classes",
          organisation: "Harbour Studio",
          sourceUrl: "https://example.org/studio",
          bookingUrl: "https://example.org/book",
        }),
      ),
      "Byron Bay",
    );
    expect(schema).toMatchObject({
      "@type": "LocalBusiness",
      name: "Harbour Studio",
      url: "https://example.org/book",
      areaServed: { "@type": "Place", name: "Byron Bay" },
    });
    expect(schema).not.toHaveProperty("address");
    expect(schema).not.toHaveProperty("geo");
  });

  it("omits structured data when identity, verification, or public URL is missing", () => {
    expect(
      localBusinessSchema({ organisation: "", entries: [verifiedEntry()] }, "Byron Bay"),
    ).toBeNull();
    expect(
      localBusinessSchema(
        group(verifiedEntry({ verified: false, sourceUrl: "https://example.org" })),
        "Byron Bay",
      ),
    ).toBeNull();
    expect(
      localBusinessSchema(
        group(verifiedEntry({ kind: "service", organisation: "Harbour Studio" })),
        "Byron Bay",
      ),
    ).toBeNull();
    expect(
      localBusinessSchema(
        group(verifiedEntry({ kind: "service", sourceUrl: "javascript:alert(1)" })),
        "Byron Bay",
      ),
    ).toBeNull();
  });
});
