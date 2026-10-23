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

/**
 * Five-character geohashes are a coarse place-centre cell, not a locality
 * polygon (roughly 4.9 km tall and up to 4.9 km wide at the equator; longitude
 * cells narrow toward the poles). Keep the provider's radius filter as an
 * approximate coverage request; never treat either filter as a boundary.
 */
export const TICKETMASTER_GEOHASH_PRECISION = 5;
const GEOHASH_ALPHABET = "0123456789bcdefghjkmnpqrstuvwxyz";

/** Deterministic standard geohash encoding for a canonical approximate centre. */
export function ticketmasterGeoHash(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  precision = TICKETMASTER_GEOHASH_PRECISION,
): string | null {
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  if (!Number.isSafeInteger(precision) || precision < 1 || precision > 12) {
    throw new RangeError("Ticketmaster geohash precision must be an integer from 1 to 12");
  }

  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;
  let even = true;
  let bitCount = 0;
  let current = 0;
  let result = "";

  while (result.length < precision) {
    if (even) {
      const midpoint = (lonMin + lonMax) / 2;
      if (longitude >= midpoint) {
        current = (current << 1) | 1;
        lonMin = midpoint;
      } else {
        current <<= 1;
        lonMax = midpoint;
      }
    } else {
      const midpoint = (latMin + latMax) / 2;
      if (latitude >= midpoint) {
        current = (current << 1) | 1;
        latMin = midpoint;
      } else {
        current <<= 1;
        latMax = midpoint;
      }
    }

    even = !even;
    bitCount += 1;
    if (bitCount === 5) {
      result += GEOHASH_ALPHABET[current]!;
      bitCount = 0;
      current = 0;
    }
  }

  return result;
}

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
  const geoPoint = ticketmasterGeoHash(query.lat, query.lng);
  if (geoPoint) {
    params.set("geoPoint", geoPoint);
    // The provider's radius is centred on this approximate locality location.
    // This remains approximate coverage, never a canonical locality boundary.
    const requestedRadius =
      typeof query.radiusKm === "number" && Number.isFinite(query.radiusKm) ? query.radiusKm : 15;
    params.set("radius", String(Math.max(1, Math.round(requestedRadius))));
    params.set("unit", "km");
  }
  const startsAfter = isoSeconds(query.startsAfter, "startsAfter");
  const endsBefore = isoSeconds(query.endsBefore, "endsBefore");
  if (Date.parse(endsBefore) <= Date.parse(startsAfter)) {
    throw new RangeError("endsBefore must be after startsAfter");
  }
  params.set("startDateTime", startsAfter);
  params.set("endDateTime", endsBefore);
  const requestedSize =
    typeof query.size === "number" && Number.isFinite(query.size) ? Math.floor(query.size) : 50;
  const requestedPage =
    typeof query.page === "number" && Number.isFinite(query.page) ? Math.floor(query.page) : 0;
  params.set("size", String(Math.min(Math.max(requestedSize, 1), 100)));
  params.set("page", String(Math.max(requestedPage, 0)));
  params.set("sort", "date,asc");
  return params;
}

function isoSeconds(value: string, field: "startsAfter" | "endsBefore"): string {
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) {
    throw new RangeError(`${field} must be a valid date/time`);
  }
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

interface LocalWallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Resolve a source's wall-clock date/time using its IANA timezone.
 *
 * Date-only Ticketmaster records are local dates, not UTC dates. Converting
 * them by appending "Z" shifts events for every non-UTC locality. We also
 * reject gaps and repeated wall times around daylight-saving transitions:
 * without an offset from the source there is no safe instant to invent.
 */
function localWallTimeToInstant(
  localDate: string,
  localTime: string,
  timezone: string,
): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(localTime);
  if (!dateMatch || !timeMatch || !timezone) return null;

  const desired: LocalWallTime = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    second: Number(timeMatch[3] ?? "0"),
  };
  if (
    desired.year < 2000 ||
    desired.year > 2100 ||
    desired.month < 1 ||
    desired.month > 12 ||
    desired.day < 1 ||
    desired.hour > 23 ||
    desired.minute > 59 ||
    desired.second > 59
  ) {
    return null;
  }

  const wallAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
    desired.second,
  );
  const normalisedDate = new Date(wallAsUtc);
  if (
    normalisedDate.getUTCFullYear() !== desired.year ||
    normalisedDate.getUTCMonth() + 1 !== desired.month ||
    normalisedDate.getUTCDate() !== desired.day
  ) {
    return null;
  }

  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      calendar: "iso8601",
      numberingSystem: "latn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    return null;
  }

  const partsAt = (timestamp: number): LocalWallTime | null => {
    const parts: Record<string, string> = {};
    for (const part of formatter.formatToParts(new Date(timestamp))) {
      if (part.type !== "literal") parts[part.type] = part.value;
    }
    const fields = ["year", "month", "day", "hour", "minute", "second"] as const;
    if (fields.some((field) => !parts[field])) return null;
    return {
      year: Number(parts["year"]),
      month: Number(parts["month"]),
      day: Number(parts["day"]),
      hour: Number(parts["hour"]),
      minute: Number(parts["minute"]),
      second: Number(parts["second"]),
    };
  };

  const toWallAsUtc = (parts: LocalWallTime): number =>
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const matchesDesired = (parts: LocalWallTime | null): boolean =>
    parts !== null &&
    parts.year === desired.year &&
    parts.month === desired.month &&
    parts.day === desired.day &&
    parts.hour === desired.hour &&
    parts.minute === desired.minute &&
    parts.second === desired.second;

  // Iteratively estimate the UTC instant from the timezone's observed offset.
  let candidate = wallAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = partsAt(candidate);
    if (!actual) return null;
    const correction = wallAsUtc - toWallAsUtc(actual);
    candidate += correction;
    if (correction === 0) break;
  }

  // Verify uniqueness. A DST gap has no matching instant; a fall-back wall
  // time has two. Refuse both rather than quietly selecting the wrong hour.
  const candidates: number[] = [];
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  const FIFTEEN_MINUTES = 15 * 60 * 1000;
  for (let offset = -THREE_HOURS; offset <= THREE_HOURS; offset += FIFTEEN_MINUTES) {
    const timestamp = candidate + offset;
    if (matchesDesired(partsAt(timestamp))) candidates.push(timestamp);
  }
  if (candidates.length !== 1) return null;
  return new Date(candidates[0]!).toISOString();
}

/** The start of an event, whether the source gave an instant or a local date. */
function startFor(dates: Record<string, unknown>, timezone: string): string | null {
  const start = asRecord(dates["start"]);
  const exact = instant(start["dateTime"]);
  if (exact) return exact;

  const localDate = plainText(start["localDate"], 12);
  if (!localDate) return null;
  // A date without a time is represented by local midnight, converted through
  // the source timezone. This remains a date-only event, not an invented time.
  const localTime = plainText(start["localTime"], 8) || "00:00:00";
  return localWallTimeToInstant(localDate, localTime, timezone);
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
      const sourceTimezone = plainText(dates["timezone"], 60);
      // An exact source instant is still meaningful without a display zone, so
      // display it in UTC. A local wall time without its own zone is not safe
      // to convert and is rejected by startFor rather than guessed as London.
      const timezone = sourceTimezone || "UTC";
      const startsAt = startFor(dates, sourceTimezone);

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
