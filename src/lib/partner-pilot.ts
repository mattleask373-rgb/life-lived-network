/**
 * Founding Local Partner pilot — validation only.
 *
 * Nothing here charges, subscribes or persists to the backend. The price is a
 * hypothesis under test, held in integer cents. Interest forms are not sent
 * anywhere yet; the tracker lives only in the browser that uses it.
 */
import { z } from "zod";

export const PROPOSED_PRICE_CENTS = 1900;
export const PROPOSED_CURRENCY = "EUR";

export function formatCents(cents: number, currency = PROPOSED_CURRENCY): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(cents / 100);
}

export const ORG_TYPES = [
  "Independent shop or café",
  "Community group or charity",
  "Venue or events",
  "Local service provider",
  "Social enterprise",
  "Other",
] as const;

export const interestInput = z.object({
  organisation: z.string().trim().min(1, "Add your organisation's name").max(120),
  contactName: z.string().trim().min(1, "Add a name we can use").max(80),
  email: z.string().trim().email("That email doesn't look right").max(255),
  locality: z.string().trim().min(1, "Which town or neighbourhood?").max(120),
  orgType: z.enum(ORG_TYPES, { message: "Choose the closest type" }),
  challenge: z.string().trim().min(1, "Tell us briefly how people find you today").max(600),
  notes: z.string().trim().max(1000).default(""),
  consent: z.literal(true, { message: "We need your permission to follow up" }),
});

export type InterestInput = z.input<typeof interestInput>;

/** A plain-text copy a person can send themselves; never auto-sent. */
export function interestSummary(i: z.output<typeof interestInput>): string {
  return [
    "Founding Local Partner — expression of interest (non-binding)",
    `Organisation: ${i.organisation}`,
    `Contact: ${i.contactName} <${i.email}>`,
    `Locality: ${i.locality}`,
    `Type: ${i.orgType}`,
    `How people find us today: ${i.challenge}`,
    i.notes ? `Notes: ${i.notes}` : null,
    "Consent to follow-up: yes",
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------- Internal tracker (this device only) ----------

export const CONTACT_STATUSES = ["not contacted", "contacted", "replied", "declined"] as const;

export interface TrackerRow {
  id: string;
  organisation: string;
  locality: string;
  status: (typeof CONTACT_STATUSES)[number];
  interviewed: boolean;
  strongInterest: boolean;
  /** Said yes to the proposed price, subject to written terms. Not a payment. */
  priceCommitment: boolean;
  notes: string;
}

/** Internal hypotheses for this pilot — not benchmarks. */
export const TARGETS = {
  contacted: { min: 15, max: 20, label: "Organisations contacted" },
  interviews: { min: 8, max: 10, label: "Interviews completed" },
  strongInterest: { min: 5, label: "Strong interest" },
  priceCommitments: { min: 3, label: "Price commitments (subject to written terms)" },
} as const;

export function scorecard(rows: TrackerRow[]) {
  return {
    contacted: rows.filter((r) => r.status !== "not contacted").length,
    interviews: rows.filter((r) => r.interviewed).length,
    strongInterest: rows.filter((r) => r.strongInterest).length,
    priceCommitments: rows.filter((r) => r.priceCommitment).length,
  };
}

const KEY = "rwa.partner-tracker.v1";

export function readTracker(): TrackerRow[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? (parsed as TrackerRow[]) : [];
  } catch {
    return [];
  }
}

export function writeTracker(rows: TrackerRow[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}
