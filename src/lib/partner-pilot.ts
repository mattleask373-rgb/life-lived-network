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

export const PRICE_RESPONSES = ["not asked", "yes (terms pending)", "maybe", "no"] as const;
export const EXPERIMENTS = [
  "Founding Local Partner",
  "Listing setup service",
  "Community/council pilot",
  "Event organiser tools",
] as const;

/** Pipeline fields added later; optional so v1 rows still load. */
export interface PipelineFields {
  nextAction?: string;
  /** YYYY-MM-DD, local date. */
  followUpDate?: string;
  priceResponse?: (typeof PRICE_RESPONSES)[number];
  experiment?: (typeof EXPERIMENTS)[number];
}
export type PipelineRow = TrackerRow & PipelineFields;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Coerce any stored value into a safe row, or drop it. Never invents values. */
export function normaliseRow(raw: unknown): PipelineRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Record<keyof PipelineRow, unknown>>;
  if (typeof r.id !== "string" || typeof r.organisation !== "string" || !r.organisation.trim())
    return null;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const oneOf = <T extends readonly string[]>(v: unknown, list: T): T[number] | undefined =>
    list.includes(v as string) ? (v as T[number]) : undefined;
  return {
    id: r.id,
    organisation: str(r.organisation, 120),
    locality: str(r.locality, 120),
    status: oneOf(r.status, CONTACT_STATUSES) ?? "not contacted",
    interviewed: r.interviewed === true,
    strongInterest: r.strongInterest === true,
    priceCommitment: r.priceCommitment === true,
    notes: str(r.notes, 2000),
    nextAction: str(r.nextAction, 200),
    followUpDate:
      typeof r.followUpDate === "string" && DATE_RE.test(r.followUpDate) ? r.followUpDate : "",
    priceResponse: oneOf(r.priceResponse, PRICE_RESPONSES) ?? "not asked",
    experiment: oneOf(r.experiment, EXPERIMENTS) ?? "Founding Local Partner",
  };
}

/** Rows with a follow-up date on or before today (YYYY-MM-DD), excluding declined. */
export function dueFollowUps(rows: PipelineRow[], today: string): PipelineRow[] {
  return rows
    .filter((r) => r.followUpDate && r.followUpDate <= today && r.status !== "declined")
    .sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? ""));
}

/** Per-experiment counts. Only counts what was recorded; zero means zero. */
export function experimentScorecard(rows: PipelineRow[]) {
  return EXPERIMENTS.map((name) => {
    const rs = rows.filter((r) => (r.experiment ?? "Founding Local Partner") === name);
    return {
      name,
      organisations: rs.length,
      interviews: rs.filter((r) => r.interviewed).length,
      priceYes: rs.filter((r) => r.priceResponse === "yes (terms pending)").length,
      priceMaybe: rs.filter((r) => r.priceResponse === "maybe").length,
      priceNo: rs.filter((r) => r.priceResponse === "no").length,
    };
  });
}

/** Local date as YYYY-MM-DD. */
export function localToday(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const KEY = "rwa.partner-tracker.v1";

export function readTracker(): PipelineRow[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.map(normaliseRow).filter((r): r is PipelineRow => r !== null)
      : [];
  } catch {
    return [];
  }
}

export function writeTracker(rows: PipelineRow[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}
