/**
 * Possibility Front Door — lightweight, deterministic intent routing.
 *
 * Routes a short human statement toward an existing product doorway.
 * Does NOT interpret skill, place, time, price, or qualification.
 * Does NOT call the supply engine.
 * Does NOT invent matches.
 *
 * Paths:
 *   NEED   → /need
 *   HELP   → /help
 *   GIVE   → /give
 *   JOURNEY → /journey
 *   DISCOVER → stay / explore (unknown)
 */

export type PossibilityIntentKind = "NEED" | "HELP" | "GIVE" | "JOURNEY" | "DISCOVER";

export interface PossibilityIntent {
  kind: PossibilityIntentKind;
  /** Human label for the doorway. */
  label: string;
  /** One calm sentence explaining the route. */
  blurb: string;
  /** Existing product path. */
  href: "/need" | "/help" | "/give" | "/journey" | "/";
  /** Phrases that contributed to the classification (for transparency). */
  matched: string[];
  /** Confidence of the route only — never a match score. */
  certainty: "clear" | "likely" | "unclear";
}

const NEED_PHRASES = [
  "i need",
  "need a",
  "need someone",
  "looking for someone",
  "looking for a",
  "find me a",
  "find someone",
  "help me with",
  "help me find",
  "can anyone",
  "does anyone",
  "want someone",
  "require a",
  "require someone",
];

const HELP_PHRASES = [
  "i can help",
  "i can do",
  "i can teach",
  "i can offer",
  "i'm good at",
  "i am good at",
  "i know how",
  "happy to help",
  "available to help",
  "say what you can",
  "what i can do",
];

const GIVE_PHRASES = [
  "i want to give",
  "i want to volunteer",
  "volunteer",
  "contribute",
  "donation of time",
  "one hour",
  "i have an hour",
  "i have one hour",
  "give my time",
  "help for free",
  "offer an hour",
];

const JOURNEY_PHRASES = [
  "i'm travelling",
  "i am travelling",
  "i'm traveling",
  "i am traveling",
  "passing through",
  "on my way",
  "along my way",
  "road trip",
  "travelling through",
  "traveling through",
  "visiting",
  "staying in",
  "next week in",
  "heading to",
  "going to",
];

function matchesAny(haystack: string, phrases: string[]): string[] {
  return phrases.filter((p) => haystack.includes(p));
}

/**
 * Classify a short free-text statement into a product doorway.
 * Deterministic. Never invents domain facts beyond the route.
 */
export function classifyPossibilityIntent(raw: string): PossibilityIntent {
  const text = raw.trim().toLowerCase().replace(/\s+/g, " ");

  if (!text || text.length < 2) {
    return {
      kind: "DISCOVER",
      label: "Explore what's here",
      blurb: "Say a little more, or pick one of the doors below.",
      href: "/",
      matched: [],
      certainty: "unclear",
    };
  }

  const needHits = matchesAny(text, NEED_PHRASES);
  const helpHits = matchesAny(text, HELP_PHRASES);
  const giveHits = matchesAny(text, GIVE_PHRASES);
  const journeyHits = matchesAny(text, JOURNEY_PHRASES);

  type Score = { kind: PossibilityIntentKind; hits: string[]; weight: number };
  const journey: Score = { kind: "JOURNEY", hits: journeyHits, weight: journeyHits.length * 3 };
  const give: Score = { kind: "GIVE", hits: giveHits, weight: giveHits.length * 3 };
  const help: Score = { kind: "HELP", hits: helpHits, weight: helpHits.length * 3 };
  const need: Score = { kind: "NEED", hits: needHits, weight: needHits.length * 3 };
  const scores: Score[] = [journey, give, help, need];

  if (!needHits.length && /\bneed\b/.test(text)) {
    need.weight += 1;
    need.hits = ["need"];
  }
  if (!helpHits.length && /\b(can help|can do|can teach)\b/.test(text)) {
    help.weight += 2;
    help.hits = ["can help"];
  }
  if (!giveHits.length && /\bvolunteer\b/.test(text)) {
    give.weight += 2;
    give.hits = ["volunteer"];
  }
  if (!journeyHits.length && /\b(travel|travelling|traveling|trip)\b/.test(text)) {
    journey.weight += 1;
    journey.hits = ["travel"];
  }

  scores.sort((a, b) => b.weight - a.weight);
  const top = scores[0];

  if (!top || top.weight === 0) {
    return {
      kind: "DISCOVER",
      label: "Explore what's here",
      blurb:
        "We couldn't tell whether you need something, can help, want to give, or are travelling. Pick a door, or say it another way.",
      href: "/",
      matched: [],
      certainty: "unclear",
    };
  }

  const certainty: PossibilityIntent["certainty"] =
    top.weight >= 3 ? "clear" : top.weight >= 2 ? "likely" : "unclear";

  switch (top.kind) {
    case "NEED":
      return {
        kind: "NEED",
        label: "I need something",
        blurb:
          "We'll take you to say what you need — place, time, and any requirements stay with you to confirm.",
        href: "/need",
        matched: top.hits,
        certainty,
      };
    case "HELP":
      return {
        kind: "HELP",
        label: "I can help",
        blurb:
          "We'll take you to say what you can do. Capability is not the same as availability — you'll stay in control.",
        href: "/help",
        matched: top.hits,
        certainty,
      };
    case "GIVE":
      return {
        kind: "GIVE",
        label: "I want to give",
        blurb: "We'll take you to offer an hour or contribute. Nothing is scored or demanded.",
        href: "/give",
        matched: top.hits,
        certainty,
      };
    case "JOURNEY":
      return {
        kind: "JOURNEY",
        label: "I'm travelling",
        blurb:
          "We'll take you to journey possibilities. A journey is not your live location and not a promise you're free.",
        href: "/journey",
        matched: top.hits,
        certainty,
      };
    default:
      return {
        kind: "DISCOVER",
        label: "Explore what's here",
        blurb: "Pick a door below to continue.",
        href: "/",
        matched: [],
        certainty: "unclear",
      };
  }
}

/** The four primary front-door actions (no natural language required). */
export const FRONT_DOOR_ACTIONS: Omit<PossibilityIntent, "matched" | "certainty">[] = [
  {
    kind: "NEED",
    label: "I need something",
    blurb: "Ask for help, work, or a skill nearby.",
    href: "/need",
  },
  {
    kind: "HELP",
    label: "I can help",
    blurb: "Say what you can do — without promising availability.",
    href: "/help",
  },
  {
    kind: "GIVE",
    label: "I want to give",
    blurb: "Offer an hour, volunteer, or contribute.",
    href: "/give",
  },
  {
    kind: "JOURNEY",
    label: "I'm travelling",
    blurb: "See what's along your way — never treated as live location.",
    href: "/journey",
  },
];
