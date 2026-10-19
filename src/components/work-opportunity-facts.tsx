import {
  hasPublicWorkOpportunity,
  workOpportunityFacts,
} from "@/lib/work-opportunity-presentation";
import type { WorldEntry } from "@/lib/world-data";

function safeHttpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** The same recorded opportunity terms are used wherever an entry is shown. */
export function WorkOpportunityFacts({ entry }: { entry: WorldEntry }) {
  if (!hasPublicWorkOpportunity(entry) || !entry.workOpportunity) return null;

  const opportunity = entry.workOpportunity;
  const facts = workOpportunityFacts(opportunity);
  const provenance = opportunity.provenance;
  const sourceUrl = provenance.kind === "owner_declared" ? null : safeHttpUrl(provenance.sourceUrl);

  return (
    <section
      aria-label="Published work opportunity details"
      className="mt-3 rounded-lg border border-border bg-background p-3 text-sm"
    >
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
        Published work opportunity
      </h3>
      <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="mt-0.5 break-words">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Source: {provenance.sourceName}
        {sourceUrl ? (
          <>
            {" · "}
            <a href={sourceUrl} target="_blank" rel="noreferrer noopener" className="underline">
              Check source
            </a>
          </>
        ) : null}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Terms are shown as recorded. Confirm dates and conditions with the named source; this page
        does not guarantee a place, pay, or availability.
      </p>
    </section>
  );
}
