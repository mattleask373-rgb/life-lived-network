/**
 * Server-rendered service + locality landing page.
 *
 * `/<country>/<place>/<service>` uses the canonical place hierarchy, service
 * taxonomy, public record boundary, and the shared fail-closed SEO gate.
 * Empty pages remain useful to visitors but are not offered to search engines.
 */
import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";

import { fetchWorldEntries } from "@/lib/listings";
import { getLocality, type PlaceBrief } from "@/lib/locality.functions";
import { categoryBySlug, categoriesPresent } from "@/lib/service-taxonomy";
import {
  evaluateServiceLocalityPage,
  publicServiceEntries,
  serviceLocalityPath,
} from "@/lib/service-locality";
import { privatePage, publicPage } from "@/lib/seo";
import { BOOKING_LABEL, nextStepFor, providerLine, qualificationLine } from "@/lib/services";
import { QUALITY_LABEL, type WorldEntry } from "@/lib/world-data";

export const Route = createFileRoute("/$country/$place/$service")({
  loader: async ({ params }) => {
    const geography = await getLocality({ data: { slug: params.place } });
    if (!geography) throw notFound();

    const canonicalLocality = `/${geography.place.countrySegment || "gb"}/${geography.place.slug}`;
    if (canonicalLocality !== `/${params.country}/${params.place}`) {
      throw redirect({ to: canonicalLocality });
    }

    const category = categoryBySlug(params.service);
    if (!category) throw notFound();

    const entries = await fetchWorldEntries({ placeId: geography.place.id, limit: 60 });
    return { geography, category, entries };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return privatePage({ path: "", title: "Service in a place", description: "" });

    const { geography, category, entries } = loaderData;
    const { place } = geography;
    const path = serviceLocalityPath(place, category.slug);
    const gate = evaluateServiceLocalityPage({ place, serviceSlug: category.slug, entries });
    const title = `${category.label} in ${place.name} | Real World Atlas`;
    const description =
      gate.status === "INDEXABLE"
        ? `Current, attributable ${category.label.toLowerCase()} records in ${place.name}, using details the provider or source has supplied.`
        : `What we can currently verify about ${category.label.toLowerCase()} in ${place.name}. This page is kept out of search until its public records meet the shared quality gate.`;

    return gate.status === "INDEXABLE"
      ? publicPage({ path, title, description })
      : privatePage({ path, title, description });
  },
  component: ServiceLocalityPage,
});

function localityPath(place: PlaceBrief): string {
  return `/${place.countrySegment || "gb"}/${place.slug}`;
}

function SafeExternalLink({ href, children }: { href: string; children: string }) {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return (
      <a href={url.toString()} target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">
        {children}
      </a>
    );
  } catch {
    return null;
  }
}

function ServiceRecord({ entry }: { entry: WorldEntry }) {
  const step = nextStepFor(entry);
  return (
    <article className="card-paper p-5" key={entry.id}>
      <h2 className="text-xl">{entry.title}</h2>
      {entry.summary.trim() ? <p className="mt-2 text-sm">{entry.summary}</p> : null}
      <p className="mt-2 text-sm text-muted-foreground">
        {entry.place}
        {entry.neighbourhood && entry.neighbourhood !== entry.place ? ` · ${entry.neighbourhood}` : ""}
      </p>
      {entry.organisation || entry.providerNote ? (
        <p className="mt-2 text-sm">{providerLine(entry)}</p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Provider not yet named</p>
      )}
      <p className="mt-2 text-sm">{qualificationLine(entry)}</p>
      <p className="mt-2 text-sm">
        {entry.quality ? QUALITY_LABEL[entry.quality] : "Current quality has not been recorded"}
      </p>
      {entry.when.trim() ? <p className="mt-2 text-sm">Times as stated: {entry.when}</p> : null}
      {entry.origin === "source" || entry.origin === "confirmed" ? (
        <p className="mt-2 text-sm">
          Source: {entry.sourceName?.trim() || "Source name not recorded"}
          {entry.sourceUrl ? (
            <>
              {" · "}
              <SafeExternalLink href={entry.sourceUrl}>Read source</SafeExternalLink>
            </>
          ) : null}
        </p>
      ) : null}
      <div className="mt-3 text-sm">
        <p>{entry.bookingState ? BOOKING_LABEL[entry.bookingState] : "Booking status not recorded"}</p>
        {step.href ? (
          <p className="mt-1">
            <SafeExternalLink href={step.href}>{step.label}</SafeExternalLink>
            <span className="block text-muted-foreground">{step.note}</span>
          </p>
        ) : (
          <p className="mt-1 text-muted-foreground">
            {entry.bookingState === "enquire"
              ? "An enquiry form is not connected to this page yet."
              : step.note}
          </p>
        )}
      </div>
    </article>
  );
}

function ServiceLocalityPage() {
  const { geography, category, entries } = Route.useLoaderData();
  const { place, ancestors } = geography;
  const services = publicServiceEntries(entries, category.slug);
  const allReal = entries.filter((entry) => !entry.demonstration);
  const siblingCategories = categoriesPresent(allReal).filter(
    ({ category: sibling }) => sibling.slug !== category.slug,
  );
  const gate = evaluateServiceLocalityPage({ place, serviceSlug: category.slug, entries });

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link className="underline-offset-4 hover:underline" to="/">
          Real World Atlas
        </Link>
        <span aria-hidden="true"> › </span>
        <Link
          className="underline-offset-4 hover:underline"
          params={{ country: place.countrySegment || "gb", place: place.slug }}
          to="/$country/$place"
        >
          {place.name}
        </Link>
        <span aria-hidden="true"> › </span>
        <span className="text-foreground">{category.label}</span>
      </nav>

      <h1 className="mt-4 text-4xl leading-tight">{category.label} in {place.name}</h1>
      <p className="mt-3 max-w-2xl text-base">
        This page shows service records connected to {place.name}. Details, provider names,
        qualifications, times and booking pathways are shown only when they have been recorded.
        A listing is not a guarantee of availability or qualification.
      </p>

      {services.length ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            {services.length === 1 ? "One current service record is" : `${services.length} current service records are`} on record.
            {gate.status !== "INDEXABLE" ? " This page is not yet eligible for search indexing." : ""}
          </p>
          <section aria-label={`${category.label} records`} className="mt-4 grid gap-4 md:grid-cols-2">
            {services.map((entry) => <ServiceRecord key={entry.id} entry={entry} />)}
          </section>
        </>
      ) : (
        <section className="card-paper mt-6 max-w-3xl p-5">
          <h2 className="text-xl">No current service records on file</h2>
          <p className="mt-2 text-sm">
            We have no published, non-demonstration {category.label.toLowerCase()} records to show
            for {place.name} right now. That describes this site's records, not everything that may
            exist locally.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            We will keep this page out of search until its records and locality information pass the
            shared quality gate. No listing, price, time or availability has been inferred.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link className="underline underline-offset-4" to="/need">Describe what you need</Link>
            <Link className="underline underline-offset-4" to="/make">Add something you know about</Link>
          </div>
        </section>
      )}

      {siblingCategories.length ? (
        <section className="mt-10">
          <h2 className="text-xl">Other services recorded in {place.name}</h2>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {siblingCategories.map(({ category: sibling }) => (
              <li key={sibling.slug}>
                <Link
                  className="underline underline-offset-4"
                  params={{
                    country: place.countrySegment || "gb",
                    place: place.slug,
                    service: sibling.slug,
                  }}
                  to="/$country/$place/$service"
                >
                  {sibling.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {ancestors[0] ? (
        <section className="mt-10">
          <h2 className="text-xl">Explore the wider area</h2>
          <p className="mt-2 text-sm">
            This is the nearest parent locality currently recorded for {place.name}: {ancestors[0].name}.
          </p>
          <Link
            className="mt-2 inline-block underline underline-offset-4"
            params={{ country: ancestors[0].countrySegment || "gb", place: ancestors[0].slug }}
            to="/$country/$place"
          >
            Browse {ancestors[0].name}
          </Link>
        </section>
      ) : null}

      <section className="mt-10 card-paper p-5">
        <h2 className="text-xl">Plan what to do next</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The map, journey planner and road-trip view use the existing discovery surfaces.
          They do not imply that a service or opportunity is available here.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link className="underline underline-offset-4" to="/">Open the living map</Link>
          <Link className="underline underline-offset-4" to="/journey">Explore a few hours</Link>
          <Link className="underline underline-offset-4" to="/road-trip">Explore a road trip</Link>
          <Link
            className="underline underline-offset-4"
            params={{ country: place.countrySegment || "gb", place: place.slug }}
            to="/$country/$place"
          >
            All records in {place.name}
          </Link>
        </div>
      </section>
    </main>
  );
}
