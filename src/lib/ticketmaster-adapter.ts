/**
 * Ticketmaster Discovery API adapter.
 *
 * Maps Ticketmaster event payloads/fixtures into normalized, provider-neutral
 * ExternalEvent objects.
 *
 * Strictly confines Ticketmaster-specific schema and conventions to this file.
 */

import type { PlaceIndex } from "./places";
import {
  type ExternalEvent,
  evaluateEventFreshness,
  normalizeExternalEvent,
  resolveEventLocality,
} from "./external-world";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function cleanString(value: unknown, maxLen = 300): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/<[^>]*>/g, "").trim();
  return cleaned ? cleaned.slice(0, maxLen) : null;
}

function parseCancellation(code: string | null): "cancelled" | "postponed" | null {
  if (!code) return null;
  const lower = code.toLowerCase();
  if (lower === "cancelled" || lower === "canceled") return "cancelled";
  if (lower === "postponed" || lower === "rescheduled") return "postponed";
  return null;
}

export interface ParseTicketmasterOptions {
  placeIndex?: PlaceIndex;
  observedAt?: string;
  now?: Date;
}

export interface ParseTicketmasterResult {
  events: ExternalEvent[];
  skipped: string[];
}

/**
 * Parses a Ticketmaster event record or array of records into normalized ExternalEvents.
 */
export function parseTicketmasterEvent(
  rawEvent: unknown,
  options: ParseTicketmasterOptions = {},
): ExternalEvent | null {
  const event = asRecord(rawEvent);
  const id = cleanString(event["id"], 120);
  const title = cleanString(event["name"], 200);

  if (!id || !title) return null;

  const dates = asRecord(event["dates"]);
  const start = asRecord(dates["start"]);
  const end = asRecord(dates["end"]);
  const status = asRecord(dates["status"]);

  const startsAt = cleanString(start["dateTime"] || start["localDate"], 50);
  const endsAt = cleanString(end["dateTime"], 50);
  const timezone = cleanString(dates["timezone"], 60);

  const venues = asArray(asRecord(event["_embedded"])["venues"]);
  const venue = asRecord(venues[0]);
  const venueName = cleanString(venue["name"], 150);
  const city = asRecord(venue["city"]);
  const cityName = cleanString(city["name"], 80);
  const country = asRecord(venue["country"]);
  const countryCode = cleanString(country["countryCode"], 10);

  const attractions = asArray(asRecord(event["_embedded"])["attractions"]);
  const attraction = asRecord(attractions[0]);
  const organiser = cleanString(attraction["name"], 120);

  const ticketUrl = cleanString(event["url"], 1000);
  const description = cleanString(
    (event["info"] as string) || (event["pleaseNote"] as string),
    500,
  );

  const statusCode = cleanString(status["code"], 40);
  const cancellation = parseCancellation(statusCode);

  const observedAt = options.observedAt ?? new Date().toISOString();
  const freshness = evaluateEventFreshness({
    startsAt,
    endsAt,
    observedAt,
    now: options.now,
  });

  // Resolve locality deterministically against PlaceIndex if supplied
  let localityId: string | null = null;
  let localityName: string | null = cityName;

  if (options.placeIndex && cityName) {
    const resolvedPlace = resolveEventLocality(cityName, countryCode, options.placeIndex);
    if (resolvedPlace) {
      localityId = resolvedPlace.id;
      localityName = resolvedPlace.name;
    }
  }

  return normalizeExternalEvent({
    provider: "ticketmaster",
    providerEntityId: id,
    title,
    localityId,
    localityName,
    venueName,
    neighbourhood: cityName,
    startsAt,
    endsAt,
    timezone,
    description,
    organiser,
    ticketUrl,
    sourceUrl: ticketUrl,
    cancellation,
    observedAt,
    freshness,
  });
}

/**
 * Parse an entire Ticketmaster Discovery response payload or array of fixtures.
 */
export function parseTicketmasterResponse(
  payload: unknown,
  options: ParseTicketmasterOptions = {},
): ParseTicketmasterResult {
  const events: ExternalEvent[] = [];
  const skipped: string[] = [];

  const root = asRecord(payload);
  const rawEvents = asArray(asRecord(root["_embedded"])["events"]);

  const items = rawEvents.length > 0 ? rawEvents : Array.isArray(payload) ? payload : [payload];

  for (const item of items) {
    const parsed = parseTicketmasterEvent(item, options);
    if (parsed) {
      events.push(parsed);
    } else {
      const rec = asRecord(item);
      const id = cleanString(rec["id"]) || "unknown";
      skipped.push(`Incomplete or unidentifiable event record: ${id}`);
    }
  }

  return { events, skipped };
}
