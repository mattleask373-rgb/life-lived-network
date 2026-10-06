import { determineActivityTone, LivingWorldSignal } from "./living-world-signal";
import { EntryCard } from "./entry-card";
import type { WorldEntry } from "@/lib/world-data";

/**
 * What's happening, by day. An event leads with what, when, where, who listed
 * it and whether it is still on — the card already says all five. Nothing here
 * is filled in when there is nothing; the locality simply says so.
 */
export function WhatsHappening({
  events,
  placeName,
  onOpen,
  limit = 9,
}: {
  events: WorldEntry[];
  placeName: string;
  onOpen: (entry: WorldEntry) => void;
  limit?: number;
}) {
  const shown = events.slice(0, limit);
  const nowMs = Date.now();
  const hasLive = shown.some((e) => {
    if (!e.startsAt) return false;
    const start = new Date(e.startsAt).getTime();
    const end = e.endsAt ? new Date(e.endsAt).getTime() : start + 3 * 3600 * 1000;
    return nowMs >= start && nowMs <= end;
  });

  const tone = determineActivityTone(shown.length, hasLive);

  const days = new Map<string, WorldEntry[]>();
  for (const event of shown) {
    const key = new Date(event.startsAt ?? "").toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: event.timezone,
    });
    const list = days.get(key);
    if (list) list.push(event);
    else days.set(key, [event]);
  }

  return (
    <section aria-labelledby="happening-heading" className="mt-10 scroll-mt-6" id="happening">
      <h2 id="happening-heading" className="text-2xl">
        What's happening
      </h2>
      {shown.length === 0 ? (
        <div className="mt-3">
          <LivingWorldSignal
            tone="quiet"
            eyebrow="It's quiet here"
            contributionLink={{
              label: `Want to help make something happen in ${placeName}? Put something real on the map`,
              to: "/make",
            }}
          >
            <span>No dated activity is recorded in {placeName} yet.</span>
            <p className="mt-2 font-sans text-sm font-normal leading-relaxed text-muted-foreground">
              That describes the record, not the place. When a source or resident puts something
              genuine on the map, it appears here with its date, place, and provenance.
            </p>
          </LivingWorldSignal>
        </div>
      ) : (
        <div className="mt-3 space-y-6">
          <LivingWorldSignal
            tone={tone}
            contributionLink={{
              label: "Know something happening here? Add it to the map",
              to: "/make",
            }}
          >
            {shown.length === 1
              ? `One dated thing is recorded in ${placeName}.`
              : `${shown.length} dated things are recorded in ${placeName}.`}
          </LivingWorldSignal>
          {[...days.entries()].map(([day, list]) => (
            <div key={day}>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">{day}</h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {list.map((event) => (
                  <EntryCard key={event.id} entry={event} onOpen={onOpen} />
                ))}
              </div>
            </div>
          ))}
          {events.length > shown.length ? (
            <p className="text-xs text-muted-foreground">
              {events.length - shown.length} more dated things here — the map shows them all.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
