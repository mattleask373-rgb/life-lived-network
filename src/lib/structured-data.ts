import { absoluteUrl } from "./seo";
import type { WorldEntry } from "./world-data";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/** Visible breadcrumb facts, converted to a canonical Schema.org BreadcrumbList. */
export function breadcrumbListSchema(items: BreadcrumbItem[]) {
  const validItems = items.filter((item) => item.name.trim() && item.path.trim());
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: validItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Safely embeds user/source text in an inline JSON-LD script element. */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}


function publicHttpUrl(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname &&
      !url.username &&
      !url.password
    ) {
      return url.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function explicitInstant(value?: string | null): number | undefined {
  if (!value || !/(?:Z|[+-]\\d{2}:\\d{2})$/i.test(value)) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function validTimeZone(value?: string): boolean {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Event schema is emitted only for a non-demo, currently verified event with a
 * real ISO instant, IANA timezone, and explicit human-place location. No price,
 * availability, or organiser type is inferred from free text.
 */
export function eventSchema(entry: WorldEntry) {
  const start = explicitInstant(entry.startsAt);
  const end = entry.endsAt ? explicitInstant(entry.endsAt) : undefined;
  const locationName = entry.place.trim();
  if (
    entry.kind !== "event" ||
    entry.demonstration === true ||
    entry.quality !== "verified" ||
    !entry.verified ||
    entry.cancellation ||
    !entry.title.trim() ||
    !start ||
    !validTimeZone(entry.timezone) ||
    (entry.endsAt && (!end || end <= start)) ||
    !locationName ||
    ["nearby", "somewhere", "shared once you say you're coming"].includes(
      locationName.toLowerCase(),
    )
  ) {
    return null;
  }

  const url = publicHttpUrl(entry.ticketUrl) ?? publicHttpUrl(entry.sourceUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: entry.title.trim(),
    startDate: new Date(start).toISOString(),
    ...(end ? { endDate: new Date(end).toISOString() } : {}),
    location: { "@type": "Place", name: locationName },
    ...(entry.summary.trim() ? { description: entry.summary.trim() } : {}),
    ...(url ? { url } : {}),
  };
}

/**
 * LocalBusiness is intentionally conservative: it requires an explicit
 * organisation, verified current service record, and a public source/booking
 * URL. The model has no verified postal address, so none is fabricated here.
 */
export function localBusinessSchema(
  group: { organisation: string; entries: WorldEntry[] },
  localityName: string,
) {
  const name = group.organisation.trim();
  if (!name || !localityName.trim()) return null;
  const representative = group.entries.find(
    (entry) =>
      !entry.demonstration &&
      entry.quality === "verified" &&
      entry.verified &&
      !entry.cancellation &&
      entry.quality !== "expired" &&
      (publicHttpUrl(entry.bookingUrl) || publicHttpUrl(entry.sourceUrl)),
  );
  if (!representative) return null;
  const url =
    publicHttpUrl(representative.bookingUrl) ?? publicHttpUrl(representative.sourceUrl);
  if (!url) return null;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url,
    ...(representative.summary.trim() ? { description: representative.summary.trim() } : {}),
    areaServed: { "@type": "Place", name: localityName.trim() },
  };
}
