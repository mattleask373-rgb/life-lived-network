/**
 * A service in a place, as a public page.
 *
 * `/gb/kings-heath/gardening` — one generic route for every known service
 * category in every place record. The category must exist in the shared
 * service taxonomy and the place must exist in the canonical geography;
 * anything else is an honest 404, never a thin page kept alive for search
 * engines.
 *
 * Every listing shown comes through the same canonical entries the map and
 * the locality page use, filtered by the record's own evidence (see
 * `service-page.ts`). A service nobody has genuinely offered here says so,
 * stays out of the index, and offers real next steps instead of invented
 * supply.
 */

import { createFileRoute, Link, notFound, redirect, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { EntryCard } from "@/components/entry-card";
import { EntrySheet } from "@/components/entry-sheet";
import { useLifeList } from "@/hooks/use-life-list";
import { fetchWorldEntries } from "@/lib/listings";
import { getLocality, type PlaceBrief } from "@/lib/locality.functions";
import { KIND_LABEL } from "@/lib/places";
import { privatePage, publicPage } from "@/lib/seo";
import {
  servicePageCopy,
  servicePageIndexable,
  servicePageListings,
  servicePagePath,
} from "@/lib/service-page";
import { categoriesPresent } from "@/lib/service-taxonomy";
import type { WorldEntry } from "@/lib/world-data";
import { localityPath } from "./$country.$place";

export const Route = createFileRoute("/$country/$place/$service")({
  loader: async ({ params }) => {
    const geography = await getLocality({ data: { slug: params.place } });
    if (!geography) throw notFound();
    // One canonical address per page. A wrong country segment redirects rather
    // than becoming a second version of the same page.
    const canonical = `/${geography.place.countrySegment || "gb"}/${geography.place.slug}/${params.service}`;
    if (canonical !== `/${params.country}/${params.place}/${params.service}`)
      throw redirect({ to: canonical });

    const entries = await fetchWorldEntries({ placeId: geography.place.id, limit: 60 });
    const listings = servicePageListings(entries, params.service);
    if (!listings) throw notFound();
    return { geography, entries, listings };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return privatePage({ path: "", title: "A service", description: "" });
    const { geography, listings } = loaderData;
    const path = servicePagePath(geography.place, listings.category);
    const copy = servicePageCopy(geography.place.name, listings);
    // Until a page has something genuinely useful on it, it is not offered to
    // search engines. It still exists for anybody who arrives.
    return servicePageIndexable(listings)
      ? publicPage({ path, ...copy })
      : privatePage({ path, ...copy });
  },
  component: ServicePage,
  errorComponent: ServiceError,
  notFoundComponent: ServiceNotFound,
});

function ServiceError({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <main className="paper-grain min-h-screen">
      <div role="alert" className="mx-auto max-w-md px-4 pt-16 pb-20 text-center sm:px-6">
        <h1 className="text-2xl">We couldn't load this page just now</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a connection problem on our side, not a sign the service is unavailable.
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

function ServiceNotFound() {
  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-md px-4 pt-16 pb-20 text-center sm:px-6">
        <h1 className="text-2xl">We don't have this page on record</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The address may be mistyped, or the place or service hasn't been added to Real World
          Atlas yet.
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

function ServicePage() {
  const { geography, entries, listings } = Route.useLoaderData();
  const { place, ancestors, children } = geography;
  const { category, real, demonstration } = listings;
  const [open, setOpen] = useState<WorldEntry | null>(null);
  const { has, toggle } = useLifeList();

  // Other kinds of service genuinely recorded here, for sideways navigation.
  const related = useMemo(
    () => categoriesPresent(entries).filter((row) => row.category.slug !== category.slug),
    [entries, category.slug],
  );
  const chain = [...ancestors].reverse();
  const placePath = localityPath(place);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
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
        <Link className="underline-offset-4 hover:underline" to={placePath}>
          {place.name}
        </Link>
        <span aria-hidden="true"> › </span>
        <span className="text-foreground">{category.label}</span>
      </nav>

      <h1 className="mt-3 text-4xl leading-tight">
        {category.label} in {place.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {KIND_LABEL[place.kind]}
        {ancestors[0] ? ` in ${ancestors[0].name}` : ""}
      </p>

      {real.length ? (
        <section className="mt-8" aria-label={`${category.label} recorded in ${place.name}`}>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {real.length === 1
              ? "One genuine listing, grouped here because of what it actually says about itself."
              : `${real.length} genuine listings, grouped here because of what each one actually says about itself.`}{" "}
            Nothing is inferred about qualifications or availability.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {real.map((entry) => (
              <li key={entry.id}>
                <EntryCard entry={entry} onOpen={setOpen} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section aria-labelledby="quiet-service-heading" className="card-paper mt-8 p-5 sm:p-6">
          <h2 id="quiet-service-heading" className="text-2xl">
            Nobody has offered {category.label.toLowerCase()} here yet
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            We'd rather say that than invent someone. If you genuinely offer this in {place.name},
            you can be the first — or look wider while the place is still quiet.
          </p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            <li>
              <Link
                to="/make"
                className="focus-ink flex min-h-11 flex-col rounded-lg border border-primary bg-primary px-4 py-3 text-sm text-primary-foreground"
              >
                <span className="font-medium">Offer this here</span>
                <span className="opacity-90">Add a real listing in {place.name}</span>
              </Link>
            </li>
            <li>
              <Link
                to={placePath}
                className="focus-ink flex min-h-11 flex-col rounded-lg border border-border bg-background px-4 py-3 text-sm hover:bg-card"
              >
                <span className="font-medium">Everything in {place.name}</span>
                <span className="text-muted-foreground">What has been recorded here</span>
              </Link>
            </li>
            {ancestors[0] ? (
              <li>
                <Link
                  params={{
                    country: ancestors[0].countrySegment || "gb",
                    place: ancestors[0].slug,
                    service: category.slug,
                  }}
                  to="/$country/$place/$service"
                  className="focus-ink flex min-h-11 flex-col rounded-lg border border-border bg-background px-4 py-3 text-sm hover:bg-card"
                >
                  <span className="font-medium">{category.label} in {ancestors[0].name}</span>
                  <span className="text-muted-foreground">Look one step wider</span>
                </Link>
              </li>
            ) : null}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Nothing is published until you choose to post it.
          </p>
        </section>
      )}

      {demonstration.length ? (
        <p className="mt-4 text-xs text-muted-foreground">
          {demonstration.length === 1
            ? "One record here is"
            : `${demonstration.length} records here are`}{" "}
          clearly-labelled trial data. Nothing is booked and no enquiry reaches anybody through
          them.
        </p>
      ) : null}

      {related.length ? (
        <section className="mt-10">
          <h2 className="text-2xl">Other kinds of service in {place.name}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map(({ category: other, entries: list, demonstrationOnly }) => (
              <li key={other.slug}>
                <Link
                  params={{
                    country: place.countrySegment || "gb",
                    place: place.slug,
                    service: other.slug,
                  }}
                  to="/$country/$place/$service"
                  className="card-paper focus-ink block px-3 py-2 text-sm transition-shadow hover:shadow-lift"
                >
                  <span>{other.label}</span>
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

      {children.length ? (
        <section className="mt-10">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground">
            {category.label} inside {place.name}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {children.map((child: PlaceBrief) => (
              <li key={child.id}>
                <Link
                  className="underline-offset-4 hover:underline"
                  params={{
                    country: child.countrySegment || "gb",
                    place: child.slug,
                    service: category.slug,
                  }}
                  to="/$country/$place/$service"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
