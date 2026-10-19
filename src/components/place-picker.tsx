/**
 * Choosing where you are.
 *
 * Search by name, or walk the hierarchy: up to the county, region and country,
 * down into the towns and neighbourhoods. Nothing here knows about any
 * particular city — it reads the same generic place hierarchy everywhere else
 * uses.
 */

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
      <div className="card-paper p-4">
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
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Where are you?</p>
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

      <p className="mt-1 text-lg">
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
              placeholder="Kings Heath, Manchester, Herefordshire, Edinburgh, Galway…"
              className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          {query.trim() ? (
            results.length ? (
              <ul className="space-y-1">
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => choose(r)}
                      className="focus-ink w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:shadow-paper"
                    >
                      {placePath(index!, r.id, 3)}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {KIND_LABEL[r.kind]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
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
      className="focus-ink rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
    >
      {label}
    </button>
  );
}
