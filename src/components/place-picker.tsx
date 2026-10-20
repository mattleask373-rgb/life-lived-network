/**
 * Choosing where you are.
 *
 * Search by name, or walk the hierarchy: up to the county, region and country,
 * down into the towns and neighbourhoods. Nothing here knows about any
 * particular city — it reads the same generic place hierarchy everywhere else
 * uses.
 */

import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { KIND_LABEL, placePath, searchPlaces, type Place } from "@/lib/places";
import { useWorldContext } from "@/lib/world-context";

export function PlacePicker() {
  const {
    index,
    place,
    ancestors,
    children,
    setPlaceSlug,
    loading,
    loadError,
    defaultUnavailable,
    retryPlaceIndex,
  } = useWorldContext();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(
    () => (index && query.trim() ? searchPlaces(index, query, 10) : []),
    [index, query],
  );

  const choose = (next: Place) => {
    setPlaceSlug(next.slug);
    setQuery("");
    setOpen(false);
  };

  if (loading && !place) {
    return <p className="text-sm text-muted-foreground">Finding your way around…</p>;
  }

  if (loadError && !index) {
    return (
      <div className="card-paper p-4 sm:p-5">
        <p role="alert" className="text-sm">
          We couldn't load the supported places just now.
        </p>
        <button
          type="button"
          onClick={retryPlaceIndex}
          className="focus-ink mt-3 min-h-11 rounded-full border border-border bg-background px-4 py-2 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  const pickerOpen = open || defaultUnavailable;

  return (
    <div className="card-paper p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
          Where are you?
        </p>
        {!defaultUnavailable ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={pickerOpen}
            className="focus-ink min-h-11 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {open ? "Done" : "Somewhere else"}
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">Choose a supported place</span>
        )}
      </div>

      <p className="mt-2 font-display text-xl leading-snug">
        {place && index ? placePath(index, place.id, 3) : "Choose a supported place"}
      </p>

      {defaultUnavailable ? (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          The configured starting place isn't present in the available canonical place records.
          Choose another supported place below. No listings are invented for unsupported places.
        </p>
      ) : null}

      {pickerOpen ? (
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="text-muted-foreground">Search for a place</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a town, city or neighbourhood"
              className="focus-ink mt-2 min-h-11 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-base placeholder:text-muted-foreground/80"
            />
          </label>

          {query.trim() ? (
            results.length ? (
              <ul className="space-y-2" aria-label="Place search results" aria-live="polite">
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => choose(r)}
                      className="focus-ink flex min-h-12 w-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/50"
                    >
                      <span className="min-w-0 flex-1">{placePath(index!, r.id, 3)}</span>
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-[0.65rem] text-muted-foreground">
                        {KIND_LABEL[r.kind]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                role="status"
                className="rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground"
              >
                We couldn't find that name in the current place records. Try a nearby town, region
                or country.
              </p>
            )
          ) : null}

          {ancestors.length ? (
            <div>
              <p className="text-sm text-muted-foreground">Step out to</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ancestors.map((a) => (
                  <Chip key={a.id} onClick={() => choose(a)} label={a.name} />
                ))}
              </div>
            </div>
          ) : null}

          {children.length ? (
            <div>
              <p className="text-sm text-muted-foreground">Look closer at</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {children.slice(0, 40).map((c) => (
                  <Chip key={c.id} onClick={() => choose(c)} label={c.name} />
                ))}
              </div>
              {children.length > 40 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {children.length - 40} more inside here — search by name to reach them.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ink inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
    >
      {label}
    </button>
  );
}
