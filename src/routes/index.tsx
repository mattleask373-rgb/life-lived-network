import { publicPage } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LivingMap } from "@/components/living-map";
import { LayerFilter } from "@/components/layer-filter";
import { EntrySheet } from "@/components/entry-sheet";
import { EntryCard } from "@/components/entry-card";
import { PlacePicker } from "@/components/place-picker";
import { ThreeHours } from "@/components/three-hours";
import { DoSomethingToday } from "@/components/do-something-today";
import { LayerIcon } from "@/components/layer-icon";
import { useLifeList } from "@/hooks/use-life-list";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchWorldEntries } from "@/lib/listings";
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

const title = "The Living World — what's actually happening near you";
const description =
  "A living map of real work, music, food, nature, community projects and people open to meeting, across the UK and Ireland. Find something, then go and live it.";

export const Route = createFileRoute("/")({
  head: () => publicPage({ path: "/", title, description }),
  component: Home,
});

function Home() {
  const [layers, setLayers] = useState<LayerId[]>([]);
  const [open, setOpen] = useState<WorldEntry | null>(null);
  const { has, toggle, ids } = useLifeList();

  // Where we are is shared application context, not a constant in this file.
  const { place, ancestors, setPlaceSlug, loading, index } = useWorldContext();
  // What the map is looking at. Separate from where we are: moving the map never
  // moves the person, it only offers somewhere they could choose instead.
  const [view, setView] = useState<MapView | null>(null);
  const [exploredSlug, setExploredSlug] = useState<string | null>(null);
  const exploredPlace = exploredSlug && index ? index.bySlug.get(exploredSlug) : null;
  const discoveryPlace = exploredPlace ?? place;

  // The page asks for possibilities in a context; it never knows the source.
  const {
    data: world,
    isLoading: worldLoading,
    isError: worldError,
    refetch: refetchWorld,
  } = useQuery({
    queryKey: ["world", discoveryPlace?.id ?? null],
    enabled: Boolean(discoveryPlace),
    queryFn: () =>
      // Only where we are travels; the hierarchy is expanded behind the server.
      fetchWorldEntries({ placeId: discoveryPlace?.id ?? null }),
  });
  // What people here have asked for. Counted honestly, never invented.
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
  // The locality read as one thing: dated events, providers, offered hours.
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
            <a
              href="#map-heading"
              className="focus-ink rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              Explore the map
            </a>
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

        {/* The same locality, as a page anyone can be sent to or find by searching. */}
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

        {/* Something's happening here */}
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

        {/* The quiet truth, when a place is quiet */}
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

        {/* The map */}
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

        {/* What's happening — everything with a real date, by day */}
        <WhatsHappening events={events} placeName={placeName} onOpen={setOpen} />

        {/* What's here — providers and their practices and services */}
        <WhatsHere groups={groups} placeName={placeName} onOpen={setOpen} />

        {/* Who's here, and what people have asked for */}
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

        {/* Do something today */}
        <div className="mt-10">
          <DoSomethingToday world={all} savedIds={ids} onOpen={setOpen} />
        </div>

        {/* I have three hours */}
        <div className="mt-10">
          <ThreeHours onOpen={setOpen} world={all} />
        </div>

        {/* What can you give */}
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

        {/* Journey */}
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
