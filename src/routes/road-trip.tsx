import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EntryCard } from "@/components/entry-card";
import { EntrySheet } from "@/components/entry-sheet";
import { LivingMap } from "@/components/living-map";
import { PlaceSearch } from "@/components/place-search";
import { useLifeList } from "@/hooks/use-life-list";
import { fetchWorldEntries } from "@/lib/listings";
import { descendantIdsOf, distanceKm, type Place } from "@/lib/places";
import { useWorldContext } from "@/lib/world-context";
import type { WorldEntry } from "@/lib/world-data";
import {
import { publicPage } from "@/lib/seo";
  GROUP_LABEL,
  TRAVEL_MODES,
  corridorPlaceIds,
  corridorPlaces,
  corridorWidthKm,
  routeDiscoveries,
  straightLineSummary,
  type CorridorPlace,
  type DiscoveryGroup,
  type RoutePlan,
  type TravelMode,
} from "@/lib/road-trip";

const title = "Plan a road trip — The Living World";
const description =
  "Say where you are going and what interests you, and see what is genuinely happening along the way — events, practices, services and people's offered hours, each with its source.";

export const Route = createFileRoute("/road-trip")({
  head: () => publicPage({ path: "/road-trip", title, description }),
  component: RoadTrip,
});

const GROUP_ORDER: DiscoveryGroup[] = [
  "near_start",
  "on_route",
  "small_detour",
  "at_destination",
];

function RoadTrip() {
  const { index, place } = useWorldContext();
  const { has, toggle } = useLifeList();
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [mode, setMode] = useState<TravelMode>("driving");
  const [date, setDate] = useState("");
  const [interests, setInterests] = useState("");
  const [planned, setPlanned] = useState<RoutePlan | null>(null);
  const [open, setOpen] = useState<WorldEntry | null>(null);

  // Where we already are is a sensible starting point, never an imposed one.
  const origin = from ?? place;

  const corridor = useMemo<CorridorPlace[]>(() => {
    if (!index || !planned) return [];
    const width = corridorWidthKm(planned.mode, distanceKm(planned.from, planned.to));
    return corridorPlaces(index, planned, width);
  }, [index, planned]);

  const placeIds = useMemo(
    () => (index && planned ? corridorPlaceIds(index, planned, corridor) : []),
    [index, planned, corridor],
  );

  const { data: entries, isLoading } = useQuery({
    queryKey: ["road-trip", placeIds.join(",")],
    enabled: placeIds.length > 0,
    queryFn: () => fetchWorldEntries({ placeIds, limit: 120 }),
  });

  const discoveries = useMemo(() => {
    if (!planned || !index || !entries) return [];
    return routeDiscoveries({
      entries,
      plan: planned,
      corridor: new Map(corridor.map((hit) => [hit.place.id, hit])),
      destinationIds: new Set(descendantIdsOf(index, planned.to.id)),
      routed: false,
    });
  }, [planned, index, entries, corridor]);

  const summary = planned ? straightLineSummary(planned) : null;
  const mapEntries = useMemo(() => discoveries.map((d) => d.entry), [discoveries]);

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6">
        <h1 className="text-3xl">Plan a road trip</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Say where you are going. We will show what is genuinely along the way — nothing
          invented, nothing ranked in secret, and every card saying where it came from.
        </p>

        <form
          className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!origin || !to) return;
            setPlanned({
              from: origin,
              to,
              mode,
              date: date || undefined,
              interests: interests
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean),
            });
          }}
        >
          <PlaceSearch
            index={index}
            value={origin}
            label="Setting off from"
            onChange={setFrom}
          />
          <PlaceSearch index={index} value={to} label="Heading to" onChange={setTo} />

          <div>
            <span className="block text-sm text-muted-foreground">How you are travelling</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRAVEL_MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  aria-pressed={mode === option.id}
                  className={`focus-ink rounded-full border px-3 py-1.5 text-sm ${
                    mode === option.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <label className="text-sm text-muted-foreground" htmlFor="trip-date">
              When (optional)
              <input
                id="trip-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="focus-ink mt-1 w-full rounded-full border border-border bg-card px-3 py-2.5 text-sm text-foreground"
              />
            </label>
            <label className="text-sm text-muted-foreground" htmlFor="trip-interests">
              What you like (optional, comma separated)
              <input
                id="trip-interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="music, walking, repair"
                className="focus-ink mt-1 w-full rounded-full border border-border bg-card px-3 py-2.5 text-sm text-foreground"
              />
            </label>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!origin || !to}
              className="focus-ink rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-50"
            >
              Plan this journey
            </button>
          </div>
        </form>

        {planned && summary ? (
          <section className="mt-8" aria-labelledby="route-summary">
            <h2 id="route-summary" className="text-2xl">
              {planned.from.name} to {planned.to.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.straightLineKm
                ? `About ${summary.straightLineKm} km apart in a straight line.`
                : "We don't have coordinates for both places yet."}{" "}
              Driving distance and time need a route provider, which isn't connected yet, so
              we're showing what sits near the line of travel rather than pretending to know
              the road.
            </p>

            <div className="mt-4 h-[46vh] min-h-72">
              <LivingMap
                entries={mapEntries}
                activeId={open?.id}
                onSelect={setOpen}
                centre={{
                  lat:
                    planned.from.lat !== null && planned.to.lat !== null
                      ? (planned.from.lat + planned.to.lat) / 2
                      : null,
                  lng:
                    planned.from.lng !== null && planned.to.lng !== null
                      ? (planned.from.lng + planned.to.lng) / 2
                      : null,
                }}
                centreName={`${planned.from.name} to ${planned.to.name}`}
              />
            </div>

            {isLoading ? (
              <p className="mt-6 text-sm text-muted-foreground">Looking along the way…</p>
            ) : discoveries.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                Nothing is listed along this route yet. That is the honest answer rather than
                a filled page — try a wider destination, or add something yourself.
              </p>
            ) : (
              GROUP_ORDER.map((group) => {
                const items = discoveries.filter((d) => d.group === group);
                if (!items.length) return null;
                return (
                  <section key={group} className="mt-8">
                    <h3 className="text-xl">{GROUP_LABEL[group]}</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {items.map((item) => (
                        <div key={item.entry.id}>
                          <EntryCard entry={item.entry} onOpen={setOpen} />
                          <ul className="mt-1 space-y-0.5 pl-1 text-xs text-muted-foreground">
                            {item.reasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </section>
        ) : null}
      </div>

      {open ? (
        <EntrySheet
          world={mapEntries}
          entry={open}
          saved={has(open.id)}
          onSave={toggle}
          onClose={() => setOpen(null)}
          onOpenEntry={setOpen}
        />
      ) : null}
    </main>
  );
}
