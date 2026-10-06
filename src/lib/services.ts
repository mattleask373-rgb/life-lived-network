/**
 * Services and practices, inside the existing architecture.
 *
 * A practice at a clinic, a studio class, a plumber's callout and a community
 * workshop are all the same canonical activity with a provider attached and a
 * truthful booking state. There is no service table, no practitioner table and
 * no marketplace: an organisation is data, not code, so the first one we model
 * (The Guildhall in Kings Heath) uses exactly what any other would.
 *
 * Nothing here invents a booking pathway. If one is not configured, the
 * interface says so rather than showing a button that goes nowhere.
 */

import type { WorldEntry } from "./world-data";

export type BookingState = "bookable" | "enquire" | "external" | "not_bookable";

export const BOOKING_LABEL: Record<BookingState, string> = {
  bookable: "Bookable",
  enquire: "Enquiries only",
  external: "Booked with the provider",
  not_bookable: "No booking pathway yet",
};

export function asBookingState(value: unknown): BookingState {
  return value === "bookable" || value === "enquire" || value === "external"
    ? value
    : "not_bookable";
}

/** True when the activity is being offered as a service by a provider. */
export function isService(entry: WorldEntry): boolean {
  return entry.kind === "service" || Boolean(entry.organisation);
}

function usableLink(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export interface NextStep {
  kind: "book" | "enquire" | "external" | "none";
  label: string;
  href?: string;
  /** Said plainly, so nobody assumes more than is true. */
  note: string;
}

/**
 * The one honest next step for a service. A booking claim without a usable
 * pathway becomes no step at all, and a demonstration record never pretends an
 * enquiry reaches anybody.
 */
export function nextStepFor(entry: WorldEntry): NextStep {
  const state = asBookingState(entry.bookingState);
  const link = usableLink(entry.bookingUrl);

  if (entry.demonstration) {
    return {
      kind: "none",
      label: "Demonstration record",
      note: "This is trial data. Nothing is booked and no enquiry is sent anywhere.",
    };
  }

  if (state === "external") {
    if (!link) {
      return {
        kind: "none",
        label: "No booking pathway yet",
        note: "The provider books elsewhere, but no booking address has been configured.",
      };
    }
    return {
      kind: "external",
      label: "Book with the provider",
      href: link,
      note: "Booking happens on the provider's own site, not here.",
    };
  }

  if (state === "bookable") {
    if (!link) {
      return {
        kind: "none",
        label: "No booking pathway yet",
        note: "This is listed as bookable, but no booking pathway has been configured yet.",
      };
    }
    return {
      kind: "book",
      label: "Book this",
      href: link,
      note: "Goes to the provider's own booking pathway.",
    };
  }

  if (state === "enquire") {
    return {
      kind: "enquire",
      label: "Ask about this",
      note: "There is no automatic booking. Your message goes to the provider.",
    };
  }

  return {
    kind: "none",
    label: "No booking pathway yet",
    note: "Discoverable, but nobody has configured a way to book or enquire yet.",
  };
}

/** What we know about the person or practice behind a service, and no more. */
export function providerLine(entry: WorldEntry): string {
  const parts = [entry.organisation, entry.providerNote].filter((part): part is string =>
    Boolean(part && part.trim()),
  );
  return parts.length ? parts.join(" · ") : "Provider not yet named";
}

/**
 * A qualification is never inferred from a skill. This says only what has
 * actually been recorded, and marks self-declared facts as self-declared.
 */
export function qualificationLine(entry: WorldEntry): string {
  if (entry.qualificationNote && entry.qualificationNote.trim()) return entry.qualificationNote;
  return "No qualification has been verified for this service";
}

export interface ServiceQuery {
  /** The locality the need belongs to. A service elsewhere is not an answer. */
  placeId?: string | null;
  category?: string;
  requiredSkills?: string[];
  /** Words from the need itself, used only for plain word overlap. */
  text?: string;
}

const BOOKING_RANK: Record<BookingState, number> = {
  bookable: 0,
  external: 1,
  enquire: 2,
  not_bookable: 3,
};

function words(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);
}

/**
 * @deprecated Excluded from the canonical Possibility pipeline (Slice 2).
 *
 * DO NOT use this function in the Need → Possibility → Connection flow or any
 * user-facing possibility discovery experience. Canonical supply is governed
 * exclusively by findSupply() in src/lib/supply-engine.ts.
 * This is preserved strictly for legacy non-matching service reference/tests.
 *
 * Services in the same locality that could answer a need. Deterministic and
 * explainable: same locality, an actual word in common, and never expired. No
 * scoring, no popularity, no ranking magic — booking state then title.
 */
export function servicePossibilities(
  entries: WorldEntry[],
  query: ServiceQuery,
  limit = 3,
): WorldEntry[] {
  const wanted = new Set([
    ...words(query.category ?? ""),
    ...(query.requiredSkills ?? []).flatMap(words),
    ...words(query.text ?? ""),
  ]);

  return entries
    .filter((entry) => isService(entry))
    .filter((entry) => entry.quality !== "expired" && !entry.cancellation)
    .filter((entry) => (query.placeId && entry.placeId ? entry.placeId === query.placeId : true))
    .filter((entry) => {
      if (wanted.size === 0) return true;
      const haystack = new Set([
        ...words(entry.title),
        ...words(entry.summary),
        ...(entry.skills ?? []).flatMap(words),
        ...words(entry.layer),
      ]);
      for (const word of wanted) if (haystack.has(word)) return true;
      return false;
    })
    .sort((a, b) => {
      const rank =
        BOOKING_RANK[asBookingState(a.bookingState)] - BOOKING_RANK[asBookingState(b.bookingState)];
      return rank !== 0 ? rank : a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}
