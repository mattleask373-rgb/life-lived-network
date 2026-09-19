/**
 * DEMONSTRATION / DEVELOPMENT FIXTURE source.
 *
 * The live provider credential is not configured yet, so the machinery is
 * proven with payloads shaped exactly like a real provider's. They travel the
 * same road as live data would:
 *
 *   fixture -> adapter -> normalise -> sanitise -> resolve place -> dedupe ->
 *   provenance -> freshness -> policy -> canonical activity -> discovery
 *
 * There is no shortcut from here to the interface. Nothing in this file is a
 * real event, and everything imported through it is stored and shown as a
 * demonstration record.
 */

import type { SourceAdapter } from "./contract";
import { ticketmasterAdapter } from "./ticketmaster";

export const FIXTURE_SOURCE_KEY = "development-fixture-feed";
export const FIXTURE_LABEL = "DEMONSTRATION / DEVELOPMENT FIXTURE";

export interface FixtureRequest {
  /** Approximate locality centre, from the hierarchy. Never an address. */
  lat: number | null;
  lng: number | null;
  /** The locality's own name, used only as the fixture venue's town. */
  localityName: string;
  timezone: string;
  now?: Date;
}

function at(now: Date, dayOffset: number, hour: number): string {
  const date = new Date(now.getTime() + dayOffset * 86400000);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function event(fields: Record<string, unknown>): Record<string, unknown> {
  return fields;
}

/**
 * A provider-shaped payload covering the cases that actually break pipelines:
 * a plain event, an event with an image, one with no description, a cancelled
 * one, a postponed one, one already finished, an exact duplicate, a
 * near-duplicate, a malformed record, an unsafe link, and one with no
 * coordinates.
 */
export function fixturePayload(request: FixtureRequest): unknown {
  const now = request.now ?? new Date();
  const town = request.localityName || "the locality";
  const lat = request.lat;
  const lng = request.lng;
  const location =
    lat === null || lng === null ? {} : { latitude: String(lat), longitude: String(lng) };
  const venue = { name: `${town} demonstration hall`, city: { name: town }, location };
  const timezone = request.timezone || "Europe/London";

  const primaryStart = at(now, 2, 19);

  return {
    _embedded: {
      events: [
        // The investor demonstration event for the selected locality.
        event({
          id: "fixture-evening-music",
          name: `${FIXTURE_LABEL} — an evening of live music in ${town}`,
          info: "A demonstration record showing how an event from an outside source arrives, carrying its own source, times and venue.",
          pleaseNote: "Demonstration fixture. Not a real event and nothing here is bookable.",
          url: "https://example.org/fixtures/evening-music",
          dates: {
            start: { dateTime: primaryStart },
            end: { dateTime: at(now, 2, 22) },
            timezone,
            status: { code: "onsale" },
          },
          classifications: [{ segment: { name: "Music" } }],
          priceRanges: [{ min: 12, currency: "GBP" }],
          _embedded: { venues: [venue], attractions: [{ name: "A demonstration ensemble" }] },
        }),
        // Permitted imagery, kept at the source with its credit.
        event({
          id: "fixture-with-image",
          name: `${FIXTURE_LABEL} — a daytime exhibition in ${town}`,
          info: "A demonstration record that also offers a picture, so image rights and credit can be proven.",
          url: "https://example.org/fixtures/exhibition",
          images: [{ url: "https://example.org/fixtures/exhibition.jpg", width: 1024 }],
          dates: { start: { dateTime: at(now, 3, 11) }, timezone, status: { code: "onsale" } },
          classifications: [{ segment: { name: "Arts & Theatre" } }],
          _embedded: { venues: [venue] },
        }),
        // No description at all: kept, rather than filled in with invention.
        event({
          id: "fixture-no-description",
          name: `${FIXTURE_LABEL} — an event with no description`,
          url: "https://example.org/fixtures/no-description",
          dates: {
            start: { localDate: at(now, 4, 18).slice(0, 10), localTime: "18:00:00" },
            timezone,
          },
          _embedded: { venues: [venue] },
        }),
        // Cancelled, and said plainly rather than quietly vanishing.
        event({
          id: "fixture-cancelled",
          name: `${FIXTURE_LABEL} — a cancelled gathering`,
          url: "https://example.org/fixtures/cancelled",
          dates: { start: { dateTime: at(now, 5, 19) }, timezone, status: { code: "cancelled" } },
          _embedded: { venues: [venue] },
        }),
        // Postponed: a different fact from cancelled, kept as its own.
        event({
          id: "fixture-postponed",
          name: `${FIXTURE_LABEL} — a postponed talk`,
          url: "https://example.org/fixtures/postponed",
          dates: { start: { dateTime: at(now, 6, 19) }, timezone, status: { code: "postponed" } },
          _embedded: { venues: [venue] },
        }),
        // Already finished. It must never read as upcoming.
        event({
          id: "fixture-past",
          name: `${FIXTURE_LABEL} — an event that has already happened`,
          url: "https://example.org/fixtures/past",
          dates: {
            start: { dateTime: at(now, -3, 19) },
            end: { dateTime: at(now, -3, 21) },
            timezone,
            status: { code: "onsale" },
          },
          _embedded: { venues: [venue] },
        }),
        // Exact duplicate of the first, under a different provider identifier.
        event({
          id: "fixture-duplicate",
          name: `${FIXTURE_LABEL} — an evening of live music in ${town}`,
          url: "https://example.org/fixtures/duplicate",
          dates: { start: { dateTime: primaryStart }, timezone, status: { code: "onsale" } },
          classifications: [{ segment: { name: "Music" } }],
          _embedded: { venues: [venue] },
        }),
        // Near-duplicate: same night, same venue, thirty minutes apart.
        event({
          id: "fixture-near-duplicate",
          name: `${FIXTURE_LABEL} — an evening of live music in ${town} (late)`,
          url: "https://example.org/fixtures/near-duplicate",
          dates: {
            start: { dateTime: new Date(new Date(primaryStart).getTime() + 1800000).toISOString() },
            timezone,
            status: { code: "onsale" },
          },
          classifications: [{ segment: { name: "Music" } }],
          _embedded: { venues: [venue] },
        }),
        // Malformed: no identifier, no name. Reported and skipped, never guessed.
        event({ dates: { start: {} } }),
        // An unsafe link. The record survives; the link does not.
        event({
          id: "fixture-bad-link",
          name: `${FIXTURE_LABEL} — an event with an unusable link`,
          url: "javascript:alert(1)",
          dates: { start: { dateTime: at(now, 7, 19) }, timezone, status: { code: "onsale" } },
          _embedded: { venues: [venue] },
        }),
        // No coordinates: it belongs to the locality, and stays unplaced on the map.
        event({
          id: "fixture-no-coordinates",
          name: `${FIXTURE_LABEL} — an event with no coordinates`,
          url: "https://example.org/fixtures/no-coordinates",
          dates: { start: { dateTime: at(now, 8, 19) }, timezone, status: { code: "onsale" } },
          _embedded: { venues: [{ name: `${town} demonstration hall`, city: { name: town } }] },
        }),
      ],
    },
  };
}

/**
 * The fixtures are provider-shaped on purpose, so they are read by exactly the
 * parsing the live source uses. When the credential arrives, nothing about the
 * road downstream changes.
 */
export const fixtureAdapter: SourceAdapter = {
  key: FIXTURE_SOURCE_KEY,
  describe: "Demonstration / development fixtures — provider-shaped, never real events",
  parse: (payload: unknown) => ticketmasterAdapter.parse(payload),
};
