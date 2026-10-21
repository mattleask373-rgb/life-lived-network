import { publicPage } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LivingMap } from "@/components/living-map";
import { LayerFilter } from "@/components/layer-filter";
import { EntrySheet } from "@/components/entry-sheet";
import { EntryCard } from "@/components/entry-card";
import { PlacePicker } from "@/components/place-picker";
import { EmptyPlace } from "@/components/data-state";
import { emptyListState } from "@/lib/discovery-empty";
import { PossibilityFrontDoor } from "@/components/possibility-front-door";
import { ThreeHours } from "@/components/three-hours";
import { DoSomethingToday } from "@/components/do-something-today";
import { LayerIcon } from "@/components/layer-icon";
import { useLifeList } from "@/hooks/use-life-list";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchWorld, fetchWorldEntries } from "@/lib/listings";
import { MAX_LIMIT } from "@/lib/data/contract";
import { geoBoundsForViewport, type GeoBounds } from "@/lib/geo-bounds";
import { densityOf } from "@/lib/trust";
import { getOpenNeeds } from "@/lib/needs.functions";
import { PLACE_FALLBACK } from "@/lib/places";
import { placeInView, type MapView } from "@/lib/map-view";
import { entriesForMapList, mergeViewportEntries, partitionMapList } from "@/lib/map-list-sync";
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
  "A living map of real work, music, food, nature, community projects and local opportunities. Find something, then go and live it.";

export const Route = createFileRoute("/")({
  head: () => publicPage({ path: "/", title, description }),
  component: Home,
});

function Home() {
  const [layers, setLayers] = useState<LayerId[]>([]);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [showAllLoaded, setShowAllLoaded] = useState(false);
  const [open, setOpen] = useState<WorldEntry | null>(null);
  const { has, toggle, ids } = useLifeList();

  const { place, ancestors, setPlaceSlug, loading, index } = useWorldContext();
  const [view, setView] = useState<MapView | null>(null);
  const [viewportBounds, setViewportBounds] = useState<GeoBounds | null>(null);
  const [exploredSlug, setExploredSlug] = useState<string | null>(null);

  // Debounce the transient view; a pointer move should not trigger a request.
  // This changes the records shown, never the selected discovery locality.
  useEffect(() => {
    if (!view) {
      setViewportBounds(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setViewportBounds(geoBoundsForViewport(view));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [view]);
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
  const {
    data: viewportPage,
    isFetching: viewportFetching,
    isError: viewportError,
    refetch: refetchViewport,
  } = useQuery({
    queryKey: ["world-viewport", viewportBounds],
    enabled: Boolean(place && viewportBounds),
    staleTime: 15_000,
    queryFn: () => {
      if (!viewportBounds) throw new Error("Map viewport bounds are required.");
      return fetchWorld({ bounds: viewportBounds, limit: MAX_LIMIT });
    },
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

  const viewportLoaded = Boolean(viewportBounds && viewportPage);
  const mapSourceEntries = useMemo(
    () => (viewportLoaded && viewportPage ? mergeViewportEntries(viewportPage.items, all) : all),
    [all, viewportLoaded, viewportPage],
  );

  const mapBaseFilteredEntries = useMemo(
    () =>
      layers.length
        ? mapSourceEntries.filter((entry) => layers.includes(entry.layer))
        : mapSourceEntries,
    [mapSourceEntries, layers],
  );
  const mapEntries = showAllLoaded
    ? mapBaseFilteredEntries
    : layers.length
      ? mapBaseFilteredEntries
      : meaningfulVariety(mapBaseFilteredEntries);
  const snapshot = useMemo(() => activitySnapshot(all), [all]);
  const events = useMemo(() => upcomingEvents(all), [all]);
  const groups = useMemo(() => providerGroups(all), [all]);
  const given = useMemo(() => contributions(all), [all]);
  const needCount = openNeeds?.length ?? 0;
  const questions = useMemo(() => localityQuestions(all, needCount), [all, needCount]);
  const quiet = Boolean(place) && !worldLoading && !loading && !worldError && all.length === 0;
  const mapPartition = useMemo(() => partitionMapList(mapEntries, view), [mapEntries, view]);
  const mapListEntries = useMemo(
    () => entriesForMapList(mapEntries, mapPartition, showAllLoaded),
    [mapEntries, mapPartition, showAllLoaded],
  );
  const unpinnedIds = useMemo(
    () => new Set(mapPartition.unpinned.map((entry) => entry.id)),
    [mapPartition.unpinned],
  );
  const locatedCount = mapEntries.length - mapPartition.unpinned.length;
  const mapListSummary = showAllLoaded
    ? mapListEntries.length +
      (viewportLoaded
        ? " loaded records in this map view"
        : " loaded records for " + (discoveryPlace?.name ?? placeName))
    : view
      ? mapPartition.inView.length +
        " of " +
        locatedCount +
        " located records in view · " +
        mapPartition.unpinned.length +
        " unpinned" +
        (viewportLoaded && viewportPage?.hasMore ? " · page full; more may exist" : "")
      : mapPartition.unpinned.length + " unpinned · map view preparing";
  const mapLoading = viewportBounds ? !viewportPage && viewportFetching : worldLoading;
  const mapError = viewportBounds ? viewportError && !viewportPage : worldError;
  const refetchMap = viewportBounds ? refetchViewport : refetchWorld;
  const canChangeListScope =
    showAllLoaded ||
    !view ||
    mapPartition.outsideView.length > 0 ||
    mapBaseFilteredEntries.length > mapEntries.length;

  const mapListContents = (
    <>
      {mapLoading || loading ? (
        <p role="status" className="text-sm text-muted-foreground">
          {viewportBounds ? "Loading records for this map view…" : "Checking what's recorded here…"}
        </p>
      ) : !place ? (
        <p role="status" className="text-sm text-muted-foreground">
          Choose a supported place to see its records.
        </p>
      ) : mapError ? (
        <p role="alert" className="text-sm text-muted-foreground">
          We couldn't load {viewportBounds ? "records for this map view" : "what's here"}.{" "}
          <button
            type="button"
            onClick={() => void refetchMap()}
            className="focus-ink min-h-11 underline underline-offset-4"
          >
            Try again
          </button>
        </p>
      ) : mapEntries.length === 0 ? (
        emptyListState(mapBaseFilteredEntries.length, layers.length > 0) === "filtered-out" ? (
          <p className="text-sm text-muted-foreground">
            Nothing matches these filters, but {mapBaseFilteredEntries.length} other{" "}
            {mapBaseFilteredEntries.length === 1 ? "thing is" : "things are"} recorded{" "}
            {viewportLoaded ? "in this map view or without a safe pin" : "here"}.{" "}
            <button
              type="button"
              onClick={() => setLayers([])}
              className="focus-ink min-h-11 underline underline-offset-4"
            >
              Show everything
            </button>
          </p>
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            {viewportLoaded
              ? "Nothing with usable location coordinates is recorded in this map view yet."
              : "Nothing recorded here yet."}
          </p>
        )
      ) : mapListEntries.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          {!view && !showAllLoaded
            ? "Preparing the map view. "
            : "Nothing with a pin is in this view. "}
          <button
            type="button"
            onClick={() => setShowAllLoaded(true)}
            className="focus-ink min-h-11 font-medium text-primary underline underline-offset-4"
          >
            Show all loaded records
          </button>
        </p>
      ) : (
        <ul className="grid gap-3">
          {mapListEntries.map((entry) => {
            const selected = open?.id === entry.id;
            const unpinned = unpinnedIds.has(entry.id);
            return (
              <li
                key={entry.id}
                className={
                  selected
                    ? "rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : undefined
                }
              >
                {selected ? <span className="sr-only">Selected on the map.</span> : null}
                {unpinned ? (
                  <p className="mb-1 px-1 text-xs text-muted-foreground">
                    Location not pinned — available in the list, not on the map
                  </p>
                ) : null}
                <EntryCard entry={entry} onOpen={setOpen} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6">
        <header>
          {regionName ? (
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {regionName}
            </p>
          ) : null}
          <h1 className="mt-2 max-w-3xl text-4xl leading-tight md:text-6xl">
            What's actually happening in <span className="italic text-primary">{placeName}</span>
          </h1>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            Real work, tables, music, and hours. Then put the phone away.
          </p>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{placeBlurb}</p>
          <p role="status" className="mt-2 text-sm text-muted-foreground">
            {worldLoading || loading
              ? "Checking what's recorded here…"
              : !place
                ? "Choose a supported place to see what's recorded here."
                : worldError
                  ? "We couldn't check what's recorded here."
                  : `${all.length} ${all.length === 1 ? "thing" : "things"} recorded here · ${needCount} ${needCount === 1 ? "open need" : "open needs"}`}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {quiet ? (
              <Link
                to="/make"
                className="focus-ink inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
              >
                Add the first real thing here
              </Link>
            ) : (
              <a
                href="#map-heading"
                className="focus-ink inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
              >
                {densityOf(all.length) === "busy" ? "See what's on" : "Explore the map"}
              </a>
            )}
            <Link
              to="/road-trip"
              className="focus-ink inline-flex min-h-11 items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm"
            >
              Plan a road trip
            </Link>
          </div>
        </header>

        {/* Where you are, then what you want: one grouped front door. */}
        <div className="mt-6 space-y-4 border-t border-border pt-6">
          <PlacePicker />
          <PossibilityFrontDoor />
        </div>

        {place && place.country_code ? (
          <Link
            to="/$country/$place"
            params={{ country: place.country_code.toLowerCase(), place: place.slug }}
            className="focus-ink mt-3 inline-flex text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            The {placeName} page — everything here on one page
          </Link>
        ) : null}

        {place ? <LocalityQuestions questions={questions} placeName={placeName} /> : null}

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
          <EmptyPlace
            placeName={placeName}
            needCount={needCount}
            ancestors={ancestors.slice(0, 3)}
            onStepOut={setPlaceSlug}
          />
        ) : null}

        <section aria-labelledby="map-heading" className="mt-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 sm:flex sm:justify-between">
            <h2 id="map-heading" className="truncate text-xl">
              What's around you
            </h2>
            <p role="status" aria-live="polite" className="shrink-0 text-sm text-muted-foreground">
              {mapLoading
                ? "Looking…"
                : !place
                  ? "Choose a place"
                  : mapError
                    ? "Unavailable"
                    : viewportLoaded
                      ? `${viewportPage?.items.length ?? 0} located records in this view${viewportPage?.hasMore ? " · page full" : ""}`
                      : `${mapEntries.length} things`}
            </p>
          </div>
          <div className="mt-3">
            <LayerFilter active={layers} onChange={setLayers} />
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)]">
            <div className="relative min-w-0">
              <div className="h-[62vh] min-h-80 sm:h-[30rem] lg:h-[calc(100vh-17rem)] lg:min-h-[34rem] lg:max-h-[48rem]">
                <LivingMap
                  entries={mapEntries}
                  viewBasisEntries={all}
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
                    setShowAllLoaded(false);
                  }}
                  onViewChange={setView}
                  loading={mapLoading}
                  error={mapError}
                  onRetry={() => void refetchMap()}
                />
              </div>
              <section
                aria-label="Nearby listings"
                className="absolute inset-x-2 bottom-2 z-20 rounded-2xl border border-border bg-card/95 p-3 shadow-lift backdrop-blur-sm lg:hidden"
              >
                <button
                  type="button"
                  aria-expanded={mobileListOpen}
                  aria-controls="mobile-map-list-panel"
                  onClick={() => setMobileListOpen((current) => !current)}
                  className="focus-ink flex min-h-11 w-full items-center justify-between gap-3 text-left"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">
                      {mobileListOpen ? "Nearby listings" : "Browse nearby listings"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{mapListSummary}</span>
                  </span>
                  {mobileListOpen ? (
                    <ChevronDown aria-hidden="true" size={20} />
                  ) : (
                    <ChevronUp aria-hidden="true" size={20} />
                  )}
                </button>
                <div
                  id="mobile-map-list-panel"
                  hidden={!mobileListOpen}
                  className="mt-3 max-h-[38vh] overflow-y-auto overscroll-contain pr-1"
                >
                  {canChangeListScope ? (
                    <div className="mb-3 flex justify-end">
                      <button
                        type="button"
                        aria-pressed={showAllLoaded}
                        onClick={() => setShowAllLoaded((current) => !current)}
                        className="focus-ink min-h-11 rounded-full border border-border px-3 text-sm"
                      >
                        {showAllLoaded ? "Focus on this map view" : "Show all loaded records"}
                      </button>
                    </div>
                  ) : null}
                  {mapListContents}
                </div>
              </section>
            </div>
            <section
              aria-labelledby="desktop-map-list-heading"
              className="hidden min-w-0 rounded-2xl border border-border bg-card p-4 lg:block"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id="desktop-map-list-heading" className="font-display text-xl">
                    {showAllLoaded ? "All loaded locality records" : "In this map view"}
                  </h3>
                  <p
                    role="status"
                    aria-live="polite"
                    className="mt-1 text-sm text-muted-foreground"
                  >
                    {mapListSummary}
                  </p>
                </div>
                {canChangeListScope ? (
                  <button
                    type="button"
                    aria-pressed={showAllLoaded}
                    onClick={() => setShowAllLoaded((current) => !current)}
                    className="focus-ink min-h-11 rounded-full border border-border px-3 text-sm"
                  >
                    {showAllLoaded ? "Focus on this map view" : "Show all loaded records"}
                  </button>
                ) : null}
              </div>
              <div className="mt-3 max-h-[calc(100vh-21rem)] min-h-[14rem] overflow-y-auto overscroll-contain pr-1">
                {mapListContents}
              </div>
            </section>
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
