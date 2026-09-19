/**
 * The one supply engine.
 *
 * It answers a single question: given this need, what real possibilities
 * exist? It is pure — everything it looks at is passed in, so real data,
 * cached data and test fixtures all work identically.
 *
 * It never blends its answers into one opaque score. Results come back in
 * named bands, in a deliberate order, and each one says plainly what it
 * actually is. "Someone has said they can garden" and "someone is available
 * on Thursday to garden" are different facts and are never merged.
 */

import type {
  AvailabilityWindow,
  Capability,
  ContributionKind,
  EarningPreference,
  OpportunityPreference,
  ServiceArea,
} from "./capability";
import type { Need } from "./needs";
import type { WorldEntry } from "./world-data";
import { freshness, isCurrent, type FreshnessState } from "./capability-freshness";
import {
  confidence,
  constraints,
  matchTerms,
  needTerms,
  trust,
  usableCapability,
} from "./match-signals";
import type {
  MatchSignal,
  PossibilitySupply,
  SupplyDiagnostic,
  SupplyStatus,
  SupplyType,
} from "./possibility-supply";
import type { JourneyContext } from "./journey-context";
import { journeyOverlaps } from "./journey-context";
import { regulatedFlags } from "./policy";

export type SupplyBand =
  | "direct"
  | "local_capability"
  | "open_to_opportunities"
  | "community"
  | "contribution"
  | "skills_exchange"
  | "journey"
  | "related";

export const BAND_ORDER: SupplyBand[] = [
  "direct",
  "local_capability",
  "open_to_opportunities",
  "journey",
  "community",
  "contribution",
  "skills_exchange",
  "related",
];

export const BAND_HEADING: Record<SupplyBand, string> = {
  direct: "Someone offering exactly this",
  local_capability: "People nearby who say they can do this",
  open_to_opportunities: "People who've said they're open to work like this",
  community: "Something community-run that fits",
  contribution: "Someone who's offered to help, for nothing",
  skills_exchange: "Someone who'd swap",
  journey: "Someone passing through who's open to it",
  related: "Nearby, and related",
};

export const BAND_CAVEAT: Record<SupplyBand, string> = {
  direct: "Posted by the person themselves. Still worth asking before you rely on it.",
  local_capability:
    "They've said they can do this. They have not said they're available, qualified or looking for work.",
  open_to_opportunities:
    "They've said they're open to this kind of thing. Availability still needs agreeing.",
  community: "Community-run, so it may work differently to paid work.",
  contribution: "Offered freely. Please don't treat it as a service.",
  skills_exchange: "No money involved — you'd both be giving something.",
  journey:
    "Someone travelling who opted into opportunities. This is not their live location, and not a promise they're free.",
  related: "Not what you asked for, but close enough to be worth knowing.",
};

/** A person, as far as the engine is allowed to know them. */
export interface PersonCandidate {
  id: string;
  displayName: string;
  placeId: string | null;
  placeName: string;
  capabilities: Capability[];
  serviceAreaPlaceIds: string[];
  serviceAreas?: ServiceArea[];
  /** Places they said they're only passing through. Never a live location. */
  travellingThroughPlaceIds?: string[];
  /** Explicit windows only. Absence means unknown, never "unavailable". */
  availability: Pick<AvailabilityWindow, "startsAt" | "endsAt">[];
  availabilityDetails?: AvailabilityWindow[];
  preferences: OpportunityPreference[];
  contributions?: ContributionKind[];
  earningPreference?: EarningPreference;
  journeys?: JourneyContext[];
  discoveryStatus?: SupplyStatus;
  wantsToLearn: string[];
  photoUrl?: string | null;
}

export interface SupplyResult extends PossibilitySupply {
  id: string;
  band: SupplyBand;
  title: string;
  /** What this actually is, in plain words. */
  what: string;
  where: string;
  when: string;
  /** Only facts drawn from the data. */
  why: string[];
  caveat: string;
  actions: SupplyAction[];
  /** Set when this result is a person, so the asker can invite them. */
  personId?: string;
  photoUrl?: string | null;
  evidence?: MatchEvidence;
}

export interface MatchEvidence {
  passed: string[];
  unknown: string[];
  freshness: FreshnessState;
  verification: Capability["verification"];
}

export type SupplyAction = "contact" | "save" | "go" | "join" | "view";

export interface SupplyAnswer {
  need: Need;
  results: SupplyResult[];
  /** True when nothing real was found. The UI says so rather than inventing. */
  quiet: boolean;
  bandsSearched: SupplyBand[];
  diagnostics: MatchDiagnostics;
  trace: SupplyDiagnostic[];
}

export interface MatchDiagnostics {
  peopleConsidered: number;
  excludedByPlace: number;
  excludedByFreshness: number;
  excludedByQualification: number;
  excludedByCapability: number;
  excludedByStatus: number;
  excludedByTime: number;
}

export interface SupplyInput {
  need: Need;
  people: PersonCandidate[];
  /** Listings and hour offers, already normalised to WorldEntry. */
  entries: WorldEntry[];
  /** Per-band cap, so the answer stays small and useful. */
  perBand?: number;
  now?: string | number | Date;
}

function overlapsNeedTime(
  person: PersonCandidate,
  need: Need,
): { startsAt: string; endsAt: string } | null {
  if (!need.startsAt) return null;
  const start = Date.parse(need.startsAt);
  const end = need.endsAt ? Date.parse(need.endsAt) : start;
  return (
    person.availability.find(
      (w) => Date.parse(w.startsAt) <= end && Date.parse(w.endsAt) >= start,
    ) ?? null
  );
}

function inArea(person: PersonCandidate, need: Need): boolean {
  if (!need.placeId) return false;
  return person.placeId === need.placeId || person.serviceAreaPlaceIds.includes(need.placeId);
}

function whenText(need: Need): string {
  if (!need.startsAt) return "Time still to agree";
  const d = new Date(need.startsAt);
  return `${d.toUTCString().slice(0, 16)} (${need.timezone})`;
}

/** The whole search, in one deterministic pass. */
export function findSupply(input: SupplyInput): SupplyAnswer {
  const { need, people, entries } = input;
  const perBand = input.perBand ?? 3;
  const words = needTerms(need);
  const now = input.now ?? new Date();
  const results: SupplyResult[] = [];
  const usedPeople = new Set<string>();
  const diagnostics: MatchDiagnostics = {
    peopleConsidered: people.length,
    excludedByPlace: 0,
    excludedByFreshness: 0,
    excludedByQualification: 0,
    excludedByCapability: 0,
    excludedByStatus: 0,
    excludedByTime: 0,
  };
  const trace: SupplyDiagnostic[] = [];

  type ResultDraft = Omit<SupplyResult, keyof PossibilitySupply> & Partial<PossibilitySupply>;
  const typeFor = (band: SupplyBand): SupplyType =>
    ({
      direct: "DIRECT",
      local_capability: "LATENT",
      open_to_opportunities: "LATENT",
      journey: "JOURNEY",
      community: "COMMUNITY",
      contribution: "CONTRIBUTION",
      skills_exchange: "SKILLS_EXCHANGE",
      related: "RELATED",
    })[band] as SupplyType;
  const push = (draft: ResultDraft) => {
    const evidence = draft.evidence;
    const signals: MatchSignal[] = draft.signals ?? [
      ...(evidence?.passed ?? []).map((reason) => ({
        kind: reason.includes("area")
          ? ("service_area" as const)
          : reason.includes("availability")
            ? ("availability" as const)
            : ("skill" as const),
        strength: "required" as const,
        reason,
      })),
      ...(evidence?.unknown ?? []).map((reason) => ({
        kind: reason.includes("availability") ? ("availability" as const) : ("trust" as const),
        strength: "unknown" as const,
        reason: `${reason} is unknown`,
      })),
    ];
    const r: SupplyResult = {
      ...draft,
      supplyType: draft.supplyType ?? typeFor(draft.band),
      status: draft.status ?? "ACTIVE",
      signals,
      reasons: draft.reasons ?? draft.why,
      confidence: draft.confidence ?? confidence(signals),
      freshness: draft.freshness ?? evidence?.freshness ?? "unknown",
      trust: draft.trust ?? trust(evidence?.verification ?? "not_applicable"),
      provenance: draft.provenance ?? {
        origin: draft.personId
          ? "person"
          : draft.band === "community"
            ? "community"
            : "internal_listing",
        label: draft.personId ? "Stated by this person" : "Published in The Living World",
        sourceId: draft.id,
      },
      constraints:
        draft.constraints ?? constraints(evidence?.passed ?? [], evidence?.unknown ?? []),
    };
    if (results.filter((x) => x.band === r.band).length >= perBand) return;
    results.push(r);
    trace.push({
      candidateId: r.id,
      outcome: "included",
      reasonCodes: r.signals.map((signal) => signal.kind),
    });
  };

  // 1 & 2 — what someone has actually posted, offering this.
  for (const entry of entries) {
    const hit = matchTerms([entry.title, entry.summary, ...(entry.skills ?? [])].join(" "), words);
    if (!hit) continue;
    const isOffer = entry.layer === "work" || entry.kind === "skill" || entry.cost < 0;
    if (!isOffer) continue;
    if (need.placeId && entry.placeId && entry.placeId !== need.placeId) continue;
    push({
      id: entry.id,
      band: "direct",
      title: entry.title,
      what: entry.kind === "skill" ? "An offer of a skill" : "A posted opportunity",
      where: `${entry.place}, ${entry.neighbourhood}`,
      when: entry.when,
      why: [
        `Mentions "${hit}"`,
        entry.community ? "Posted by someone here themselves" : "From the demonstration world",
      ],
      caveat: BAND_CAVEAT.direct,
      actions: ["view", "save", "contact"],
    });
  }

  // 3 — people who say they can do it, and nothing more is claimed.
  // 4 — people who additionally said they're open to this kind of thing.
  for (const person of people) {
    if (person.discoveryStatus === "REPORTED" || person.discoveryStatus === "EXPIRED") {
      diagnostics.excludedByStatus += 1;
      trace.push({
        candidateId: person.id,
        outcome: "excluded",
        reasonCodes: [person.discoveryStatus.toLowerCase()],
      });
      continue;
    }
    if (!inArea(person, need)) {
      diagnostics.excludedByPlace += 1;
      continue;
    }
    const visibleCurrent = person.capabilities.filter((candidate) =>
      usableCapability(candidate, now),
    );
    if (person.capabilities.length && !visibleCurrent.length) {
      diagnostics.excludedByFreshness += 1;
      continue;
    }
    const qualification = need.requiredQualifications.length
      ? visibleCurrent.find(
          (candidate) =>
            candidate.kind === "qualification" &&
            matchTerms(
              candidate.label,
              need.requiredQualifications.flatMap((item) =>
                needTerms({ ...need, category: item, title: "", requiredSkills: [] }),
              ),
            ),
        )
      : null;
    if (need.requiredQualifications.length && !qualification) {
      diagnostics.excludedByQualification += 1;
      continue;
    }
    const capability = visibleCurrent.find((c) => matchTerms(c.label, words));
    if (!capability) {
      diagnostics.excludedByCapability += 1;
      continue;
    }

    const openTo = person.preferences.some((p) =>
      need.paymentType === "paid"
        ? [
            "paid_work",
            "one_off_work",
            "recurring_work",
            "casual_work",
            "professional_services",
          ].includes(p)
        : ["helping_people", "volunteering", "community_projects", "skills_exchange"].includes(p),
    );
    const window = overlapsNeedTime(person, need);
    const fixedConflict = Boolean(
      need.startsAt && person.availability.length > 0 && !window && need.flexibility === "fixed",
    );
    if (fixedConflict && openTo) diagnostics.excludedByTime += 1;

    if (openTo && !fixedConflict) {
      usedPeople.add(person.id);
      push({
        id: `person-open-${person.id}`,
        personId: person.id,
        ...(person.photoUrl ? { photoUrl: person.photoUrl } : {}),
        band: "open_to_opportunities",
        title: person.displayName,
        what: `Says they can: ${capability.label}`,
        where: person.placeName,
        when: window ? "Has said they're free around then" : "Hasn't said when they're free",
        why: [
          `${capability.kind === "qualification" ? "Qualified in" : "Says they can"} ${capability.label}`,
          "Has opted into being found for this kind of thing",
          ...(window ? ["An availability window they set overlaps your time"] : []),
        ],
        caveat: BAND_CAVEAT.open_to_opportunities,
        actions: ["contact", "view"],
        evidence: {
          passed: [
            "capability",
            "service area",
            "opportunity preference",
            ...(qualification ? ["required qualification"] : []),
            ...(window ? ["availability overlap"] : []),
          ],
          unknown: window ? [] : ["availability"],
          freshness: freshness({
            lastConfirmedAt: capability.lastConfirmedAt,
            expiresAt: capability.expiresOn,
            kind: "capability",
            now,
          }),
          verification: capability.verification,
        },
      });
      continue;
    }

    // Someone who only said they'd swap belongs in the swap band, not here.
    if (person.preferences.includes("skills_exchange")) continue;

    usedPeople.add(person.id);
    push({
      id: `person-cap-${person.id}`,
      personId: person.id,
      ...(person.photoUrl ? { photoUrl: person.photoUrl } : {}),
      band: "local_capability",
      title: person.displayName,
      what: `Says they can: ${capability.label}`,
      where: person.placeName,
      when: "Nothing said about availability",
      why: [`Lists ${capability.label} on their profile`],
      caveat: BAND_CAVEAT.local_capability,
      actions: ["view"],
      evidence: {
        passed: [
          "capability",
          "service area",
          ...(qualification ? ["required qualification"] : []),
        ],
        unknown: ["availability", "opportunity preference"],
        freshness: freshness({
          lastConfirmedAt: capability.lastConfirmedAt,
          expiresAt: capability.expiresOn,
          kind: "capability",
          now,
        }),
        verification: capability.verification,
      },
    });
  }

  // 5 & 6 — community things, and freely offered help.
  for (const entry of entries) {
    const hit = matchTerms([entry.title, entry.summary, entry.give ?? ""].join(" "), words);
    if (!hit) continue;
    if (entry.layer === "community") {
      push({
        id: `community-${entry.id}`,
        band: "community",
        title: entry.title,
        what: "Something community-run",
        where: `${entry.place}, ${entry.neighbourhood}`,
        when: entry.when,
        why: [`Community listing mentioning "${hit}"`, ...(entry.give ? [entry.give] : [])],
        caveat: BAND_CAVEAT.community,
        actions: ["view", "join", "save"],
      });
    } else if (entry.cost === 0 && entry.give) {
      push({
        id: `contribution-${entry.id}`,
        band: "contribution",
        title: entry.title,
        what: "An offer of help, freely given",
        where: `${entry.place}, ${entry.neighbourhood}`,
        when: entry.when,
        why: [entry.give],
        caveat: BAND_CAVEAT.contribution,
        actions: ["view", "contact"],
      });
    }
  }

  // 7 — a swap, where the other person actually wants something back.
  for (const person of people) {
    if (usedPeople.has(person.id)) continue;
    const capability = person.capabilities.find(
      (c) => usableCapability(c, now) && matchTerms(c.label, words),
    );
    if (!capability) continue;
    if (!person.preferences.includes("skills_exchange")) continue;
    push({
      id: `exchange-${person.id}`,
      personId: person.id,
      ...(person.photoUrl ? { photoUrl: person.photoUrl } : {}),
      band: "skills_exchange",
      title: person.displayName,
      what: `Would swap: ${capability.label}`,
      where: person.placeName,
      when: "To be agreed between you",
      why: [
        `Says they can ${capability.label}`,
        ...(person.wantsToLearn.length
          ? [`Would like something back: ${person.wantsToLearn.join(", ")}`]
          : []),
      ],
      caveat: BAND_CAVEAT.skills_exchange,
      actions: ["contact", "view"],
    });
  }

  // 8 — travellers who explicitly opted in. Never a live location.
  for (const person of people) {
    if (person.discoveryStatus === "REPORTED" || person.discoveryStatus === "EXPIRED") continue;
    if (!person.preferences.includes("travelling_opportunities")) continue;
    const visibleCurrent = person.capabilities.filter((candidate) =>
      usableCapability(candidate, now),
    );
    const capability = visibleCurrent.find((c) => matchTerms(c.label, words));
    if (!capability) continue;
    const qualification = need.requiredQualifications.length
      ? visibleCurrent.find(
          (candidate) =>
            candidate.kind === "qualification" &&
            matchTerms(
              candidate.label,
              need.requiredQualifications.flatMap((item) =>
                item
                  .toLowerCase()
                  .split(/[^a-zà-ÿ]+/)
                  .filter((word) => word.length > 3),
              ),
            ),
        )
      : null;
    if (need.requiredQualifications.length && !qualification) continue;
    const journey = person.journeys?.find((candidate) =>
      journeyOverlaps(candidate, need.placeId, need.startsAt, need.endsAt),
    );
    const legacyRoute =
      !person.journeys?.length &&
      need.placeId &&
      (person.travellingThroughPlaceIds ?? []).includes(need.placeId);
    if (!journey && !legacyRoute) continue;
    push({
      id: `journey-${person.id}`,
      personId: person.id,
      ...(person.photoUrl ? { photoUrl: person.photoUrl } : {}),
      band: "journey",
      title: person.displayName,
      what: `Travelling, and can ${capability.label}`,
      where: `Passing through ${person.placeName}`,
      when:
        journey && need.startsAt
          ? "Their shared journey window overlaps this time"
          : "Depends entirely on their plans",
      why: [
        `Says they can ${capability.label}`,
        "Has opted into opportunities while travelling",
        ...(journey ? ["Their public journey overlaps this place and time"] : []),
      ],
      caveat: BAND_CAVEAT.journey,
      actions: ["contact"],
      evidence: {
        passed: [
          "current capability",
          "journey opt-in",
          "route overlap",
          ...(journey ? ["journey time overlap"] : []),
          ...(qualification ? ["required qualification"] : []),
        ],
        unknown: journey ? ["availability"] : ["journey dates", "availability"],
        freshness: freshness({
          lastConfirmedAt: capability.lastConfirmedAt,
          expiresAt: capability.expiresOn,
          kind: "capability",
          now,
        }),
        verification: capability.verification,
      },
    });
  }

  // A real adjacent possibility, never filler: related words or category must be present.
  for (const entry of entries) {
    if (results.some((result) => result.id === entry.id || result.id.endsWith(entry.id))) continue;
    const categoryHit = need.requiredSkills.some((skill) =>
      (entry.skills ?? []).some(
        (candidate) =>
          candidate.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(candidate.toLowerCase()),
      ),
    );
    const nearby = !need.placeId || !entry.placeId || need.placeId === entry.placeId;
    if (!categoryHit || !nearby) continue;
    push({
      id: `related-${entry.id}`,
      band: "related",
      title: entry.title,
      what: "A related possibility",
      where: `${entry.place}, ${entry.neighbourhood}`,
      when: entry.when,
      why: ["Shares a skill with what you asked for"],
      caveat: BAND_CAVEAT.related,
      actions: ["view", "save"],
    });
  }

  const ordered = BAND_ORDER.flatMap((band) => results.filter((r) => r.band === band));
  return {
    need,
    results: ordered,
    quiet: ordered.length === 0,
    bandsSearched: BAND_ORDER,
    diagnostics,
    trace,
  };
}

export function whatElse(input: SupplyInput): SupplyAnswer {
  const answer = findSupply(input);
  return { ...answer, results: answer.results.filter((result) => result.supplyType !== "DIRECT") };
}

export function whoCouldMakeThisHappen(input: SupplyInput): SupplyAnswer {
  const answer = findSupply(input);
  return { ...answer, results: answer.results.filter((result) => Boolean(result.personId)) };
}

export { whenText as needWhenText };
