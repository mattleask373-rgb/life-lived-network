/**
 * A locality, as a public page.
 *
 * `/gb/kings-heath`, `/ie/dublin`, `/pt/lisbon` — one generic route for every
 * place record at any depth. The country segment is the place's own country
 * code, so nothing here is city-specific, service-specific or country-specific.
 *
 * Everything on the page is real: the same canonical entries the map shows,
 * grouped by the questions a person arrives with. A quiet locality says it is
 * quiet. Nothing is written about a place that the data does not contain, and a
 * locality with nothing in it is not offered to search engines.
 */

import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { EntrySheet } from "@/components/entry-sheet";
import { LayerFilter } from "@/components/layer-filter";
import { LivingMap } from "@/components/living-map";
import { LivingWorldSignal } from "@/components/living-world-signal";
import { LocalityQuestions } from "@/components/locality-questions";
import { WhatsHappening } from "@/components/whats-happening";
import { WhatsHere } from "@/components/whats-here";
import { useLifeList } from "@/hooks/use-life-list";
import { fetchWorldEntries } from "@/lib/listings";
import { getLocality, type PlaceBrief } from "@/lib/locality.functions";
import { contributions, localityQuestions, providerGroups, upcomingEvents } from "@/lib/locality";
import { getLocalityDensityConfig } from "@/lib/locality-density";
import { KIND_LABEL } from "@/lib/places";
import { privatePage, publicPage } from "@/lib/seo";
import { categoriesPresent } from "@/lib/service-taxonomy";
import { meaningfulVariety, type LayerId, type WorldEntry } from "@/lib/world-data";

export function localityPath(place: Pick<PlaceBrief, "slug" | "countrySegment">): string {
  return `/${place.countrySegment || "gb"}/${place.slug}`;
}

export const Route = createFileRoute("/$country/$place")({
  loader: async ({ params }) => {
    const geography = await getLocality({ data: { slug: params.place } });
    if (!geography) throw notFound();
    // One canonical address per place. Any other country segment redirects
    // rather than becoming a second version of the same page.
    const canonical = localityPath(geography.place);
    if (canonical !== `/${params.country}/${params.place}`) throw redirect({ to: canonical });

    const entries = await fetchWorldEntries({ placeId: geography.place.id, limit: 60 });
    return { geography, entries };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return privatePage({ path: "", title: "Somewhere", description: "" });
    const { geography, entries } = loaderData;
    const name = geography.place.name;
    const wider = geography.ancestors[0]?.name;
    const label = wider ? `${name}, ${wider}` : name;
    const path = localityPath(geography.place);
    const current = entries.filter((entry) => !entry.demonstration);
    const title = `${label} — what's happening and what's here | The Living World`;
    const description = current.length
      ? `Real things happening in ${name}, the services and practices recorded there, and what people nearby have offered or asked for.`
      : `${name} in The Living World. Nothing has been recorded here yet — add the first thing.`;
    // Until a page has something genuinely useful on it, it is not offered to
    // search engines. It still exists for anybody who arrives.
    return current.length >= 3
      ? publicPage({ path, title, description })
      : privatePage({ path, title, description });
  },
  component: LocalityPage,
});

function Crumbs({ place, ancestors }: { place: PlaceBrief; ancestors: PlaceBrief[] }) {
  const chain = [...ancestors].reverse();
  return (
    <nav aria-label="Where this is" className="text-sm text-muted-foreground">
      <Link className="underline-offset-4 hover:underline" to="/">
        The Living World
      </Link>
      {chain.map((step) => (
        <span key={step.id}>
          <span aria-hidden="true"> › </span>
          <Link
            className="underline-offset-4 hover:underline"
            params={{ country: step.countrySegment || "gb", place: step.slug }}
            to="/$country/$place"
          >
            {step.name}
          </Link>
        </span>
      ))}
      <span aria-hidden="true"> › </span>
      <span className="text-foreground">{place.name}</span>
    </nav>
  );
}

function PlaceLinks({ title, places }: { title: string; places: PlaceBrief[] }) {
  if (!places.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-sm uppercase tracking-widest text-muted-foreground">{title}</h2>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {places.map((place) => (
          <li key={place.id}>
            <Link
              className="underline-offset-4 hover:underline"
              params={{ country: place.countrySegment || "gb", place: place.slug }}
              to="/$country/$place"
            >
              {place.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LocalityPage() {
  const { geography, entries } = Route.useLoaderData();
  const { place, ancestors, children, siblings } = geography;
  const [open, setOpen] = useState<WorldEntry | null>(null);
  const [layers, setLayers] = useState<LayerId[]>([]);
  const { has, toggle } = useLifeList();

  const events = useMemo(() => upcomingEvents(entries), [entries]);
  const groups = useMemo(() => providerGroups(entries), [entries]);
  const offers = useMemo(() => contributions(entries), [entries]);
  const categories = useMemo(() => categoriesPresent(entries), [entries]);
  const questions = useMemo(() => localityQuestions(entries, 0), [entries]);
  const demonstrations = entries.filter((entry) => entry.demonstration).length;

  const presentLayers = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.layer))),
    [entries],
  );
  const densityConfig = useMemo(
    () => getLocalityDensityConfig(entries.length, presentLayers.length),
    [entries.length, presentLayers.length],
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      <Crumbs ancestors={ancestors} place={place} />

      <h1 className="mt-3 text-4xl leading-tight">{place.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {KIND_LABEL[place.kind]}
        {ancestors[0] ? ` in ${ancestors[0].name}` : ""}
      </p>
      {place.blurb ? <p className="mt-3 max-w-2xl text-base">{place.blurb}</p> : null}

      {/* Density-aware activity and quiet presentation */}
      {entries.length === 0 ? (
        <div className="mt-6 max-w-2xl">
          <LivingWorldSignal
            tone="quiet"
            eyebrow="It's quiet here"
            contributionLink={{
              label: `Want to help make something happen in ${place.name}? Add the first thing to the map`,
              to: "/make",
            }}
          >
            <span>No dated activity or services recorded in {place.name} yet.</span>
            <p className="mt-2 text-sm text-muted-foreground">
              That describes the record, not the place. As residents and providers share genuine
              activity, it appears here on the living map.
            </p>
          </LivingWorldSignal>
        </div>
      ) : densityConfig.promoteSignal ? (
        <div className="mt-6 max-w-2xl">
          <LivingWorldSignal
            tone="sparse"
            eyebrow="A few things recorded"
            contributionLink={{
              label: `Know something else happening in ${place.name}? Add it to the map`,
              to: "/make",
            }}
          >
            <span>
              {entries.length === 1
                ? `One real thing is recorded in ${place.name}.`
                : `${entries.length} real things are recorded in ${place.name}.`}
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Shown with real dates, places, and provenance. Explore below or add to the record.
            </p>
          </LivingWorldSignal>
        </div>
      ) : (
        <div className="mt-6">
          <LocalityQuestions placeName={place.name} questions={questions} />
        </div>
      )}

      {/* Map hero with density-scaled viewport height */}
      <section aria-labelledby="locality-map-heading" className="mt-8 scroll-mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 id="locality-map-heading" className="text-2xl">
              The living map
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {entries.length === 0
                ? `Showing the geographic area of ${place.name}. Real records will appear here as they are added.`
                : `See the real things recorded in ${place.name} together, then open one and decide what to do next.`}
            </p>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {entries.length === 0 ? "0 recorded" : `${entries.length} recorded`}
          </span>
        </div>

        {densityConfig.showLayerFilter ? (
          <div className="mt-3">
            <LayerFilter active={layers} onChange={setLayers} />
          </div>
        ) : null}

        <div className={`mt-3 ${densityConfig.mapHeightClass} transition-[height] duration-200`}>
          <LivingMap
            entries={
              layers.length
                ? entries.filter((entry) => layers.includes(entry.layer))
                : meaningfulVariety(entries)
            }
            activeId={open?.id}
            onSelect={setOpen}
            centre={{ lat: place.lat, lng: place.lng }}
            centreName={place.name}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Places are approximate. Nobody&apos;s exact location is shown.
        </p>
      </section>

      {demonstrations > 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          {demonstrations === 1 ? "One record here is" : `${demonstrations} records here are`}{" "}
          clearly-labelled trial data. Nothing is booked and no enquiry reaches anybody through
          them.
        </p>
      ) : null}

      <WhatsHappening events={events} onOpen={setOpen} placeName={place.name} />
      <WhatsHere groups={groups} onOpen={setOpen} placeName={place.name} />

      {categories.length ? (
        <section className="mt-10">
          <h2 className="text-2xl">Kinds of service recorded here</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Grouped from what each listing actually says about itself. A kind with nothing in it is
            not listed.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.map(({ category, entries: list, demonstrationOnly }) => (
              <li className="card-paper px-3 py-2 text-sm" key={category.slug}>
                <span>{category.label}</span>
                <span className="text-muted-foreground">
                  {" · "}
                  {list.length}
                  {demonstrationOnly ? " (trial data)" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {offers.length ? (
        <section className="mt-10" id="who">
          <h2 className="text-2xl">Hours and skills people have offered</h2>
          <ul className="mt-3 space-y-2">
            {offers.slice(0, 12).map((entry) => (
              <li className="card-paper p-4 text-sm" key={entry.id}>
                <button className="text-left" onClick={() => setOpen(entry)} type="button">
                  <span className="text-base">{entry.title}</span>
                  <span className="block text-muted-foreground">{entry.give}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <PlaceLinks places={children} title={`Inside ${place.name}`} />
      <PlaceLinks places={siblings} title="Nearby" />

      <section className="mt-10 card-paper p-5">
        <h2 className="text-xl">See this on the living map</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          The map shows everything here at once, with the layers you care about, and what you could
          do in the next three hours.
        </p>
        <Link className="mt-3 inline-block underline" to="/">
          Open the living map
        </Link>
      </section>

      {open ? (
        <EntrySheet
          entry={open}
          onClose={() => setOpen(null)}
          onOpenEntry={setOpen}
          onSave={toggle}
          saved={has(open.id)}
          world={entries}
        />
      ) : null}
    </main>
  );
}
