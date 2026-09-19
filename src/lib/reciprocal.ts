/**
 * The other direction.
 *
 * The supply engine answers "given this need, who could help?". This answers
 * "given this person, what could they help with?". It is the same evidence,
 * read the other way round — not a second matching system, and not a job feed.
 *
 * Pure. Deterministic. It never invents a match, never merges different facts
 * into a score, and always says what kind of possibility something is.
 */

import { freshness, isCurrent } from "./capability-freshness";
import type { PersonCandidate } from "./supply-engine";
import type { Need } from "./needs";
import { regulatedFlags } from "./policy";

export type OpportunityKind =
  | "exact_match"
  | "possible_match"
  | "community_possibility"
  | "travelling_possibility"
  | "swap";

export const OPPORTUNITY_ORDER: OpportunityKind[] = [
  "exact_match",
  "possible_match",
  "community_possibility",
  "travelling_possibility",
  "swap",
];

export const OPPORTUNITY_HEADING: Record<OpportunityKind, string> = {
  exact_match: "Someone needs exactly what you said you can do",
  possible_match: "You might be able to help with this",
  community_possibility: "Something community-run you could help with",
  travelling_possibility: "Somewhere you said you'd be",
  swap: "Someone who'd swap with you",
};

export const OPPORTUNITY_CAVEAT: Record<OpportunityKind, string> = {
  exact_match: "They asked for this. It's still their choice who they go with.",
  possible_match: "Close, not certain. Read it properly before you get in touch.",
  community_possibility: "Community-run, so it may work differently to paid work.",
  travelling_possibility: "Based on where you said you'd be, not where you are.",
  swap: "No money involved — you'd both be giving something.",
};

export interface PersonOpportunity {
  id: string;
  kind: OpportunityKind;
  need: Need;
  /** Only facts drawn from what the person and the asker actually stated. */
  why: string[];
  caveat: string;
  /** Anything commonly regulated, flagged rather than judged. */
  notes: string[];
}

export interface ReciprocalInput {
  person: PersonCandidate;
  needs: Need[];
  now: string | number | Date;
  /** Kept small on purpose. This is not a feed. */
  limit?: number;
  /** Availability windows the person set, with their own freshness. */
  availabilityConfirmedAt?: string | null;
}

function words(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .split(/[^a-zà-ÿ]+/)
        .filter((w) => w.length > 3),
    ),
  ];
}

function overlaps(person: PersonCandidate, need: Need): boolean {
  if (!need.startsAt) return false;
  const start = Date.parse(need.startsAt);
  const end = need.endsAt ? Date.parse(need.endsAt) : start;
  return person.availability.some(
    (w) => Date.parse(w.startsAt) <= end && Date.parse(w.endsAt) >= start,
  );
}

function reachable(person: PersonCandidate, need: Need): boolean {
  if (!need.placeId) return false;
  return person.placeId === need.placeId || person.serviceAreaPlaceIds.includes(need.placeId);
}

/** What could this person genuinely help with? */
export function findOpportunitiesForPerson(input: ReciprocalInput): PersonOpportunity[] {
  const { person, needs, now } = input;
  const limit = input.limit ?? 12;
  const found: PersonOpportunity[] = [];

  // Only statements that are still current are used to put work in front of
  // someone. Stale statements are not evidence of anything.
  const currentCapabilities = person.capabilities.filter((c) =>
    isCurrent(freshness({ lastConfirmedAt: c.lastConfirmedAt, kind: "capability", now })),
  );

  for (const need of needs) {
    if (need.status !== "open") continue;
    if (need.visibility === "private") continue;
    if (need.creatorId === person.id) continue;

    const asked = words(
      [need.category, need.title, ...need.requiredSkills, ...need.requiredRoles].join(" "),
    );
    const capability = currentCapabilities.find((c) =>
      asked.some((w) => c.label.toLowerCase().includes(w)),
    );

    const here = reachable(person, need);
    const free = overlaps(person, need);
    const notes = regulatedFlags(`${need.category} ${need.title} ${need.requiredSkills.join(" ")}`)
      .map((f) => f.note);

    const wantsSwap =
      need.paymentType === "exchange" || need.intent === "skills_exchange";
    const community =
      need.intent === "community_project" || need.intent === "volunteering";

    if (capability && here && free) {
      found.push({
        id: `exact-${need.id}`,
        kind: "exact_match",
        need,
        why: [
          `They asked for ${capability.label}`,
          "It's in an area you said you work in",
          "A time you said you're free overlaps theirs",
        ],
        caveat: OPPORTUNITY_CAVEAT.exact_match,
        notes,
      });
      continue;
    }

    if (capability && here) {
      if (community && person.preferences.includes("community_projects")) {
        found.push({
          id: `community-${need.id}`,
          kind: "community_possibility",
          need,
          why: [
            `They asked for ${capability.label}`,
            "You said you're up for community projects",
          ],
          caveat: OPPORTUNITY_CAVEAT.community_possibility,
          notes,
        });
        continue;
      }
      if (wantsSwap && person.preferences.includes("skills_exchange")) {
        found.push({
          id: `swap-${need.id}`,
          kind: "swap",
          need,
          why: [
            `They asked for ${capability.label}`,
            "You both said you'd rather swap than pay",
            ...(person.wantsToLearn.length
              ? [`You'd like to learn: ${person.wantsToLearn.join(", ")}`]
              : []),
          ],
          caveat: OPPORTUNITY_CAVEAT.swap,
          notes,
        });
        continue;
      }
      found.push({
        id: `possible-${need.id}`,
        kind: "possible_match",
        need,
        why: [
          `They asked for ${capability.label}`,
          person.availability.length
            ? "You haven't said you're free at their time"
            : "You haven't said when you're free",
        ],
        caveat: OPPORTUNITY_CAVEAT.possible_match,
        notes,
      });
      continue;
    }

    if (
      capability &&
      person.preferences.includes("travelling_opportunities") &&
      need.placeId &&
      person.serviceAreaPlaceIds.includes(need.placeId)
    ) {
      found.push({
        id: `travelling-${need.id}`,
        kind: "travelling_possibility",
        need,
        why: [
          `They asked for ${capability.label}`,
          "You said you'd be passing through there",
        ],
        caveat: OPPORTUNITY_CAVEAT.travelling_possibility,
        notes,
      });
    }
  }

  return OPPORTUNITY_ORDER.flatMap((kind) => found.filter((f) => f.kind === kind)).slice(0, limit);
}
