/**
 * Search Intent & Locality Resolution Engine.
 *
 * Translates natural language search queries (e.g. "Drake Birmingham",
 * "gardener Brixton", "things to do Birmingham tonight", "musician in Birmingham")
 * into structured search intent and canonical locality references.
 *
 * Invariants:
 * - Deterministic, pure logic with zero side-effects.
 * - Resolves locality exclusively against the canonical Place hierarchy (places.ts).
 * - Preserves typed query context across route transitions without discarding subject or place.
 * - Does NOT perform possibility matching or candidate selection; discovery remains findSupply().
 * - Never invents availability or candidate supply.
 */

import { KIND_ORDER, type Place, type PlaceIndex } from "./places";

export type SearchIntentFamily =
  | "whats_on"
  | "local_service"
  | "work"
  | "class_experience"
  | "community"
  | "journey"
  | "need"
  | "help"
  | "time_specific"
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
  targetRoute: {
    to: string;
    search?: Record<string, string>;
  };
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
  "painting",
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
  "allotment",
];

const JOURNEY_KEYWORDS = [
  "travelling",
  "traveling",
  "journey",
  "trip",
  "passing through",
  "visiting",
  "on the road",
];

const NEED_TRIGGER_PHRASES = [
  "i need a",
  "i need an",
  "i need",
  "need a",
  "need an",
  "looking for a",
  "looking for an",
  "looking for",
  "seeking a",
  "seeking",
  "wanted",
  "can anyone help with",
  "can anyone",
];

const HELP_TRIGGER_PHRASES = [
  "i can help with",
  "i can help",
  "happy to help with",
  "happy to help",
  "offering",
  "i can do",
  "available for",
];

const TIMEFRAME_PHRASES: Record<string, string> = {
  "this weekend": "this_weekend",
  "this week": "this_week",
  tonight: "tonight",
  tomorrow: "tomorrow",
  today: "today",
};

/**
 * Normalizes user input safely.
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
 * Prefers exact place name matches, respecting hierarchy order (more specific place wins).
 */
export function resolveLocalityFromQuery(
  normalized: string,
  index?: PlaceIndex | null,
): ResolvedSearchLocality | null {
  if (!index || !index.places.length) return null;

  const words = normalized.split(" ");
  let bestMatch: ResolvedSearchLocality | null = null;

  // Try multi-word place matches down to single words (max 4 words)
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(" ");
      if (phrase.length < 3) continue;

      for (const place of index.places) {
        if (place.name.toLowerCase() === phrase) {
          if (
            !bestMatch ||
            phrase.length > bestMatch.matchedText.length ||
            (phrase.length === bestMatch.matchedText.length &&
              KIND_ORDER[place.kind] > KIND_ORDER[bestMatch.place.kind])
          ) {
            bestMatch = {
              place,
              matchedText: phrase,
              confidence: 0.95,
            };
          }
        }
      }
    }
    if (bestMatch && bestMatch.matchedText.split(" ").length >= n) {
      break;
    }
  }

  return bestMatch;
}

/**
 * Parses a search query into structured search intent without inventing facts or availability.
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
      targetRoute: { to: "/" },
    };
  }

  // 1. Timeframe extraction
  let timeframe: string | null = null;
  let remainingText = normalized;
  for (const [phrase, code] of Object.entries(TIMEFRAME_PHRASES)) {
    if (remainingText.includes(phrase)) {
      timeframe = code;
      remainingText = remainingText.replace(phrase, " ");
      break;
    }
  }

  // 2. Locality extraction
  const locality = resolveLocalityFromQuery(remainingText, index);
  if (locality) {
    // Remove the matched locality name and any preceding prepositions ("in", "near", "around", "at")
    const escaped = locality.matchedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?:\\b(?:in|near|around|at)\\s+)?\\b${escaped}\\b`, "g");
    remainingText = remainingText.replace(pattern, " ");
  }

  // 3. Intent detection
  let intentFamily: SearchIntentFamily = "unknown";
  let explicitNeedOrHelp = false;

  for (const phrase of NEED_TRIGGER_PHRASES) {
    if (remainingText.includes(phrase)) {
      intentFamily = "need";
      explicitNeedOrHelp = true;
      remainingText = remainingText.replace(phrase, " ");
      break;
    }
  }

  if (!explicitNeedOrHelp) {
    for (const phrase of HELP_TRIGGER_PHRASES) {
      if (remainingText.includes(phrase)) {
        intentFamily = "help";
        explicitNeedOrHelp = true;
        remainingText = remainingText.replace(phrase, " ");
        break;
      }
    }
  }

  if (intentFamily === "unknown") {
    if (LOCAL_SERVICE_KEYWORDS.some((kw) => remainingText.includes(kw))) {
      intentFamily = "local_service";
    } else if (WHATS_ON_KEYWORDS.some((kw) => remainingText.includes(kw))) {
      intentFamily = "whats_on";
    } else if (WORK_KEYWORDS.some((kw) => remainingText.includes(kw))) {
      intentFamily = "work";
    } else if (CLASS_EXPERIENCE_KEYWORDS.some((kw) => remainingText.includes(kw))) {
      intentFamily = "class_experience";
    } else if (COMMUNITY_KEYWORDS.some((kw) => remainingText.includes(kw))) {
      intentFamily = "community";
    } else if (JOURNEY_KEYWORDS.some((kw) => remainingText.includes(kw))) {
      intentFamily = "journey";
    } else if (timeframe) {
      intentFamily = "time_specific";
    }
  }

  // 4. Subject extraction
  // Remove filler keywords from what remains
  const fillers = [
    ...WHATS_ON_KEYWORDS,
    "someone",
    "anyone",
    "people",
    "person",
    "local",
    "nearby",
  ];
  let subjectText = remainingText;
  if (intentFamily === "whats_on") {
    for (const filler of fillers) {
      subjectText = subjectText.replace(new RegExp(`\\b${filler}\\b`, "g"), " ");
    }
  }

  // Clean remaining subject
  const cleanedSubject = subjectText
    .replace(/\b(?:a|an|the|for|with|to|do|of)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If cleaned subject is empty but we recognized a local service keyword, use that keyword
  let finalSubject: string | null = cleanedSubject || null;
  if (!finalSubject && intentFamily === "local_service") {
    const matchedService = LOCAL_SERVICE_KEYWORDS.find((kw) => normalized.includes(kw));
    if (matchedService) finalSubject = matchedService;
  }

  // 5. Certainty calculation
  let certainty: "clear" | "likely" | "unclear" = "unclear";
  if (locality && (finalSubject || intentFamily !== "unknown")) {
    certainty = "clear";
  } else if (locality || finalSubject || intentFamily !== "unknown") {
    certainty = "likely";
  }

  // 6. Target route construction
  const searchParams: Record<string, string> = {};
  if (finalSubject) searchParams.subject = finalSubject;
  if (intentFamily !== "unknown") searchParams.intent = intentFamily;
  if (timeframe) searchParams.timeframe = timeframe;

  let targetRoute: { to: string; search?: Record<string, string> };

  if (locality) {
    const country = (locality.place.country_code || "gb").toLowerCase();
    targetRoute = {
      to: `/${country}/${locality.place.slug}`,
      search: Object.keys(searchParams).length ? searchParams : undefined,
    };
  } else if (intentFamily === "need") {
    targetRoute = {
      to: "/need",
      search: Object.keys(searchParams).length ? searchParams : undefined,
    };
  } else if (intentFamily === "help") {
    targetRoute = {
      to: "/help",
      search: Object.keys(searchParams).length ? searchParams : undefined,
    };
  } else if (intentFamily === "journey") {
    targetRoute = {
      to: "/journey",
      search: Object.keys(searchParams).length ? searchParams : undefined,
    };
  } else {
    targetRoute = {
      to: "/",
      search: Object.keys(searchParams).length ? searchParams : undefined,
    };
  }

  return {
    rawQuery: query,
    normalizedQuery: normalized,
    locality,
    intentFamily,
    subject: finalSubject,
    timeframe,
    certainty,
    targetRoute,
  };
}
