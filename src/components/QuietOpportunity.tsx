/**
 * QuietOpportunity — honest presentation of a local supply gap.
 *
 * Renders only when an AcquisitionOpportunity is actionable (ZERO_SUPPLY or
 * WEAK_SUPPLY). Never invents providers, demand, or activity.
 *
 * This is a pure presentation component. It does not run findSupply() or
 * classifySupplyGap(); those remain upstream.
 *
 * Tone: warm, invitational, never urgent or gamified.
 * "It's quiet here for this. Want to help make something happen?"
 */

import type { AcquisitionOpportunity } from "@/lib/acquisition-opportunity";

interface QuietOpportunityProps {
  opportunity: AcquisitionOpportunity;
  /** Optional link target for the claim/onboard flow (still human-gated). */
  claimHref?: string;
}

export function QuietOpportunity({ opportunity, claimHref }: QuietOpportunityProps) {
  if (!opportunity.actionable) return null;

  const subjectLabel = opportunity.subject || opportunity.category.replaceAll("_", " ");
  const isZero = opportunity.gapStatus === "ZERO_SUPPLY";

  return (
    <section
      className="card-paper mt-6 max-w-2xl border-dashed p-5"
      aria-label="Local supply opportunity"
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {isZero ? "It's quiet here for this" : "Sparse supply recorded"}
      </p>

      <h2 className="mt-2 text-xl leading-snug">
        {isZero
          ? `No known ${subjectLabel} yet in ${opportunity.localityName}`
          : `Only weak or related ${subjectLabel} results in ${opportunity.localityName}`}
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        {opportunity.reason} This is a fact about the Living World record, not a claim about the real
        place.
      </p>

      <p className="mt-3 text-sm">
        Want to help make something happen? If you can offer this kind of work in this area, you can
        claim the capability with evidence of what you can do, where you serve, and whether you are
        willing to be found.
      </p>

      <ul className="mt-3 list-inside list-disc text-xs text-muted-foreground">
        {opportunity.requiredEvidence.slice(0, 4).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {claimHref ? (
        <p className="mt-4">
          <a
            className="inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            href={claimHref}
          >
            Offer this capability
          </a>
        </p>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Provider claim / onboarding flow is still being prepared. No outreach happens from this
          surface.
        </p>
      )}
    </section>
  );
}
