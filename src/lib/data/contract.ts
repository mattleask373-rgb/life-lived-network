/**
 * The data contract.
 *
 * Everything above this line asks for possibilities by describing a context;
 * nothing above it knows where the answer came from, or how the database pages.
 *
 * Deliberately small. Fields get added when a real screen needs them, not to
 * look complete.
 */

/** What we know about the moment someone is asking. Extensible by design. */
export interface DiscoveryContext {
  /** A real place record, once one is resolved. */
  placeId?: string | null;
  /** Place-level coordinates. Never a person's address. */
  lat?: number | null;
  lng?: number | null;
  /** Kilometres around the point above. */
  radiusKm?: number | null;
  /** ISO timestamps, when a screen genuinely knows them. */
  startTime?: string | null;
  endTime?: string | null;
  /** Kinds of entity wanted, when a screen wants fewer than everything. */
  entityTypes?: string[];
  limit?: number;
  cursor?: string | null;
}

/** One page of anything. The caller never sees offsets, ranges or row counts. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const DEFAULT_LIMIT = 60;
export const MAX_LIMIT = 200;

export function pageLimit(limit?: number | null): number {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

/**
 * Cursors are opaque to callers. Today they carry an offset; tomorrow they can
 * carry a keyset or a provider token without any caller changing.
 */
export function encodeCursor(offset: number): string {
  return `o:${offset}`;
}

export function decodeCursor(cursor?: string | null): number {
  if (!cursor) return 0;
  const match = /^o:(\d+)$/.exec(cursor);
  return match?.[1] ? Number(match[1]) : 0;
}

export function emptyPage<T>(): Page<T> {
  return { items: [], nextCursor: null, hasMore: false };
}

/** Builds a page from a bounded read, without leaking the mechanism. */
export function toPage<T>(items: T[], offset: number, limit: number): Page<T> {
  const hasMore = items.length === limit;
  return {
    items,
    hasMore,
    nextCursor: hasMore ? encodeCursor(offset + limit) : null,
  };
}
