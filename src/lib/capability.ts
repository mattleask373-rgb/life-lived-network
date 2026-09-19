/**
 * Capabilities.
 *
 * The whole point of this file is what it refuses to do. A skill is not a
 * role. A role is not a qualification. A qualification is not experience.
 * None of them mean a person is available, professional, insured or willing
 * to work. Every one of those is a separate stored fact, stated by the person
 * themselves.
 */

export type CapabilityKind = "role" | "skill" | "qualification" | "experience";

export type CapabilityLevel =
  | "unstated"
  | "learning"
  | "confident"
  | "years_of_it"
  | "professional";

export type VerificationState =
  | "unverified"
  | "self_stated"
  | "evidence_provided"
  | "checked";

export interface Capability {
  id: string;
  userId: string;
  kind: CapabilityKind;
  label: string;
  level: CapabilityLevel;
  evidence: string;
  verification: VerificationState;
}

export interface ServiceArea {
  id: string;
  userId: string;
  placeId: string;
  radiusKm: number;
  note: string;
}

export interface AvailabilityWindow {
  id: string;
  userId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  recurrence: string;
  note: string;
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

export const CAPABILITY_KINDS: { id: CapabilityKind; label: string; blurb: string }[] = [
  { id: "role", label: "Something I do", blurb: "How you'd describe the work itself" },
  { id: "skill", label: "Something I'm good at", blurb: "Not a claim to be a professional" },
  { id: "qualification", label: "Something I'm qualified in", blurb: "A real certificate or licence" },
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

export const VERIFICATION_LABEL: Record<VerificationState, string> = {
  unverified: "Not checked",
  self_stated: "Said so themselves",
  evidence_provided: "Sent something to back it up",
  checked: "Checked",
};
