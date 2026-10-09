/**
 * The seam between the outside world and Real World Atlas.
 *
 * Only an adapter ever knows an outside source's shape. Everything past this
 * file works on `SourceEvent` — our words, our units, our timestamps — so the
 * interface, discovery and matching never learn a provider's field names.
 *
 * Nothing here calls anything. Adapters are handed a payload and return events.
 */

import type { LayerId } from "../world-data";

export type SourceKind = "platform" | "venue" | "civic" | "community" | "resident";
export type SourceAccess = "api" | "feed" | "structured_page" | "manual";
export type SourceStatus = "ready" | "requires_credentials" | "requires_review" | "not_suitable";
export type SourceState = "live" | "cancelled" | "postponed" | "removed";

/** A source as stored: data, never code. A new locality is a new row. */
export interface SourceRow {
  id: string;
  name: string;
  kind: SourceKind;
  access_method: SourceAccess;
  homepage_url: string;
  terms_url: string;
  attribution: string;
  store_images: boolean;
  refresh_minutes: number;
  place_ids: string[];
  status: SourceStatus;
  enabled: boolean;
  last_run_at: string | null;
  last_outcome: string;
  consecutive_failures: number;
  /** Health, kept plainly: when it last worked, last failed, and why. */
  last_success_at?: string | null;
  last_failure_at?: string | null;
  last_error_category?: string;
}

/** One picture an outside source offers, with the rights it came with. */
export interface SourceImage {
  url: string;
  credit: string;
  alt: string;
  /** False means: show nothing rather than borrow it. */
  mayDisplay: boolean;
}

/**
 * What every adapter returns, whatever the source looked like.
 * Times are real instants; wording is generated later, from these.
 */
export interface SourceEvent {
  /** The source's own identifier. Stable, or deduplication cannot work. */
  externalId: string;
  title: string;
  summary: string;
  details: string[];
  /** ISO instants. `startsAt` is required — an event without a time is not one. */
  startsAt: string;
  endsAt?: string | null;
  timezone: string;
  recurrence?: string;
  /** Where, in the source's words. Resolution to a real place happens later. */
  venueName: string;
  neighbourhood?: string;
  /** The locality slug the source is scoped to, from the source record. */
  localitySlug?: string;
  lat?: number | null;
  lng?: number | null;
  category: LayerId;
  organiser?: string;
  sourceUrl: string;
  ticketUrl?: string;
  cost?: number | null;
  currency?: string;
  images?: SourceImage[];
  state: SourceState;
  sourceUpdatedAt?: string | null;
}

/** The one thing an adapter must be. No network calls live in this type. */
export interface SourceAdapter {
  /** Matches `sources.name` slugified, so sources stay data. */
  key: string;
  /** Human sentence used in the internal panel. */
  describe: string;
  /**
   * Turn one fetched payload into events. Must never throw on bad input:
   * return what parsed and report the rest.
   */
  parse(payload: unknown): { events: SourceEvent[]; skipped: string[] };
}

export interface IngestOutcome {
  source: string;
  read: number;
  imported: number;
  updated: number;
  duplicates: number;
  skipped: string[];
  failure?: string;
}
