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

import {
  createFileRoute,
  Link,
  notFound,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AskThisPlace } from "@/components/ask-this-place";
import { EntrySheet } from "@/components/entry-sheet";
import { EmptyPlace } from "@/components/data-state";
import { LocalityQuestions } from "@/components/locality-questions";
import { WhatsHappening } from "@/components/whats-happening";
import { WhatsHere } from "@/components/whats-here";
import { WorkOpportunityFacts } from "@/components/work-opportunity-facts";
import { useLifeList } from "@/hooks/use-life-list";
import { fetchWorldEntries } from "@/lib/listings";
import { getLocality, type PlaceBrief } from "@/lib/locality.functions";
import { localityPath } from "@/lib/locality-path";
import { contributions, localityQuestions, providerGroups, upcomingEvents } from "@/lib/locality";
import { KIND_LABEL } from "@/lib/places";
import { evaluateLocalityIndexability } from "@/lib/locality-indexability";
import { privatePage, publicPage } from "@/lib/seo";
import { categoriesPresent } from "@/lib/service-taxonomy";
import { hasPublicWorkOpportunity } from "@/lib/work-opportunity-presentation";
import { filterEntriesByText, parseQuerySearch } from "@/lib/search-context";
import {
  applyTravellerFilters,
  TRAVELLER_FILTERS,
  type TravellerFilterId,
} from "@/lib/traveller-filters";
import type { WorldEntry } from "@/lib/world-data";

export const Route = createFileRoute("/$country/$place/")({
  validateSearch: parseQuerySearch,
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
    const title = `${label} — what's happening and what's here | Real World Atlas`;
    const description = current.length
      ? `Real things happening in ${name}, the services and practices recorded there, and what people nearby have offered or asked for.`
      : `${name} in Real World Atlas. Nothing has been recorded here yet — add the first thing.`;
    // Share one fail-closed evidence policy with future sitemap generation.
    // The page remains reachable to people even when its content is not ready for search.
    const indexability = evaluateLocalityIndexability({ place: geography.place, entries });
    return indexability.status === "INDEXABLE"
      ? publicPage({ path, title, description })
      : privatePage({ path, title, description });
  },
  component: LocalityPage,
  errorComponent: LocalityError,
  notFoundComponent: LocalityNotFound,
});

function LocalityError({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <main className="paper-grain min-h-screen">
      <div role="alert" className="mx-auto max-w-md px-4 pt-16 pb-20 text-center sm:px-6">
        <h1 className="text-2xl">We couldn't load this place just now</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a connection problem on our side, not a sign the place is empty.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
            className="focus-ink min-h-11 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
          >
            Try again
          </button>
          <Link
            to="/"
            className="focus-ink min-h-11 rounded-full border border-border px-5 py-2.5 text-sm"
          >
            Back to the map
          </Link>
        </div>
      </div>
    </main>
  );
}

function LocalityNotFound() {
  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-md px-4 pt-16 pb-20 text-center sm:px-6">
        <h1 className="text-2xl">We don't have this place on record</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The address may be mistyped, or the place hasn't been added to Real World Atlas yet.
        </p>
        <Link
          to="/"
          className="focus-ink mt-6 inline-block min-h-11 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
        >
          Back to the map
        </Link>
      </div>
    </main>
  );
}

function Crumbs({ place, ancestors }: { place: PlaceBrief; ancestors: PlaceBrief[] }) {
  const chain = [...ancestors].reverse();
  return (
    <nav aria-label="Where this is" className="text-sm text-muted-foreground">
      <Link className="underline-offset-4 hover:underline" to="/">
        Real World Atlas
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
  const navigate = useNavigate();
  const { geography, entries } = Route.useLoaderData();
  const { place, ancestors, children, siblings } = geography;
  const [open, setOpen] = useState<WorldEntry | null>(null);
  const { has, toggle } = useLifeList();
  const { q } = Route.useSearch();
  const textMatches = useMemo(() => filterEntriesByText(entries, q), [entries, q]);
  const [quickFilters, setQuickFilters] = useState<TravellerFilterId[]>([]);

  const filtered = useMemo(
    () => applyTravellerFilters(entries, quickFilters),
    [entries, quickFilters],
  );
  const events = useMemo(() => upcomingEvents(filtered), [filtered]);
  const groups = useMemo(() => providerGroups(filtered), [filtered]);
  const offers = useMemo(() => contributions(filtered), [filtered]);
  const categories = useMemo(() => categoriesPresent(entries), [entries]);
  const workOpportunities = useMemo(() => entries.filter(hasPublicWorkOpportunity), [entries]);
  const questions = useMemo(() => localityQuestions(entries, 0), [entries]);
  const demonstrations = entries.filter((entry) => entry.demonstration).length;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      <Crumbs ancestors={ancestors} place={place} />

      <h1 className="mt-3 text-4xl leading-tight">{place.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {KIND_LABEL[place.kind]}
        {ancestors[0] ? ` in ${ancestors[0].name}` : ""}
      </p>
      {place.blurb ? <p className="mt-3 max-w-2xl text-base">{place.blurb}</p> : null}

      {q ? (
        <section aria-label="Your search" className="card-paper mt-6 max-w-2xl p-5 text-sm">
          <p>
            You searched for <strong>&ldquo;{q}&rdquo;</strong> in {place.name}.
          </p>
          {textMatches.length ? (
            <>
              <p className="mt-1 text-muted-foreground">
                {textMatches.length === 1
                  ? "One record here contains"
                  : `${textMatches.length} records here contain`}{" "}
                those words. This is a plain text match on what was recorded, not a recommendation.
              </p>
              <ul className="mt-3 space-y-2">
                {textMatches.slice(0, 12).map((entry) => (
                  <li key={entry.id}>
                    <button
                      className="text-left underline-offset-4 hover:underline"
                      onClick={() => setOpen(entry)}
                      type="button"
                    >
                      {entry.title}
                      {entry.demonstration ? (
                        <span className="text-muted-foreground"> (trial data)</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Nothing recorded here contains those words. That doesn&apos;t mean it isn&apos;t here
              — everything recorded in {place.name} is below.
            </p>
          )}
        </section>
      ) : null}

      {entries.length === 0 ? (
        <EmptyPlace
          placeName={place.name}
          needCount={0}
          ancestors={ancestors.slice(0, 3)}
          onStepOut={(slug) => {
            const target = ancestors.find((a) => a.slug === slug);
            if (target) {
              void navigate({
                to: "/$country/$place",
                params: { country: target.countrySegment || "gb", place: target.slug },
              });
            }
          }}
        />
      ) : (
        <div className="mt-6">
          <LocalityQuestions placeName={place.name} questions={questions} />
          <AskThisPlace placeName={place.name} />

          <div className="mt-6">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-sm uppercase tracking-widest text-muted-foreground">
                Narrow it down
              </h2>
              <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
                {quickFilters.length
                  ? `${filtered.length} of ${entries.length} ${
                      entries.length === 1 ? "thing" : "things"
                    } match`
                  : ""}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Quick filters">
              {TRAVELLER_FILTERS.map((filter) => {
                const on = quickFilters.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setQuickFilters((prev) =>
                        on ? prev.filter((x) => x !== filter.id) : [...prev, filter.id],
                      )
                    }
                    className={`focus-ink min-h-11 rounded-full border px-4 py-2 text-sm transition-colors ${
                      on
                        ? "border-transparent bg-secondary text-secondary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            {quickFilters.length && filtered.length === 0 ? (
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Nothing here matches that combination — but {entries.length}{" "}
                {entries.length === 1 ? "thing is" : "things are"} recorded in {place.name}.{" "}
                <button
                  type="button"
                  onClick={() => setQuickFilters([])}
                  className="focus-ink underline underline-offset-4"
                >
                  Show everything
                </button>
              </p>
            ) : null}
          </div>
        </div>
      )}

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
              <li key={category.slug}>
                <Link
                  params={{
                    country: place.countrySegment || "gb",
                    place: place.slug,
                    service: category.slug,
                  }}
                  to="/$country/$place/$service"
                  className="card-paper focus-ink block px-3 py-2 text-sm transition-shadow hover:shadow-lift"
                >
                  <span>{category.label}</span>
                  <span className="text-muted-foreground">
                    {" · "}
                    {list.length}
                    {demonstrationOnly ? " (trial data)" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {workOpportunities.length ? (
        <section
          className="mt-10"
          aria-label={`Published work opportunities in ${place.name}`}
        >
          <h2 className="text-2xl">Work opportunities recorded here</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Only explicitly reviewed, rights-cleared records with published terms appear here. This
            does not guarantee a place, pay, or availability.
          </p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {workOpportunities.slice(0, 12).map((entry) => (
              <li className="card-paper p-4" key={entry.id}>
                <h3 className="text-lg">{entry.title}</h3>
                {entry.summary.trim() ? <p className="mt-1 text-sm">{entry.summary}</p> : null}
                <WorkOpportunityFacts entry={entry} />
              </li>
            ))}
          </ul>
          {workOpportunities.length > 12 || entries.length >= 60 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing up to 12 opportunities from the records currently loaded for this place; more
              may exist.
            </p>
          ) : null}
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
