import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { KIND_LABEL, placePath, searchPlaces, type Place, type PlaceIndex } from "@/lib/places";

/**
 * Choose any place in the world index by name.
 *
 * Generic: it knows nothing about which country or locality is special, and
 * repeated names stay distinguishable because each suggestion shows where it is.
 */
export function PlaceSearch({
  index,
  value,
  label,
  placeholder,
  onChange,
}: {
  index: PlaceIndex | null;
  value: Place | null;
  label: string;
  placeholder?: string;
  onChange: (place: Place) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => (index && query.trim().length > 1 ? searchPlaces(index, query, 8) : []),
    [index, query],
  );

  return (
    <div>
      <label className="block text-sm text-muted-foreground" htmlFor={`place-${label}`}>
        {label}
      </label>
      <div className="relative mt-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id={`place-${label}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? (value ? value.name : "Search by name")}
          className="focus-ink w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-3 text-sm"
          autoComplete="off"
        />
      </div>
      {value ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {index ? placePath(index, value.id) : value.name} · {KIND_LABEL[value.kind]}
        </p>
      ) : null}
      {results.length ? (
        <ul className="mt-2 space-y-1">
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(place);
                  setQuery("");
                }}
                className="focus-ink w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-sm"
              >
                {place.name}
                <span className="block text-xs text-muted-foreground">
                  {index ? placePath(index, place.id) : ""} · {KIND_LABEL[place.kind]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
