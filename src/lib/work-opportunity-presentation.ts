import { isPublishableWorkOpportunity, type WorkOpportunity } from "./work-opportunities";
import type { WorldEntry } from "./world-data";

export interface WorkOpportunityFact {
  label: string;
  value: string;
}

const ARRANGEMENT_LABEL: Record<WorkOpportunity["arrangement"], string> = {
  short_term: "Short-term",
  seasonal: "Seasonal",
  longer_term: "Longer-term",
  professional: "Professional",
};

const ENGAGEMENT_LABEL: Record<WorkOpportunity["engagementKind"], string> = {
  paid_work: "Paid work",
  volunteering: "Volunteering",
  skills_exchange: "Skills exchange",
  unpaid_training: "Unpaid training",
  not_stated: "Engagement type not stated",
};

function statedPay(compensation: WorkOpportunity["compensation"]): string {
  if (compensation.status === "not_stated") return "Pay not stated";
  if (compensation.status === "explicitly_unpaid") {
    return `Explicitly unpaid — ${compensation.classification.replaceAll("_", " ")}`;
  }

  try {
    // Currency digit precision comes from Intl, not a global assumption that every
    // currency uses two decimals. amountCents is stored as integer minor units.
    const formatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency: compensation.currency,
    });
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits;
    const amount = compensation.amountCents / 10 ** fractionDigits;
    return `${formatter.format(amount)} per ${compensation.basis}`;
  } catch {
    return `${compensation.amountCents} minor units ${compensation.currency} per ${compensation.basis}`;
  }
}

/** Formatted facts only; absent or uncertain fields are never inferred. */
export function workOpportunityFacts(opportunity: WorkOpportunity): WorkOpportunityFact[] {
  return [
    { label: "Arrangement", value: ARRANGEMENT_LABEL[opportunity.arrangement] },
    { label: "Engagement", value: ENGAGEMENT_LABEL[opportunity.engagementKind] },
    { label: "Pay", value: statedPay(opportunity.compensation) },
    {
      label: "Duration",
      value: opportunity.duration
        ? `${opportunity.duration.amount} ${opportunity.duration.unit}`
        : "Duration not stated",
    },
    {
      label: "Dates",
      value:
        opportunity.startDate || opportunity.endDate
          ? [
              opportunity.startDate ? `Starts ${opportunity.startDate}` : null,
              opportunity.endDate ? `Ends ${opportunity.endDate}` : null,
            ]
              .filter((value): value is string => value !== null)
              .join(" · ")
          : "Dates not stated",
    },
    {
      label: "Accommodation",
      value: {
        offered: "Offered",
        not_offered: "Not offered",
        not_stated: "Not stated",
      }[opportunity.accommodation],
    },
    {
      label: "Conditions",
      value: opportunity.conditions.length
        ? opportunity.conditions.join(" · ")
        : "Conditions not stated",
    },
    ...(opportunity.skillRequirements.length
      ? [{ label: "Skills requested", value: opportunity.skillRequirements.join(" · ") }]
      : []),
    ...(opportunity.hostExpectations.length
      ? [{ label: "Host expectations", value: opportunity.hostExpectations.join(" · ") }]
      : []),
    ...(opportunity.transportNotes?.trim()
      ? [{ label: "Transport", value: opportunity.transportNotes.trim() }]
      : []),
  ];
}

/** A card can appear publicly only for a real, current, approved, rights-cleared record. */
export function hasPublicWorkOpportunity(entry: WorldEntry): boolean {
  return (
    entry.layer === "work" &&
    !entry.demonstration &&
    !entry.cancellation &&
    entry.quality !== "expired" &&
    entry.quality !== "may have changed" &&
    isPublishableWorkOpportunity(entry.workOpportunity)
  );
}

export function publicWorkOpportunityEntries(entries: WorldEntry[]): WorldEntry[] {
  return entries.filter(hasPublicWorkOpportunity);
}

/**
 * "Today" is a date-coverage check, not an availability inference. Records without
 * both endpoints stay out because an unknown start/end cannot establish the span.
 */
export function workOpportunityCoversDate(opportunity: WorkOpportunity, date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return Boolean(
    opportunity.startDate &&
    opportunity.endDate &&
    opportunity.startDate <= date &&
    opportunity.endDate >= date,
  );
}
