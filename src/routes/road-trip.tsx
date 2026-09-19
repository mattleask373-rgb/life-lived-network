import { publicPage } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from "lucide-react";

import { EntrySheet } from "@/components/entry-sheet";
import { eventDate, layerText } from "@/components/layer-colour";
import { LivingMap } from "@/components/living-map";
import { PlaceSearch } from "@/components/place-search";
import { Button } from "@/components/ui/button";
import { useLifeList } from "@/hooks/use-life-list";
import { fetchWorldEntries } from "@/lib/listings";
import { descendantIdsOf, distanceKm, type Place } from "@/lib/places";
import {
  ROAD_TRIP_DRAFT_KEY,
  addJourneyStop,
  draftFromPlan,
  hasJourneyStop,
  moveJourneyStop,
  readStoredRoadTripDraft,
  removeJourneyStop,
  writeRoadTripDraft,
} from "@/lib/road-trip-journey";
import { useWorldContext } from "@/lib/world-context";
import type { WorldEntry } from "@/lib/world-data";
import {
  GROUP_LABEL,
  TRAVEL_MODES,
  corridorPlaceIds,
  corridorPlaces,
  corridorWidthKm,
  routeDiscoveries,
  straightLineSummary,
  type CorridorPlace,
  type Discovery,
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

const GROUP_ORDER: DiscoveryGroup[] = ["near_start", "on_route", "small_detour", "at_destination"];

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
  const [stopIds, setStopIds] = useState<string[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Record<string, WorldEntry>>({});
  const [draftReady, setDraftReady] = useState(false);
  const [recalculated, setRecalculated] = useState(false);

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

  const {
    data: entries,
    isLoading,
    isError,
    refetch,
  } = useQuery({
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
  const journeyStops = useMemo(() => {
    const current = new Map(discoveries.map((item) => [item.entry.id, item.entry]));
    return stopIds
      .map((id) => current.get(id) ?? selectedEntries[id])
      .filter((entry): entry is WorldEntry => Boolean(entry));
  }, [discoveries, selectedEntries, stopIds]);

  useEffect(() => {
    if (!index || draftReady) return;
    const draft = readStoredRoadTripDraft(window.localStorage);
    if (draft) {
      const savedFrom = index.byId.get(draft.fromId);
      const savedTo = index.byId.get(draft.toId);
      if (savedFrom && savedTo) {
        setFrom(savedFrom);
        setTo(savedTo);
        setMode(draft.mode);
        setDate(draft.date);
        setInterests(draft.interests.join(", "));
        setStopIds(draft.stopIds);
        setSelectedEntries(Object.fromEntries(draft.stopEntries.map((entry) => [entry.id, entry])));
        setPlanned({
          from: savedFrom,
          to: savedTo,
          mode: draft.mode,
          date: draft.date || undefined,
          interests: draft.interests,
        });
      }
    }
    setDraftReady(true);
  }, [draftReady, index]);

  useEffect(() => {
    if (!draftReady || !planned) return;
    writeRoadTripDraft(window.localStorage, draftFromPlan(planned, stopIds, selectedEntries));
  }, [draftReady, planned, selectedEntries, stopIds]);

  useEffect(() => {
    if (!discoveries.length || !stopIds.length) return;
    setSelectedEntries((current) => {
      const next = { ...current };
      for (const item of discoveries) {
        if (hasJourneyStop(stopIds, item.entry.id)) next[item.entry.id] = item.entry;
      }
      return next;
    });
  }, [discoveries, stopIds]);

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6">
        <h1 className="text-3xl">Plan a road trip</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Say where you are going. We will show what is genuinely along the way — nothing invented,
          nothing ranked in secret, and every card saying where it came from.
        </p>

        <form
          className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!origin || !to) return;
            const nextPlan: RoutePlan = {
              from: origin,
              to,
              mode,
              date: date || undefined,
              interests: interests
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean),
            };
            if (
              planned &&
              (planned.from.id !== nextPlan.from.id || planned.to.id !== nextPlan.to.id)
            ) {
              setStopIds([]);
            }
            setRecalculated(false);
            setPlanned(nextPlan);
          }}
        >
          <PlaceSearch index={index} value={origin} label="Setting off from" onChange={setFrom} />
          <PlaceSearch index={index} value={to} label="Heading to" onChange={setTo} />

          <div>
            <span className="block text-sm text-muted-foreground">How you are travelling</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRAVEL_MODES.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={mode === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode(option.id)}
                  aria-pressed={mode === option.id}
                  className="rounded-full"
                >
                  {option.label}
                </Button>
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
            <Button type="submit" disabled={!origin || !to} className="rounded-full">
              Plan this journey
            </Button>
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
              Driving distance and time need a route provider, which isn't connected yet, so we're
              showing what sits near the line of travel rather than pretending to know the road.
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

            <JourneyPanel
              plan={planned}
              stops={journeyStops}
              currentDiscoveryIds={new Set(discoveries.map((item) => item.entry.id))}
              onMove={(id, direction) =>
                setStopIds((current) => moveJourneyStop(current, id, direction))
              }
              onRemove={(id) => setStopIds((current) => removeJourneyStop(current, id))}
              onRecalculate={() => {
                if (origin && to) {
                  setPlanned({
                    from: origin,
                    to,
                    mode,
                    date: date || undefined,
                    interests: interests
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  });
                }
                setRecalculated(true);
                void refetch();
              }}
              recalculated={recalculated}
            />

            {isLoading ? (
              <p className="mt-6 text-sm text-muted-foreground">Looking along the way…</p>
            ) : isError ? (
              <div className="card-paper mt-6 p-4 text-sm">
                <p>We couldn't look along this route right now.</p>
                <Button
                  className="mt-3"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : discoveries.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                <strong className="block font-medium text-foreground">
                  Nothing found along this route
                </strong>
                Try changing your interests or adjusting your route.
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
                        <RoadTripCard
                          key={item.entry.id}
                          discovery={item}
                          added={hasJourneyStop(stopIds, item.entry.id)}
                          onAdd={() => {
                            setSelectedEntries((current) => ({
                              ...current,
                              [item.entry.id]: item.entry,
                            }));
                            setStopIds((current) => addJourneyStop(current, item.entry.id));
                          }}
                          onOpen={() => setOpen(item.entry)}
                        />
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

function RoadTripCard({
  discovery,
  added,
  onAdd,
  onOpen,
}: {
  discovery: Discovery;
  added: boolean;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const { entry } = discovery;
  const timing = entry.startsAt ? eventDate(entry.startsAt, entry.timezone) : "";
  const routeReason = discovery.reasons[0];
  return (
    <article className="card-paper flex h-full flex-col p-4">
      <p className={`text-xs uppercase tracking-widest ${layerText[entry.layer]}`}>
        {GROUP_LABEL[discovery.group]}
      </p>
      <h4 className="mt-1 text-lg leading-snug">{entry.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">
        {entry.place} · {entry.neighbourhood}
      </p>
      {entry.summary ? (
        <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{entry.summary}</p>
      ) : null}
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        {discovery.matchedInterests.length ? (
          <p>
            <span className="text-foreground">Matches:</span>{" "}
            {discovery.matchedInterests.join(" · ")}
          </p>
        ) : null}
        {routeReason ? <p>{routeReason}</p> : null}
        {timing ? <p className="font-medium text-foreground">{timing}</p> : null}
        {discovery.freshnessLabel ? <p>{discovery.freshnessLabel}</p> : null}
        {discovery.evidenceLabel ? <p>{discovery.evidenceLabel}</p> : null}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Button type="button" size="sm" onClick={onAdd} disabled={added}>
          {added ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {added ? "Added to journey" : "Add to journey"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onOpen}>
          View details
        </Button>
      </div>
    </article>
  );
}

function JourneyPanel({
  plan,
  stops,
  currentDiscoveryIds,
  onMove,
  onRemove,
  onRecalculate,
  recalculated,
}: {
  plan: RoutePlan;
  stops: WorldEntry[];
  currentDiscoveryIds: Set<string>;
  onMove: (id: string, direction: "up" | "down") => void;
  onRemove: (id: string) => void;
  onRecalculate: () => void;
  recalculated: boolean;
}) {
  return (
    <section className="mt-6 border-y border-border py-5" aria-labelledby="your-journey">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="your-journey" className="text-xl">
            Your journey
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved on this device as you build it.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRecalculate}>
          <RotateCcw aria-hidden="true" /> Recalculate journey
        </Button>
      </div>

      <ol className="mt-5 grid gap-2">
        <JourneyEndpoint label="From" name={plan.from.name} />
        {stops.length === 0 ? (
          <li className="border-l-2 border-dashed border-border py-4 pl-4">
            <p className="font-medium">Your journey is empty</p>
            <p className="text-sm text-muted-foreground">
              Add interesting places from the results below to build your trip.
            </p>
          </li>
        ) : (
          stops.map((stop, index) => (
            <li
              key={stop.id}
              className="flex items-center gap-3 border-l-2 border-primary py-2 pl-4"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs uppercase tracking-widest text-muted-foreground">
                  Stop {index + 1}
                </span>
                <span className="block truncate font-medium">{stop.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{stop.place}</span>
                {!currentDiscoveryIds.has(stop.id) ? (
                  <span className="block text-xs text-muted-foreground">
                    Kept in your journey · not in the current results
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => onMove(stop.id, "up")}
                  aria-label={`Move ${stop.title} up`}
                  title="Move up"
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === stops.length - 1}
                  onClick={() => onMove(stop.id, "down")}
                  aria-label={`Move ${stop.title} down`}
                  title="Move down"
                >
                  <ChevronDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(stop.id)}
                  aria-label={`Remove ${stop.title}`}
                  title="Remove stop"
                >
                  <Trash2 />
                </Button>
              </span>
            </li>
          ))
        )}
        <JourneyEndpoint label="To" name={plan.to.name} />
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">
        Route placement is based on geographic proximity. Driving times and exact detours will be
        available when routing is connected.
      </p>
      {recalculated ? (
        <p role="status" className="mt-2 text-sm text-foreground">
          Journey refreshed. Your stop order has been kept.
        </p>
      ) : null}
    </section>
  );
}

function JourneyEndpoint({ label, name }: { label: string; name: string }) {
  return (
    <li className="border-l-2 border-foreground py-2 pl-4">
      <span className="block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-medium">{name}</span>
    </li>
  );
}
