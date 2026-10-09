import { publicPage } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LivingMap } from "@/components/living-map";
import { LayerFilter } from "@/components/layer-filter";
import { EntrySheet } from "@/components/entry-sheet";
import { EntryCard } from "@/components/entry-card";
import { PlacePicker } from "@/components/place-picker";
import { PossibilityFrontDoor } from "@/components/possibility-front-door";
import { ThreeHours } from "@/components/three-hours";
import { DoSomethingToday } from "@/components/do-something-today";
import { LayerIcon } from "@/components/layer-icon";
import { TruthBanner } from "@/components/truth-banner";
import { useLifeList } from "@/hooks/use-life-list";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchWorldEntries } from "@/lib/listings";
import { densityOf } from "@/lib/trust";
import { getOpenNeeds } from "@/lib/needs.functions";
import { PLACE_FALLBACK } from "@/lib/places";
import { placeInView, type MapView } from "@/lib/map-view";
import { useWorldContext } from "@/lib/world-context";
import { LocalityQuestions } from "@/components/locality-questions";
import { WhatsHappening } from "@/components/whats-happening";
import { WhatsHere } from "@/components/whats-here";
import { contributions, localityQuestions, providerGroups, upcomingEvents } from "@/lib/locality";
import {
  activitySnapshot,
  meaningfulVariety,
  type LayerId,
  type WorldEntry,
} from "@/lib/world-data";

const title = "Real World Atlas — what's actually happening near you";
const description =
  "A living map of real work, music, food, nature, community projects and people open to meeting, across the UK and Ireland. Find something, then go and live it.";

export const Route = createFileRoute("/")({
  head: () => publicPage({ path: "/", title, description }),
  component: Home,
});

function Home() {
  const [layers, setLayers] = useState<LayerId[]>([]);
  const [mode, setMode] = useState<"map" | "list">("map");
  const [open, setOpen] = useState<WorldEntry | null>(null);
  const { has, toggle, ids } = useLifeList();

  const { place, ancestors, setPlaceSlug, loading, index } = useWorldContext();
  const [view, setView] = useState<MapView | null>(null);
  const [exploredSlug, setExploredSlug] = useState<string | null>(null);
  const exploredPlace = exploredSlug && index ? index.bySlug.get(exploredSlug) : null;
  const discoveryPlace = exploredPlace ?? place;

  const {
    data: world,
    isLoading: worldLoading,
    isError: worldError,
    refetch: refetchWorld,
  } = useQuery({
    queryKey: ["world", discoveryPlace?.id ?? null],
    enabled: Boolean(discoveryPlace),
    queryFn: () => fetchWorldEntries({ placeId: discoveryPlace?.id ?? null }),
  });
  const openNeedsFn = useServerFn(getOpenNeeds);
  const { data: openNeeds } = useQuery({
    queryKey: ["open-needs", place?.id ?? null],
    enabled: Boolean(place),
    queryFn: () => openNeedsFn({ data: { placeId: place?.id ?? null } }),
  });

  const all = useMemo(() => world ?? [], [world]);
  const placeName = place?.name ?? PLACE_FALLBACK.name;
  const regionName = ancestors[0]?.name ?? "";
  const placeBlurb = place?.blurb || PLACE_FALLBACK.blurb;

  const entries = useMemo(() => {
    const filtered = layers.length ? all.filter((e) => layers.includes(e.layer)) : all;
    return layers.length ? filtered : meaningfulVariety(filtered);
  }, [all, layers]);
  const snapshot = useMemo(() => activitySnapshot(all), [all]);
  const events = useMemo(() => upcomingEvents(all), [all]);
  const groups = useMemo(() => providerGroups(all), [all]);
  const given = useMemo(() => contributions(all), [all]);
  const needCount = openNeeds?.length ?? 0;
  const questions = useMemo(() => localityQuestions(all, needCount), [all, needCount]);
  const quiet = !worldLoading && !loading && !worldError && all.length === 0;

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6">
        <header>
          <h1 className="text-4xl leading-none sm:text-5xl">
            {placeName}
            {regionName ? <span className="text-muted-foreground">, {regionName}</span> : null}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{placeBlurb}</p>
          <p className="mt-4 max-w-2xl text-base">
            Find real things to do, people who can help, and worthwhile stops along your way — then
            close the app and go live them.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {quiet ? (
              <Link
                to="/make"
                className="focus-ink rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
              >
                Add the first real thing here
              </Link>
            ) : (
              <a
                href="#map-heading"
                className="focus-ink rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
              >
                {densityOf(all.length) === "busy" ? "See what's on" : "Explore the map"}
              </a>
            )}
            <Link
              to="/road-trip"
              className="focus-ink rounded-full border border-border bg-card px-5 py-2.5 text-sm"
            >
              Plan a road trip
            </Link>
          </div>
        </header>

        <div className="mt-5">
          <PlacePicker />
        </div>

        <TruthBanner placeName={placeName} />

        <PossibilityFrontDoor />

        {place && place.country_code ? (
          <Link
            to="/$country/$place"
            params={{ country: place.country_code.toLowerCase(), place: place.slug }}
            className="focus-ink mt-3 inline-flex text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            The {placeName} page — everything here on one page
          </Link>
        ) : null}

        <LocalityQuestions questions={questions} placeName={placeName} />

        {snapshot.length ? (
          <section aria-labelledby="happening-heading" className="card-paper mt-6 p-5">
            <h2 id="happening-heading" className="text-xl">
              Something's happening here
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Not a ranking. Just what's real in {placeName} this week.
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {snapshot.map(({ layer, count }) => (
                <li key={layer.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="flex items-center gap-2 text-2xl">
                    <LayerIcon icon={layer.icon} size={20} strokeWidth={1.6} />
                    {count}
                  </p>
                  <p className="text-sm text-muted-foreground">{layer.blurb}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {quiet ? (
          <section className="card-paper mt-6 p-5">
            <h2 className="text-xl">There isn't much here yet.</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Nothing has been put into {placeName} so far, and we'd rather say that than invent
              something. Look at somewhere wider — a county or a country — or put the first real
              thing here yourself.
            </p>
            {ancestors.length ? (
              <div className="mt-4 flex flex-wrap items-baseline gap-2">
                <span className="text-sm text-muted-foreground">Step out to</span>
                {ancestors.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setPlaceSlug(a.slug)}
                    className="focus-ink rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            ) : null}
            <Link
              to="/make"
              className="focus-ink mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              Make something happen here
            </Link>
          </section>
        ) : null}

        <section aria-labelledby="map-heading" className="mt-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 sm:flex sm:justify-between">
            <h2 id="map-heading" className="truncate text-xl">
              What's around you
            </h2>
            <p className="shrink-0 text-sm text-muted-foreground">
              {worldLoading ? "Looking…" : `${entries.length} things`}
            </p>
          </div>
          <div className="mt-3">
            <LayerFilter active={layers} onChange={setLayers} />
          </div>
          <div
            role="group"
            aria-label="Show as"
            className="mt-3 inline-flex rounded-full border border-border bg-card p-1 text-sm"
          >
            {(["map", "list"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`focus-ink min-h-11 rounded-full px-4 ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "map" ? "Map" : "List"}
              </button>
            ))}
          </div>
          {mode === "list" ? (
            <div className="mt-3">
              {worldLoading ? (
                <p role="status" className="text-sm text-muted-foreground">
                  Looking…
                </p>
              ) : worldError ? (
                <p role="alert" className="text-sm">
                  We couldn't load what's here.{" "}
                  <button
                    type="button"
                    onClick={() => void refetchWorld()}
                    className="focus-ink underline underline-offset-4"
                  >
                    Try again
                  </button>
                </p>
              ) : entries.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {entries.map((e) => (
                    <li key={e.id}>
                      <EntryCard entry={e} onOpen={setOpen} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing recorded here yet.</p>
              )}
            </div>
          ) : (
            <div className="mt-3 h-[62vh] min-h-80 sm:h-[30rem]">
              <LivingMap
                entries={entries}
                activeId={open?.id}
                onSelect={setOpen}
                centre={place ? { lat: place.lat, lng: place.lng } : null}
                centreName={place?.name}
                area={
                  index && view
                    ? (() => {
                        const found = placeInView(index, view, place?.id ?? null);
                        return found ? { name: found.name, slug: found.slug } : null;
                      })()
                    : null
                }
                onExploreArea={setExploredSlug}
                onAdoptArea={(slug) => {
                  setPlaceSlug(slug);
                  setExploredSlug(null);
                }}
                onViewChange={setView}
                loading={worldLoading}
                error={worldError}
                onRetry={() => void refetchWorld()}
              />
            </div>
          )}
          {exploredPlace ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Exploring {exploredPlace.name}. Your area is still {placeName}.
              </span>
              <button
                type="button"
                onClick={() => setExploredSlug(null)}
                className="focus-ink underline underline-offset-4"
              >
                Return to {placeName}
              </button>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            Places are shown approximately. Nobody's exact location is ever on this map.
          </p>
        </section>

        <WhatsHappening events={events} placeName={placeName} onOpen={setOpen} />
        <WhatsHere groups={groups} placeName={placeName} onOpen={setOpen} />

        <section aria-labelledby="who" id="who" className="mt-10 scroll-mt-6">
          <h2 id="who-heading" className="text-2xl">
            Who's here, and what's needed
          </h2>
          {given.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {given.slice(0, 6).map((e) => (
                <EntryCard key={e.id} entry={e} onOpen={setOpen} note={e.give ?? ""} />
              ))}
            </div>
          ) : (
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Nobody in {placeName} has offered an hour or a skill yet. You could be the first, and
              it takes a minute.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/need"
              className="focus-ink rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              {needCount
                ? `${needCount} ${needCount === 1 ? "thing" : "things"} people have asked for`
                : "Ask for something yourself"}
            </Link>
            <Link
              to="/give"
              className="focus-ink rounded-full border border-border px-5 py-2.5 text-sm"
            >
              I have one hour
            </Link>
            <Link
              to="/help"
              className="focus-ink rounded-full border border-border px-5 py-2.5 text-sm"
            >
              Say what you can do
            </Link>
          </div>
        </section>

        <div className="mt-10">
          <DoSomethingToday world={all} savedIds={ids} onOpen={setOpen} />
        </div>
        <div className="mt-10">
          <ThreeHours onOpen={setOpen} world={all} />
        </div>

        <section className="card-paper mt-10 p-5">
          <h2 className="text-xl">What can you give?</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            An hour of something useful — teaching, painting, photography, a language, a pair of
            hands. Nothing here is scored or counted.
          </p>
          <Link
            to="/give"
            className="focus-ink mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
          >
            I have one hour
          </Link>
        </section>

        <section className="card-paper mt-10 p-5">
          <h2 className="text-xl">What could your journey become?</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Tell us the shape of your time here — days, money, what you'd like to find — and we'll
            arrange real things that already exist into a few possible weeks.
          </p>
          <Link
            to="/journey"
            className="focus-ink mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
          >
            See what's possible
          </Link>
        </section>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Put the phone away. Go live it.
        </p>
      </div>

      {open ? (
        <EntrySheet
          world={entries}
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
