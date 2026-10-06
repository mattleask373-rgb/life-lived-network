/**
 * Search Intent & Locality Resolution Engine.
 *
 * Translates natural language search queries (e.g. "Drake Birmingham",
 * "gardener Brixton", "things to do Birmingham tonight") into structured,
 * canonical search intent and verified locality references.
 *
 * Architectural Invariants:
 * - Deterministic, transparent logic.
 * - Locality resolution strictly queries canonical Place hierarchy (places.ts).
 * - Uncertainty is represented explicitly; never guesses a place or intent.
 * - Does NOT perform possibility matching or bypass the canonical supply engine.
 */

import { KIND_ORDER, Place, PlaceIndex } from "./places";

export type SearchIntentFamily =
  | "whats_on"
  | "local_service"
  | "work"
  | "class_experience"
  | "community"
  | "journey"
  | "time_specific"
  | "help"
  | "unknown";

export interface ResolvedSearchLocality {
  place: Place;
  matchedText: string;
  confidence: number;
}

export interface StructuredSearchIntent {
  rawQuery: string;
  normalizedQuery: string;
  locality: ResolvedSearchLocality | null;
  intentFamily: SearchIntentFamily;
  subject: string | null;
  timeframe: string | null;
  certainty: "clear" | "likely" | "unclear";
  suggestedPath: string;
}

const WHATS_ON_KEYWORDS = [
  "things to do",
  "what's on",
  "whats on",
  "event",
  "events",
  "live music",
  "concert",
  "gig",
  "festival",
  "theatre",
  "show",
  "tickets",
  "exhibition",
];

const LOCAL_SERVICE_KEYWORDS = [
  "gardener",
  "gardening",
  "cleaner",
  "cleaning",
  "plumber",
  "plumbing",
  "electrician",
  "osteopath",
  "sports massage",
  "massage",
  "handyman",
  "painter",
  "carpenter",
  "mechanic",
  "tutor",
  "accountant",
  "vet",
];

const WORK_KEYWORDS = [
  "job",
  "jobs",
  "work",
  "careers",
  "hiring",
  "part time",
  "full time",
  "internship",
];

const CLASS_EXPERIENCE_KEYWORDS = [
  "class",
  "classes",
  "workshop",
  "workshops",
  "course",
  "lesson",
  "lessons",
  "pottery",
  "yoga",
  "cooking",
];

const COMMUNITY_KEYWORDS = [
  "community",
  "volunteer",
  "volunteering",
  "project",
  "projects",
  "charity",
  "group",
  "cleanup",
  "food bank",
  "garden",
];

const TIMEFRAME_PHRASES: Record<string, string> = {
  "this weekend": "this_weekend",
  "this week": "this_week",
  tonight: "tonight",
  tomorrow: "tomorrow",
  today: "today",
};

/**
 * Normalizes user text safely.
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolves locality by searching the PlaceIndex.
 * Prefers exact place name matches, respecting hierarchy order.
 */
export function resolveLocalityFromQuery(
  normalized: string,
  index?: PlaceIndex | null,
): ResolvedSearchLocality | null {
  if (!index || !index.places.length) return null;

  const words = normalized.split(" ");
  let bestMatch: ResolvedSearchLocality | null = null;

  for (let n = Math.min(3, words.length); n >= 1; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(" ");
      if (phrase.length < 3) continue;

      for (const place of index.places) {
        if (place.name.toLowerCase() === phrase) {
          if (!bestMatch || KIND_ORDER[place.kind] > KIND_ORDER[bestMatch.place.kind]) {
            bestMatch = {
              place,
              matchedText: phrase,
              confidence: 0.95,
            };
          }
        }
      }
    }
    if (bestMatch) break;
  }

  return bestMatch;
}

/**
 * Parses a search query into structured search intent without inventing facts.
 */
export function parseSearchIntent(
  query: string,
  index?: PlaceIndex | null,
): StructuredSearchIntent {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return {
      rawQuery: query,
      normalizedQuery: "",
      locality: null,
      intentFamily: "unknown",
      subject: null,
      timeframe: null,
      certainty: "unclear",
      suggestedPath: "/",
    };
  }

  const locality = resolveLocalityFromQuery(normalized, index);

  let residual = normalized;
  if (locality) {
    residual = residual
      .replace(new RegExp(`\\b${locality.matchedText}\\b`, "i"), "")
      .replace(/\s+/g, " ")
      .trim();
  }

  let timeframe: string | null = null;
  for (const [phrase, code] of Object.entries(TIMEFRAME_PHRASES)) {
    if (residual.includes(phrase)) {
      timeframe = code;
      residual = residual.replace(new RegExp(`\\b${phrase}\\b`, "i"), "").trim();
      break;
    }
  }

  let intentFamily: SearchIntentFamily = "unknown";
  let subject: string | null = null;
  let certainty: "clear" | "likely" | "unclear" = "unclear";

  for (const keyword of WHATS_ON_KEYWORDS) {
    if (residual.includes(keyword)) {
      intentFamily = "whats_on";
      certainty = "clear";
      residual = residual.replace(new RegExp(`\\b${keyword}\\b`, "i"), "").trim();
      break;
    }
  }

  if (intentFamily === "unknown") {
    for (const keyword of LOCAL_SERVICE_KEYWORDS) {
      if (residual.includes(keyword)) {
        intentFamily = "local_service";
        certainty = "clear";
        subject = keyword;
        residual = residual.replace(new RegExp(`\\b${keyword}\\b`, "i"), "").trim();
        break;
      }
    }
  }

  if (intentFamily === "unknown") {
    for (const keyword of WORK_KEYWORDS) {
      if (residual.includes(keyword)) {
        intentFamily = "work";
        certainty = "likely";
        residual = residual.replace(new RegExp(`\\b${keyword}\\b`, "i"), "").trim();
        break;
      }
    }
  }

  if (intentFamily === "unknown") {
    for (const keyword of CLASS_EXPERIENCE_KEYWORDS) {
      if (residual.includes(keyword)) {
        intentFamily = "class_experience";
        certainty = "likely";
        residual = residual.replace(new RegExp(`\\b${keyword}\\b`, "i"), "").trim();
        break;
      }
    }
  }

  if (intentFamily === "unknown") {
    for (const keyword of COMMUNITY_KEYWORDS) {
      if (residual.includes(keyword)) {
        intentFamily = "community";
        certainty = "likely";
        residual = residual.replace(new RegExp(`\\b${keyword}\\b`, "i"), "").trim();
        break;
      }
    }
  }

  if (!subject && residual.length > 0) {
    subject = residual;
    if (intentFamily === "unknown" && locality) {
      intentFamily = "whats_on";
      certainty = "likely";
    }
  }

  let suggestedPath = "/";
  if (intentFamily === "local_service") {
    suggestedPath = "/need";
  } else if (locality) {
    suggestedPath = `/${locality.place.country_code.toLowerCase()}/${locality.place.slug}`;
  }

  return {
    rawQuery: query,
    normalizedQuery: normalized,
    locality,
    intentFamily,
    subject,
    timeframe,
    certainty,
    suggestedPath,
  };
}
