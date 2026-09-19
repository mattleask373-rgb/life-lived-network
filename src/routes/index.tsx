import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LivingMap } from "@/components/living-map";
import { LayerFilter } from "@/components/layer-filter";
import { EntrySheet } from "@/components/entry-sheet";
import { EntryCard } from "@/components/entry-card";
import { ThreeHours } from "@/components/three-hours";
import { DoSomethingToday } from "@/components/do-something-today";
import { useLifeList } from "@/hooks/use-life-list";
import { useQuery } from "@tanstack/react-query";
import { fetchWorld } from "@/lib/listings";
import { fetchDefaultPlace, PLACE_FALLBACK } from "@/lib/places";
import {
  activitySnapshot,
  meaningfulVariety,
  type LayerId,
  type WorldEntry,
} from "@/lib/world-data";

const title = "The Living World — what's actually happening in Lisbon";
const description =
  "A living map of real work, music, food, nature, community projects and people open to meeting, in one place. Find something, then go and live it.";

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

  const { data: world } = useQuery({ queryKey: ["world"], queryFn: fetchWorld });
  const all = world ?? [];

  // The place we're looking at is a real record now, not a constant.
  const { data: resolved } = useQuery({
    queryKey: ["place", "default"],
    queryFn: fetchDefaultPlace,
  });
  const placeName = resolved?.place.name ?? PLACE_FALLBACK.name;
  const regionName = resolved?.parent?.name ?? PLACE_FALLBACK.region;
  const placeBlurb = resolved?.place.blurb || PLACE_FALLBACK.blurb;

  const entries = useMemo(() => {
    const filtered = layers.length ? all.filter((e) => layers.includes(e.layer)) : all;
    return layers.length ? filtered : meaningfulVariety(filtered);
  }, [all, layers]);
  const snapshot = useMemo(() => activitySnapshot(), []);
  const tonight = useMemo(
    () => entries.filter((e) => e.band === "tonight" || e.band === "today").slice(0, 3),
    [entries],
  );

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Where are you?
          </p>
          <h1 className="mt-1 text-4xl leading-none sm:text-5xl">
            {placeName}
            <span className="text-muted-foreground">, {regionName}</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{placeBlurb}</p>
        </header>

        {/* Something's happening here */}
        <section
          aria-labelledby="happening-heading"
          className="card-paper mt-6 p-5"
        >
          <h2 id="happening-heading" className="text-xl">
            Something's happening here
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Not a ranking. Just what's real in {placeName} this week.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {snapshot.map(({ layer, count }) => (
              <li key={layer.id} className="rounded-lg border border-border bg-background p-3">
                <p className="text-2xl">
                  <span aria-hidden="true" className="mr-1">
                    {layer.glyph}
                  </span>
                  {count}
                </p>
                <p className="text-sm text-muted-foreground">{layer.blurb}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* The map */}
        <section aria-labelledby="map-heading" className="mt-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 sm:flex sm:justify-between">
            <h2 id="map-heading" className="truncate text-xl">
              What's around you
            </h2>
            <p className="shrink-0 text-sm text-muted-foreground">
              {entries.length} things
            </p>
          </div>
          <div className="mt-3">
            <LayerFilter active={layers} onChange={setLayers} />
          </div>
          <div className="mt-3 h-[62vh] min-h-80 sm:h-[30rem]">
            <LivingMap entries={entries} activeId={open?.id} onSelect={setOpen} />
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
        ) : (
          <section className="card-paper mt-10 p-5">
            <h2 className="text-xl">It's quiet here.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Want to help make something happen? A venue nearby has an empty Tuesday.
            </p>
          </section>
        )}

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
            An hour of something useful — teaching, painting, photography, a language, a pair
            of hands. Nothing here is scored or counted.
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
            Tell us the shape of your time here — days, money, what you'd like to find — and
            we'll arrange real things that already exist into a few possible weeks.
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
