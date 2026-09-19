/**
 * Bringing the outside world in, once, safely.
 *
 * This is the only file that talks to an outside source over the network. It is
 * server-only: the key lives in server configuration, is never returned, never
 * logged and never reaches a browser.
 *
 * The order is fixed and boring on purpose:
 *   source -> adapter -> normalise -> resolve -> dedupe -> provenance ->
 *   freshness -> policy -> canonical activity
 *
 * A failure here records itself and changes nothing else. Activity already
 * imported stays exactly as it was, so a source going dark never empties a
 * locality.
 */

import type { SourceEvent, SourceRow, IngestOutcome } from "./contract";
import { adapterFor } from "./registry";
import { bandFor, minutesBetween, normaliseEvent, usableImages, whenWording } from "./normalise";
import { cancellationFor, eventFreshness, qualityFor } from "./freshness";
import { payloadHash, sameEvent } from "./dedupe";
import { TICKETMASTER_KEY, TICKETMASTER_ROOT, ticketmasterQuery } from "./ticketmaster";

const MAX_PAGES = 2;
const MAX_EVENTS = 120;

export interface RefreshRequest {
  sourceId: string;
  /** The locality being refreshed, resolved by the caller from the hierarchy. */
  placeId: string;
  countryCode: string;
  lat: number | null;
  lng: number | null;
  radiusKm?: number;
  startsAfter: string;
  endsBefore: string;
  /** Ignore the source's own interval. Reviewers only, for a live check. */
  force?: boolean;
}

export function sourceKeyFor(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Is this source allowed to run right now? Interval is the source's own. */
export function dueForRefresh(source: SourceRow, now = new Date()): boolean {
  if (!source.last_run_at) return true;
  const since = now.getTime() - new Date(source.last_run_at).getTime();
  return since >= Math.max(source.refresh_minutes, 15) * 60000;
}

/** The map still wants a rough position; real coordinates stay approximate. */
function mapPosition(lat: number | null, lng: number | null): { x: number; y: number } {
  if (lat === null || lng === null) return { x: 50, y: 50 };
  const x = Math.min(96, Math.max(4, ((lng + 11) / 14) * 100));
  const y = Math.min(96, Math.max(4, ((60 - lat) / 12) * 100));
  return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
}

export async function refreshSourceRun(request: RefreshRequest): Promise<IngestOutcome> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: sourceRow, error: sourceError } = await supabaseAdmin
    .from("sources")
    .select("*")
    .eq("id", request.sourceId)
    .maybeSingle();
  if (sourceError) throw sourceError;
  if (!sourceRow) throw new Error("That source does not exist.");
  const source = sourceRow as unknown as SourceRow;

  const outcome: IngestOutcome = {
    source: source.name,
    read: 0,
    imported: 0,
    updated: 0,
    duplicates: 0,
    skipped: [],
  };

  const adapter = adapterFor(sourceKeyFor(source.name));
  if (!adapter) {
    return finish(source, { ...outcome, failure: "No adapter is configured for this source." });
  }
  if (!source.enabled || source.status !== "ready") {
    return finish(source, {
      ...outcome,
      failure: "This source is switched off until it is ready to use.",
    });
  }
  if (!request.force && !dueForRefresh(source)) {
    return { ...outcome, failure: "Refreshed recently — nothing to do yet." };
  }

  let events: SourceEvent[] = [];
  try {
    events = await readFromSource(adapter.key, request, outcome, adapter.parse);
  } catch (error) {
    const failure = error instanceof Error ? error.message : "The source could not be reached.";
    return finish(source, { ...outcome, failure });
  }

  for (const raw of events.slice(0, MAX_EVENTS)) {
    const event = normaliseEvent(raw);
    if (!event) {
      outcome.skipped.push("A record arrived too incomplete to keep");
      continue;
    }
    try {
      const result = await storeEvent(supabaseAdmin, source, request, event);
      if (result === "imported") outcome.imported += 1;
      if (result === "updated") outcome.updated += 1;
      if (result === "duplicate") outcome.duplicates += 1;
    } catch {
      outcome.skipped.push(`Could not store ${event.title}`);
    }
  }

  return finish(source, outcome);

  async function finish(row: SourceRow, result: IngestOutcome): Promise<IngestOutcome> {
    const failed = Boolean(result.failure);
    await supabaseAdmin
      .from("sources")
      .update({
        last_run_at: new Date().toISOString(),
        last_outcome: failed
          ? result.failure!.slice(0, 200)
          : `${result.imported} new, ${result.updated} updated, ${result.duplicates} already known`,
        consecutive_failures: failed ? row.consecutive_failures + 1 : 0,
      })
      .eq("id", row.id);
    return result;
  }
}

type Parser = (payload: unknown) => { events: SourceEvent[]; skipped: string[] };

/** One bounded read from the source. Keys are read here and nowhere else. */
async function readFromSource(
  key: string,
  request: RefreshRequest,
  outcome: IngestOutcome,
  parse: Parser,
): Promise<SourceEvent[]> {
  if (key !== TICKETMASTER_KEY) throw new Error("This source has no live connection yet.");
  const apiKey = process.env["TICKETMASTER_API_KEY"];
  if (!apiKey) throw new Error("No credential is configured for this source.");

  const collected: SourceEvent[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = ticketmasterQuery({
      countryCode: request.countryCode,
      lat: request.lat,
      lng: request.lng,
      ...(request.radiusKm === undefined ? {} : { radiusKm: request.radiusKm }),
      startsAfter: request.startsAfter,
      endsBefore: request.endsBefore,
      page,
      size: 50,
    });
    params.set("apikey", apiKey);

    const response = await fetch(`${TICKETMASTER_ROOT}?${params.toString()}`, {
      headers: { accept: "application/json" },
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error("The source rejected the credential.");
    }
    if (!response.ok) throw new Error(`The source answered with ${response.status}.`);

    const payload: unknown = await response.json().catch(() => null);
    const parsed = parse(payload);
    outcome.read += parsed.events.length;
    outcome.skipped.push(...parsed.skipped.slice(0, 10));
    collected.push(...parsed.events);
    if (parsed.events.length < 50) break;
  }
  return collected;
}

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function storeEvent(
  admin: Admin,
  source: SourceRow,
  request: RefreshRequest,
  event: SourceEvent,
): Promise<"imported" | "updated" | "duplicate"> {
  const now = new Date().toISOString();
  const hash = payloadHash(event);

  const { data: existingRecord } = await admin
    .from("source_records")
    .select("id, listing_id, payload_hash")
    .eq("source_id", source.id)
    .eq("external_id", event.externalId)
    .maybeSingle();

  const freshness = eventFreshness({
    lastCheckedAt: now,
    sourceUpdatedAt: event.sourceUpdatedAt ?? null,
    startsAt: event.startsAt,
    endsAt: event.endsAt ?? null,
    refreshMinutes: source.refresh_minutes,
  });

  const listing = {
    creator_id: null,
    kind: "event",
    layer: event.category,
    title: event.title,
    summary: event.summary,
    details: event.details,
    place: event.venueName || "Venue named by the source",
    neighbourhood: event.neighbourhood || "",
    ...mapPosition(event.lat ?? null, event.lng ?? null),
    place_id: request.placeId,
    lat: event.lat ?? null,
    lng: event.lng ?? null,
    when_text: whenWording(event.startsAt, event.endsAt, event.timezone),
    band: bandFor(event.startsAt, event.timezone),
    minutes: minutesBetween(event.startsAt, event.endsAt),
    cost: event.cost ?? 0,
    currency: event.currency || "GBP",
    social: "friendly",
    outdoors: false,
    skills: [],
    status: "published",
    data_quality: qualityFor(freshness),
    starts_at: event.startsAt,
    ends_at: event.endsAt ?? null,
    timezone: event.timezone,
    recurrence: event.recurrence ?? "",
    organiser: event.organiser ?? "",
    ticket_url: event.ticketUrl ?? "",
    cancellation: cancellationFor(event.state),
    last_checked_at: now,
    origin: "source",
  };

  // Already known to this source: update in place, keep its provenance.
  if (existingRecord?.listing_id) {
    if (existingRecord.payload_hash === hash) {
      await admin
        .from("source_records")
        .update({ last_seen_at: now, source_state: event.state })
        .eq("id", existingRecord.id);
      await admin
        .from("listings")
        .update({ last_checked_at: now, data_quality: listing.data_quality })
        .eq("id", existingRecord.listing_id);
      return "duplicate";
    }
    await admin.from("listings").update(listing).eq("id", existingRecord.listing_id);
    await admin
      .from("source_records")
      .update({
        last_seen_at: now,
        source_state: event.state,
        payload_hash: hash,
        source_url: event.sourceUrl,
        source_updated_at: event.sourceUpdatedAt ?? null,
      })
      .eq("id", existingRecord.id);
    return "updated";
  }

  // A different source may already hold this event. Only merge on the stored
  // evidence rule; anything short of that stays two separate records.
  const { data: nearby } = await admin
    .from("listings")
    .select("id, title, starts_at, place, place_id, origin")
    .eq("place_id", request.placeId)
    .eq("origin", "source")
    .gte("starts_at", new Date(new Date(event.startsAt).getTime() - 7200000).toISOString())
    .lte("starts_at", new Date(new Date(event.startsAt).getTime() + 7200000).toISOString())
    .limit(50);

  for (const candidate of nearby ?? []) {
    if (!candidate.starts_at) continue;
    const decision = sameEvent(
      { ...event, placeId: request.placeId },
      {
        ...event,
        title: candidate.title,
        startsAt: candidate.starts_at,
        venueName: candidate.place ?? "",
        placeId: candidate.place_id,
      },
    );
    if (decision.same) {
      await admin.from("source_records").insert({
        source_id: source.id,
        external_id: event.externalId,
        source_url: event.sourceUrl,
        payload_hash: hash,
        listing_id: candidate.id,
        source_state: event.state,
        last_seen_at: now,
      });
      return "duplicate";
    }
  }

  const { data: created, error } = await admin
    .from("listings")
    .insert({ ...listing, imported_at: now })
    .select("id")
    .single();
  if (error) throw error;

  await admin.from("source_records").insert({
    source_id: source.id,
    external_id: event.externalId,
    source_url: event.sourceUrl,
    payload_hash: hash,
    listing_id: created.id,
    source_state: event.state,
    last_seen_at: now,
  });

  const images = usableImages(event.images, source.store_images);
  if (images.length) {
    await admin.from("listing_photos").insert(
      images.slice(0, 6).map((image, position) => ({
        listing_id: created.id,
        image_url: image.url,
        source_url: event.sourceUrl,
        credit: image.credit,
        alt_text: image.alt,
        position,
      })),
    );
  }

  return "imported";
}
