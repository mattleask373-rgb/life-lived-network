import { EntryCard } from "./entry-card";
import { BOOKING_LABEL, asBookingState, qualificationLine } from "@/lib/services";
import type { ProviderGroup } from "@/lib/locality";
import type { WorldEntry } from "@/lib/world-data";

/**
 * What's here: providers, and the practices and services they offer.
 *
 * An organisation reads as one part of the locality rather than an advert — its
 * practices, what is known about who provides them, and whether each can truly
 * be booked, asked about, or not yet at all. The component knows nothing about
 * any particular organisation; it renders whatever is stored.
 */
export function WhatsHere({
  groups,
  placeName,
  onOpen,
}: {
  groups: ProviderGroup[];
  placeName: string;
  onOpen: (entry: WorldEntry) => void;
}) {
  return (
    <section aria-labelledby="here" className="mt-10 scroll-mt-6" id="here">
      <h2 id="here-heading" className="text-2xl">
        What's here
      </h2>
      {groups.length === 0 ? (
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          No practices or services have been recorded in {placeName} yet. A practice, a studio, a
          tradesperson or a community service appears here once its own details are supplied.
        </p>
      ) : (
        <div className="mt-3 space-y-5">
          {groups.map((group) => (
            <div key={group.organisation || "unattached"} className="card-paper p-5">
              <h3 className="text-xl leading-tight">
                {group.organisation || "Services offered on their own"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {group.entries.length === 1
                  ? "One service recorded"
                  : `${group.entries.length} services recorded`}
                {" · "}
                {[
                  ...new Set(
                    group.entries.map((e) => BOOKING_LABEL[asBookingState(e.bookingState)]),
                  ),
                ].join(", ")}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {group.entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onOpen={onOpen}
                    note={qualificationLine(entry)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
