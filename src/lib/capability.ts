/**
 * Capabilities.
 *
 * The whole point of this file is what it refuses to do. A skill is not a
 * role. A role is not a qualification. A qualification is not experience.
 * None of them mean a person is available, professional, insured or willing
 * to work. Every one of those is a separate stored fact, stated by the person
 * themselves.
 *
 * Nothing here is ever inferred, scored or merged. Each fact carries who said
 * it, when they last confirmed it, how visible they want it, and whether
 * anyone has actually checked it.
 */

export type CapabilityKind = "role" | "skill" | "qualification" | "experience";

export type CapabilityLevel =
  "unstated" | "learning" | "confident" | "years_of_it" | "professional";

/**
 * Being checked is not one badge. Each of these is a different fact about a
 * different thing, and the default is that nobody has checked anything.
 */
export type VerificationState =
  | "unverified"
  | "self_stated"
  | "evidence_provided"
  | "identity_checked"
  | "qualification_checked"
  | "business_checked"
  | "experience_confirmed"
  | "community_confirmed"
  | "checked";

/** Privacy is per fact, not per person. */
export type Visibility = "private" | "local_discovery" | "public";

export interface Capability {
  id: string;
  userId: string;
  kind: CapabilityKind;
  label: string;
  level: CapabilityLevel;
  evidence: string;
  verification: VerificationState;
  visibility: Visibility;
  /** When the person last said this is still true. */
  lastConfirmedAt: string;
  /** Qualification detail. Meaningless on other kinds, so left empty. */
  issuingBody: string;
  obtainedOn: string | null;
  expiresOn: string | null;
  /** Experience detail. */
  organisation: string;
  yearsExperience: number | null;
  startedOn: string | null;
  endedOn: string | null;
}

export interface CapabilityRow {
  id: string;
  user_id: string;
  kind: string;
  label: string;
  level: string;
  evidence: string;
  verification: string;
  visibility?: string | null;
  last_confirmed_at?: string | null;
  issuing_body?: string | null;
  obtained_on?: string | null;
  expires_on?: string | null;
  organisation?: string | null;
  years_experience?: number | string | null;
  started_on?: string | null;
  ended_on?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** The deliberate boundary between a database row and a stated capability. */
export function rowToCapability(row: CapabilityRow): Capability {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as CapabilityKind,
    label: row.label,
    level: row.level as CapabilityLevel,
    evidence: row.evidence ?? "",
    verification: (row.verification || "unverified") as VerificationState,
    visibility: (row.visibility || "local_discovery") as Visibility,
    lastConfirmedAt: row.last_confirmed_at ?? row.updated_at ?? row.created_at ?? "",
    issuingBody: row.issuing_body ?? "",
    obtainedOn: row.obtained_on ?? null,
    expiresOn: row.expires_on ?? null,
    organisation: row.organisation ?? "",
    yearsExperience:
      row.years_experience === null || row.years_experience === undefined
        ? null
        : Number(row.years_experience),
    startedOn: row.started_on ?? null,
    endedOn: row.ended_on ?? null,
  };
}

/** Serving an area is not living in it, and neither is passing through it. */
export type AreaRelation = "serves" | "available_in" | "travelling_through";

export type TravelWillingness = "local" | "will_travel" | "anywhere";

export interface ServiceArea {
  id: string;
  userId: string;
  placeId: string;
  radiusKm: number;
  note: string;
  relation: AreaRelation;
  travelWillingness: TravelWillingness;
  visibility: Visibility;
}

export interface AvailabilityWindow {
  id: string;
  userId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  recurrence: string;
  note: string;
  visibility: Visibility;
  /** Availability goes out of date faster than anything else. */
  expiresAt: string | null;
  lastConfirmedAt: string;
}

export type OpportunityPreference =
  | "paid_work"
  | "one_off_work"
  | "recurring_work"
  | "professional_services"
  | "casual_work"
  | "skills_exchange"
  | "community_projects"
  | "helping_people"
  | "volunteering"
  | "travelling_opportunities";

/** What someone will actually give. Separate from what they're open to. */
export type ContributionKind =
  | "time"
  | "skills"
  | "labour"
  | "knowledge"
  | "tools"
  | "vehicle"
  | "transport"
  | "music"
  | "creativity"
  | "translation"
  | "food"
  | "accommodation"
  | "mentoring";

export type EarningPreference = "wants_paid" | "not_for_money" | "either" | "unstated";

export interface ContributionPreference {
  id: string;
  userId: string;
  contribution: ContributionKind;
  note: string;
  visibility: Visibility;
}

export const CAPABILITY_KINDS: { id: CapabilityKind; label: string; blurb: string }[] = [
  { id: "role", label: "Something I do", blurb: "How you'd describe the work itself" },
  { id: "skill", label: "Something I'm good at", blurb: "Not a claim to be a professional" },
  {
    id: "qualification",
    label: "Something I'm qualified in",
    blurb: "A real certificate or licence",
  },
  { id: "experience", label: "Something I've done", blurb: "Where and for how long" },
];

export const CAPABILITY_LEVELS: { id: CapabilityLevel; label: string }[] = [
  { id: "unstated", label: "Rather not say" },
  { id: "learning", label: "Still learning" },
  { id: "confident", label: "Confident with it" },
  { id: "years_of_it", label: "Years of it" },
  { id: "professional", label: "It's my profession" },
];

export const PREFERENCES: { id: OpportunityPreference; label: string }[] = [
  { id: "paid_work", label: "Paid work" },
  { id: "one_off_work", label: "One-off jobs" },
  { id: "recurring_work", label: "Something regular" },
  { id: "professional_services", label: "Professional work in my field" },
  { id: "casual_work", label: "Casual work" },
  { id: "skills_exchange", label: "Swapping skills" },
  { id: "community_projects", label: "Community projects" },
  { id: "helping_people", label: "Helping people out" },
  { id: "volunteering", label: "Volunteering" },
  { id: "travelling_opportunities", label: "Things to do while I'm travelling" },
];

export const CONTRIBUTIONS: { id: ContributionKind; label: string }[] = [
  { id: "time", label: "My time" },
  { id: "skills", label: "A skill of mine" },
  { id: "labour", label: "A pair of hands" },
  { id: "knowledge", label: "What I know" },
  { id: "tools", label: "Tools" },
  { id: "vehicle", label: "A van or car" },
  { id: "transport", label: "A lift" },
  { id: "music", label: "Music" },
  { id: "creativity", label: "Something creative" },
  { id: "translation", label: "Translation" },
  { id: "food", label: "Food" },
  { id: "accommodation", label: "A room" },
  { id: "mentoring", label: "Mentoring someone" },
];

export const EARNING_PREFERENCES: { id: EarningPreference; label: string }[] = [
  { id: "wants_paid", label: "I'd want paying" },
  { id: "not_for_money", label: "Not for money" },
  { id: "either", label: "Either, depending" },
  { id: "unstated", label: "Rather not say" },
];

export const AREA_RELATIONS: { id: AreaRelation; label: string }[] = [
  { id: "serves", label: "I work in this area" },
  { id: "available_in", label: "I'm around here" },
  { id: "travelling_through", label: "Only passing through" },
];

export const VERIFICATION_LABEL: Record<VerificationState, string> = {
  unverified: "Not checked",
  self_stated: "Said so themselves",
  evidence_provided: "Sent something to back it up",
  identity_checked: "Identity checked",
  qualification_checked: "Qualification checked",
  business_checked: "Business checked",
  experience_confirmed: "Experience confirmed by someone",
  community_confirmed: "Confirmed by people here",
  checked: "Checked",
};
