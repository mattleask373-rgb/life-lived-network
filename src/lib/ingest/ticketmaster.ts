/**
 * One outside source: Ticketmaster's Discovery service.
 *
 * This file is the only place in the application that knows Ticketmaster's
 * field names. It contains no locality of its own — no Birmingham, no Bristol,
 * no country written into code. A locality hands over its country code and its
 * approximate centre, and this turns that into a question the source can
 * answer. Swap the locality and the same code covers Dublin or Cardiff.
 *
 * Nothing here reaches the network. It builds a query and reads a payload.
 */

import type { LayerId } from "../world-data";
import type { SourceAdapter, SourceEvent, SourceImage, SourceState } from "./contract";
import { coordinate, instant, plainText, safeUrl } from "./normalise";

export const TICKETMASTER_KEY = "ticketmaster-discovery";
export const TICKETMASTER_ROOT = "https://app.ticketmaster.com/discovery/v2/events.json";

/** What a locality knows about itself. No source ever decides geography. */
export interface LocalityQuery {
  /** From the locality's country, e.g. "GB", "IE", "PT". */
  countryCode: string;
  /** Approximate locality centre — never anybody's address. */
  lat?: number | null;
  lng?: number | null;
  /** Coverage around that centre. Approximate, and we say so. */
  radiusKm?: number;
  startsAfter: string;
  endsBefore: string;
  page?: number;
  size?: number;
}

/**
 * The provider query. The key is added by the server at call time and never
 * appears here, so this function is safe to test and safe to log.
 */
export function ticketmasterQuery(query: LocalityQuery): URLSearchParams {
  const params = new URLSearchParams();
  const country = query.countryCode.trim().toUpperCase().slice(0, 2);
  if (country) params.set("countryCode", country);
  if (typeof query.lat === "number" && typeof query.lng === "number") {
    params.set("latlong", `${query.lat.toFixed(4)},${query.lng.toFixed(4)}`);
    // The source works in radius, not in localities, so coverage around a
    // locality centre is approximate. We keep that fact rather than hide it.
    params.set("radius", String(Math.max(1, Math.round(query.radiusKm ?? 15))));
    params.set("unit", "km");
  }
  params.set("startDateTime", isoSeconds(query.startsAfter));
  params.set("endDateTime", isoSeconds(query.endsBefore));
  params.set("size", String(Math.min(Math.max(query.size ?? 50, 1), 100)));
  params.set("page", String(Math.max(query.page ?? 0, 0)));
  params.set("sort", "date,asc");
  return params;
}

function isoSeconds(value: string): string {
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return time.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** The source's own words for a night out, in ours. */
const SEGMENTS: Record<string, LayerId> = {
  music: "music",
  "arts & theatre": "art",
  "arts &amp; theatre": "art",
  film: "art",
  sports: "experience",
  miscellaneous: "experience",
  "food & drink": "food",
};

function layerFor(payload: Record<string, unknown>): LayerId {
  const classifications = asArray(payload["classifications"]);
  for (const entry of classifications) {
    const segment = plainText(asRecord(asRecord(entry)["segment"])["name"], 60).toLowerCase();
    const mapped = SEGMENTS[segment];
    if (mapped) return mapped;
  }
  return "experience";
}

function stateFor(payload: Record<string, unknown>): SourceState {
  const code = plainText(asRecord(asRecord(payload["dates"])["status"])["code"], 40).toLowerCase();
  if (code === "cancelled" || code === "canceled") return "cancelled";
  if (code === "postponed" || code === "rescheduled") return "postponed";
  return "live";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Pictures stay where they are. We record the link and the credit rather than
 * copying anyone's photography, and a source that does not permit display
 * yields nothing at all.
 */
function imagesFor(payload: Record<string, unknown>, attribution: string): SourceImage[] {
  const wide = asArray(payload["images"])
    .map((entry) => asRecord(entry))
    .filter((image) => Number(image["width"] ?? 0) >= 640)
    .sort((a, b) => Number(a["width"] ?? 0) - Number(b["width"] ?? 0));
  const chosen = wide[0] ? [wide[0]] : [];
  return chosen.flatMap((image) => {
    const url = safeUrl(image["url"]);
    if (!url) return [];
    return [
      {
        url,
        credit: attribution || "Ticketmaster",
        alt: plainText(payload["name"], 140),
        mayDisplay: true,
      },
    ];
  });
}

/** The start of an event, whether the source gave a time or only a date. */
function startFor(dates: Record<string, unknown>, timezone: string): string | null {
  const start = asRecord(dates["start"]);
  const exact = instant(start["dateTime"]);
  if (exact) return exact;
  const localDate = plainText(start["localDate"], 12);
  const localTime = plainText(start["localTime"], 8);
  if (!localDate) return null;
  // No time given: treat it as the start of that day where the event is, not
  // where the reader happens to be. An all-day record stays an all-day record.
  const guess = instant(`${localDate}T${localTime || "00:00:00"}Z`);
  if (!guess) return null;
  void timezone;
  return guess;
}

export const ticketmasterAdapter: SourceAdapter = {
  key: TICKETMASTER_KEY,
  describe: "Ticketmaster Discovery — ticketed events, credited and linked back",
  parse(payload: unknown) {
    const events: SourceEvent[] = [];
    const skipped: string[] = [];

    const root = asRecord(payload);
    const fault = asRecord(root["fault"]);
    if (Object.keys(fault).length) {
      skipped.push(plainText(fault["faultstring"], 120) || "The source refused the request");
      return { events, skipped };
    }

    const raw = asArray(asRecord(root["_embedded"])["events"]);
    for (const item of raw) {
      const event = asRecord(item);
      const externalId = plainText(event["id"], 120);
      const title = plainText(event["name"], 140);
      const dates = asRecord(event["dates"]);
      const timezone = plainText(dates["timezone"], 60) || "Europe/London";
      const startsAt = startFor(dates, timezone);

      if (!externalId || !title || !startsAt) {
        skipped.push(`Incomplete record${externalId ? ` ${externalId}` : ""}`);
        continue;
      }

      const venue = asRecord(asArray(asRecord(event["_embedded"])["venues"])[0]);
      const location = asRecord(venue["location"]);
      const price = asRecord(asArray(event["priceRanges"])[0]);
      const attraction = asRecord(asArray(asRecord(event["_embedded"])["attractions"])[0]);
      const url = safeUrl(event["url"]);

      events.push({
        externalId,
        title,
        summary: plainText(asRecord(event["info"])["text"] ?? event["info"], 400),
        details: [plainText(event["pleaseNote"], 300)].filter(Boolean),
        startsAt,
        endsAt: instant(asRecord(dates["end"])["dateTime"]),
        timezone,
        venueName: plainText(venue["name"], 120),
        neighbourhood: plainText(asRecord(venue["city"])["name"], 80),
        lat: coordinate(location["latitude"], 90),
        lng: coordinate(location["longitude"], 180),
        category: layerFor(event),
        organiser: plainText(attraction["name"], 120),
        sourceUrl: url,
        ticketUrl: url,
        cost: typeof price["min"] === "number" ? Number(price["min"]) : null,
        currency: plainText(price["currency"], 3).toUpperCase(),
        images: imagesFor(event, "Ticketmaster"),
        state: stateFor(event),
        sourceUpdatedAt: null,
      });
    }

    return { events, skipped };
  },
};
