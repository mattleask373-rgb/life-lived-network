/**
 * Needs — a first-class entity.
 *
 * One shape covers paid work, help, community projects, volunteering and
 * skills exchange. There is deliberately no gardener model, no cleaner model
 * and no volunteering model: those are categories and intents of the same
 * Need.
 *
 * Times are real timestamps with a timezone. "Thursday 2pm" is not a moment
 * until you know where in the world it is.
 */

export type NeedIntent =
  | "paid_work"
  | "one_off_work"
  | "recurring_work"
  | "professional_service"
  | "help"
  | "community_project"
  | "volunteering"
  | "skills_exchange";

export type PaymentType = "paid" | "exchange" | "contribution" | "unsure";

/**
 * What the money actually means. A bare number says nothing: "£40" could be
 * the whole job, the hourly rate, or a hopeful guess.
 */
export type PaymentModel =
  | "free"
  | "fixed"
  | "from"
  | "range"
  | "donation"
  | "exchange"
  | "unpaid"
  | "ask_them"
  | "unknown";
export type Flexibility = "fixed" | "some" | "very";
export type Urgency = "today" | "soon" | "whenever";
export type NeedVisibility = "private" | "local_discovery" | "public";
export type NeedStatus = "open" | "met" | "withdrawn" | "expired";

export interface Need {
  id: string;
  creatorId: string;
  category: string;
  title: string;
  description: string;
  intent: NeedIntent;
  placeId: string | null;
  placeText: string;
  lat: number | null;
  lng: number | null;
  timezone: string;
  startsAt: string | null;
  endsAt: string | null;
  durationMinutes: number | null;
  flexibility: Flexibility;
  budget: number | null;
  currency: string;
  paymentType: PaymentType;
  budgetMax: number | null;
  paymentModel: PaymentModel;
  requiredSkills: string[];
  /** A role is not a skill: "a plumber" and "can fix a tap" differ. */
  requiredRoles: string[];
  requiredQualifications: string[];
  preferredExperience: string;
  /** When the person last said this is still needed. */
  lastConfirmedAt: string;
  recurring: boolean;
  urgency: Urgency;
  contactPreference: string;
  visibility: NeedVisibility;
  status: NeedStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NeedRow {
  id: string;
  creator_id: string;
  category: string;
  title: string;
  description: string;
  intent: string;
  place_id: string | null;
  place_text: string;
  lat: number | string | null;
  lng: number | string | null;
  timezone: string;
  starts_at: string | null;
  ends_at: string | null;
  duration_minutes: number | null;
  flexibility: string;
  budget: number | string | null;
  currency: string;
  payment_type: string;
  required_skills: string[];
  required_qualifications: string[];
  preferred_experience: string;
  recurring: boolean;
  urgency: string;
  contact_preference: string;
  visibility: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/** The deliberate boundary between a database row and the app's Need. */
export function rowToNeed(row: NeedRow): Need {
  return {
    id: row.id,
    creatorId: row.creator_id,
    category: row.category,
    title: row.title,
    description: row.description,
    intent: row.intent as NeedIntent,
    placeId: row.place_id,
    placeText: row.place_text,
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    timezone: row.timezone,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    flexibility: row.flexibility as Flexibility,
    budget: row.budget === null ? null : Number(row.budget),
    currency: row.currency,
    paymentType: row.payment_type as PaymentType,
    requiredSkills: row.required_skills ?? [],
    requiredQualifications: row.required_qualifications ?? [],
    preferredExperience: row.preferred_experience,
    recurring: row.recurring,
    urgency: row.urgency as Urgency,
    contactPreference: row.contact_preference,
    visibility: row.visibility as NeedVisibility,
    status: row.status as NeedStatus,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const NEED_INTENTS: { id: NeedIntent; label: string; blurb: string }[] = [
  { id: "paid_work", label: "Paid work", blurb: "You'd pay someone for this" },
  { id: "one_off_work", label: "A one-off job", blurb: "Once, not ongoing" },
  { id: "recurring_work", label: "Something regular", blurb: "Every week or month" },
  { id: "professional_service", label: "A professional", blurb: "Qualified, insured, registered" },
  { id: "help", label: "A hand", blurb: "Someone to help you out" },
  { id: "community_project", label: "Help with a community project", blurb: "Shared, local, not for profit" },
  { id: "volunteering", label: "Volunteers", blurb: "Given time" },
  { id: "skills_exchange", label: "A swap", blurb: "You'd give something back in kind" },
];

export const URGENCIES: { id: Urgency; label: string }[] = [
  { id: "today", label: "Today, if possible" },
  { id: "soon", label: "In the next week or two" },
  { id: "whenever", label: "No rush" },
];

export const FLEXIBILITIES: { id: Flexibility; label: string }[] = [
  { id: "fixed", label: "It has to be that time" },
  { id: "some", label: "There's some give in it" },
  { id: "very", label: "Almost any time works" },
];
