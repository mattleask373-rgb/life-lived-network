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
import { fetchWorldEntries } from "@/lib/listings";
import { PLACE_FALLBACK } from "@/lib/places";
import { useWorldContext } from "@/lib/world-context";
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
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Home,
});

function Home() {
  const [layers, setLayers] = useState<LayerId[]>([]);
  const [open, setOpen] = useState<WorldEntry | null>(null);
  const { has, toggle, ids } = useLifeList();

  // Where we are is shared application context, not a constant in this file.
  const { place, ancestors, placeIds, placeSlugs, setPlaceSlug, loading } = useWorldContext();

  // The page asks for possibilities in a context; it never knows the source.
  const { data: world, isLoading: worldLoading } = useQuery({
    queryKey: ["world", place?.id ?? null, placeIds.length],
    enabled: Boolean(place),
    queryFn: () =>
      // Only where we are travels; the hierarchy is expanded behind the server.
      fetchWorldEntries({ placeId: place?.id ?? null }),
  });
  const all = world ?? [];
  const placeName = place?.name ?? PLACE_FALLBACK.name;
  const regionName = ancestors[0]?.name ?? "";
  const placeBlurb = place?.blurb || PLACE_FALLBACK.blurb;

  const entries = useMemo(() => {
    const filtered = layers.length ? all.filter((e) => layers.includes(e.layer)) : all;
    return layers.length ? filtered : meaningfulVariety(filtered);
  }, [all, layers]);
  const snapshot = useMemo(() => activitySnapshot(all), [all]);
  const tonight = useMemo(
    () => entries.filter((e) => e.band === "tonight" || e.band === "today").slice(0, 3),
    [entries],
  );
  const quiet = !worldLoading && !loading && all.length === 0;

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6">
        <header>
          <h1 className="text-4xl leading-none sm:text-5xl">
            {placeName}
            {regionName ? <span className="text-muted-foreground">, {regionName}</span> : null}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{placeBlurb}</p>
        </header>

        <div className="mt-5">
          <PlacePicker />
        </div>

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
            <p className="shrink-0 text-sm text-muted-foreground">{entries.length} things</p>
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
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Places are shown approximately. Nobody's exact location is ever on this map.
          </p>
        </section>

        {/* Soon */}
        {tonight.length ? (
          <section aria-labelledby="soon-heading" className="mt-10">
            <h2 id="soon-heading" className="text-xl">
              Happening soon
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {tonight.map((e) => (
                <EntryCard key={e.id} entry={e} onOpen={setOpen} />
              ))}
            </div>
          </section>
        ) : !quiet ? (
          <section className="card-paper mt-10 p-5">
            <h2 className="text-xl">Nothing in the next day or two.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              There are things here, just not imminently. Try a wider area, or put something on for
              a day that's empty.
            </p>
          </section>
        ) : null}

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
