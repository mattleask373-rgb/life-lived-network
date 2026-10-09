/**
 * Earning — a reading of existing Needs, not a new engine.
 *
 * Everything here works on opportunities already produced by the canonical
 * reciprocal/supply path. It never estimates earnings, never infers demand,
 * and treats every amount as integer minor units (cents/pence).
 */
import type { Need, NeedIntent } from "./needs";

export const PAID_INTENTS: NeedIntent[] = [
  "paid_work",
  "one_off_work",
  "recurring_work",
  "professional_service",
];

/** Paid only when the asker said so: an intent of paid work, or a paid payment type. */
export function isPaidNeed(need: Pick<Need, "intent" | "paymentType" | "paymentModel">): boolean {
  if (need.paymentModel === "exchange" || need.paymentModel === "unpaid") return false;
  return PAID_INTENTS.includes(need.intent) || need.paymentType === "paid";
}

/** Convert a stored decimal amount to integer minor units exactly once, at the boundary. */
export function toMinorUnits(amount: number | null): number | null {
  if (amount === null || !Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

export function formatMinor(cents: number, currency: string, locale = "en-GB"): string {
  const whole = Math.trunc(cents / 100);
  const rest = Math.abs(cents % 100);
  const value = Number(`${whole}.${String(rest).padStart(2, "0")}`);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: rest === 0 ? 0 : 2,
  }).format(value);
}

/** What the asker said about pay, in words. Never a guess. */
export function describePay(
  need: Pick<Need, "budget" | "budgetMax" | "currency" | "paymentModel">,
): string {
  const lo = toMinorUnits(need.budget);
  const hi = toMinorUnits(need.budgetMax);
  const c = need.currency;
  switch (need.paymentModel) {
    case "fixed":
      return lo !== null ? formatMinor(lo, c) : "A set amount, not stated";
    case "from":
      return lo !== null ? `From ${formatMinor(lo, c)}` : "Amount not stated";
    case "range":
      if (lo !== null && hi !== null) return `${formatMinor(lo, c)}–${formatMinor(hi, c)}`;
      return lo !== null ? `From ${formatMinor(lo, c)}` : "Range not stated";
    case "ask_them":
      return "Ask them about pay";
    case "donation":
      return "Whatever feels right";
    case "free":
      return "Nothing to pay";
    default:
      return lo !== null ? formatMinor(lo, c) : "Pay not stated";
  }
}

/**
 * Skills and qualifications that real paid needs asked for and the person has
 * not said they have. Counted from real needs only; an empty list is honest.
 */
export function skillGaps(
  needs: Pick<Need, "requiredSkills" | "requiredQualifications">[],
  stated: string[],
): { label: string; askedBy: number }[] {
  const have = new Set(stated.map((s) => s.trim().toLowerCase()));
  const counts = new Map<string, { label: string; askedBy: number }>();
  for (const need of needs) {
    const asked = new Set(
      [...need.requiredSkills, ...need.requiredQualifications].map((s) => s.trim()).filter(Boolean),
    );
    for (const label of asked) {
      const key = label.toLowerCase();
      if (have.has(key)) continue;
      const row = counts.get(key) ?? { label, askedBy: 0 };
      row.askedBy += 1;
      counts.set(key, row);
    }
  }
  return [...counts.values()].sort(
    (a, b) => b.askedBy - a.askedBy || a.label.localeCompare(b.label),
  );
}
