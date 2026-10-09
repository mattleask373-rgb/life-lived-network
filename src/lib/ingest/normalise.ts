/**
 * Turning outside data into Real World Atlas data, safely.
 *
 * Everything an outside source says is untrusted: text may carry markup, links
 * may point anywhere, dates may be nonsense, coordinates may be in the sea.
 * Nothing leaves this file unchecked, and nothing is invented to fill a gap.
 */

import type { LayerId, TimeBand } from "../world-data";
import type { SourceEvent, SourceImage } from "./contract";

const MAX_TITLE = 160;
const MAX_TEXT = 1200;
const MAX_DETAIL = 240;
const MAX_DETAILS = 8;

/** Plain text only: no markup, no control characters, no runaway length. */
export function plainText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  const withoutTags = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ");
  const decoded = withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  const clean = decoded
    // Outside text can carry control characters. Stripping them is the point.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.slice(0, max);
}

/** Only ordinary web links survive. No javascript:, data:, or relative guesses. */
export function safeUrl(value: unknown): string {
  if (typeof value !== "string" || value.length > 2000) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

/** An instant, or nothing. A guessed date is worse than an absent one. */
export function instant(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  const time = date.getTime();
  if (Number.isNaN(time)) return null;
  const year = date.getUTCFullYear();
  if (year < 2000 || year > 2100) return null;
  return date.toISOString();
}

/** Place-level coordinates only, and only if they are on Earth. */
export function coordinate(value: unknown, limit: number): number | null {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  if (!Number.isFinite(n) || Math.abs(n) > limit) return null;
  return Math.round(n * 1e5) / 1e5;
}

/** Whole minutes between two instants, bounded to something a person can do. */
export function minutesBetween(startsAt: string, endsAt?: string | null): number {
  if (!endsAt) return 120;
  const span = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000;
  if (!Number.isFinite(span) || span <= 0) return 120;
  return Math.min(Math.round(span), 60 * 24);
}

/**
 * Which of our time bands an instant belongs to, in the locality's own clock.
 * Anything further out than the weekend simply has no band and is described by
 * its date instead.
 */
export function bandFor(startsAt: string, timezone: string, now = new Date()): TimeBand {
  const start = new Date(startsAt);
  const hours = (start.getTime() - now.getTime()) / 3600000;
  const sameDay = dayKey(start, timezone) === dayKey(now, timezone);
  if (sameDay) {
    if (hours <= 3) return "now";
    const hour = Number(part(start, timezone, "hour"));
    return hour >= 17 ? "tonight" : "today";
  }
  const tomorrow = new Date(now.getTime() + 86400000);
  if (dayKey(start, timezone) === dayKey(tomorrow, timezone)) return "tomorrow";
  return "weekend";
}

function part(date: Date, timeZone: string, type: "hour" | "weekday"): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour12: false,
      ...(type === "hour" ? { hour: "2-digit" as const } : { weekday: "short" as const }),
    }).format(date);
  } catch {
    return "12";
  }
}

function dayKey(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** How a person would say when this is, in the place's own clock. */
export function whenWording(
  startsAt: string,
  endsAt: string | null | undefined,
  timezone: string,
): string {
  const start = new Date(startsAt);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone || "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  let wording: string;
  try {
    wording = new Intl.DateTimeFormat("en-GB", options).format(start);
  } catch {
    wording = start.toISOString().slice(0, 16).replace("T", " ");
  }
  if (endsAt) {
    try {
      const end = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone || "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(endsAt));
      wording = `${wording} – ${end}`;
    } catch {
      /* the start alone is still honest */
    }
  }
  return wording;
}

/** Pictures we are actually allowed to show, with their credit kept. */
export function usableImages(
  images: SourceImage[] | undefined,
  storeImages: boolean,
): SourceImage[] {
  if (!images?.length) return [];
  return images
    .filter((image) => image.mayDisplay && storeImages)
    .map((image) => ({
      url: safeUrl(image.url),
      credit: plainText(image.credit, 120),
      alt: plainText(image.alt, 200),
      mayDisplay: true,
    }))
    .filter((image) => image.url !== "")
    .slice(0, 6);
}

/**
 * The same event, in our shape, with everything checked. Returns null when the
 * source did not give us enough to be honest about — no invention here.
 */
export function normaliseEvent(raw: SourceEvent): SourceEvent | null {
  const title = plainText(raw.title, MAX_TITLE);
  const startsAt = instant(raw.startsAt);
  const sourceUrl = safeUrl(raw.sourceUrl);
  const externalId = plainText(raw.externalId, 200);
  if (!title || !startsAt || !externalId) return null;

  const endsAt = instant(raw.endsAt);
  const timezone = /^[A-Za-z_]+\/[A-Za-z_+-]+$/.test(raw.timezone) ? raw.timezone : "Europe/London";

  return {
    externalId,
    title,
    summary: plainText(raw.summary, MAX_TEXT),
    details: (raw.details ?? [])
      .map((detail) => plainText(detail, MAX_DETAIL))
      .filter((detail) => detail !== "")
      .slice(0, MAX_DETAILS),
    startsAt,
    endsAt: endsAt && endsAt > startsAt ? endsAt : null,
    timezone,
    ...(raw.recurrence ? { recurrence: plainText(raw.recurrence, 120) } : {}),
    venueName: plainText(raw.venueName, 160),
    ...(raw.neighbourhood ? { neighbourhood: plainText(raw.neighbourhood, 120) } : {}),
    ...(raw.localitySlug ? { localitySlug: plainText(raw.localitySlug, 120) } : {}),
    lat: coordinate(raw.lat, 90),
    lng: coordinate(raw.lng, 180),
    category: raw.category as LayerId,
    ...(raw.organiser ? { organiser: plainText(raw.organiser, 160) } : {}),
    sourceUrl,
    ...(raw.ticketUrl ? { ticketUrl: safeUrl(raw.ticketUrl) } : {}),
    cost: typeof raw.cost === "number" && Number.isFinite(raw.cost) ? Math.max(raw.cost, 0) : null,
    currency: /^[A-Z]{3}$/.test(raw.currency ?? "") ? (raw.currency as string) : "GBP",
    ...(raw.images ? { images: raw.images } : {}),
    state:
      raw.state === "cancelled" || raw.state === "postponed" || raw.state === "removed"
        ? raw.state
        : "live",
    sourceUpdatedAt: instant(raw.sourceUpdatedAt),
  };
}
