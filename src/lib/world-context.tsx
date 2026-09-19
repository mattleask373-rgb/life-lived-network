/**
 * Where the person currently is.
 *
 * One shared context, so every screen asks the same question of the same place
 * instead of each one resolving a default of its own. It holds a slug, reads the
 * (small, public, cached) geography index, and hands screens the resolved place,
 * its ancestors, its children and the locality ids a discovery query should
 * consider. No activity is loaded here.
 */

import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_PLACE_SLUG,
  ancestorsOf,
  buildPlaceIndex,
  childrenOf,
  descendantIdsOf,
  descendantSlugsOf,
  fetchPlaceIndex,
  placePath,
  type Place,
  type PlaceIndex,
} from "./places";

const STORAGE_KEY = "living-world:place";

export interface WorldContextValue {
  /** The geography index, once it has loaded. */
  index: PlaceIndex | null;
  loading: boolean;
  /** Where we are looking. Null only while geography is still loading. */
  place: Place | null;
  /** Nearest parent first. */
  ancestors: Place[];
  /** Everywhere directly inside here. */
  children: Place[];
  /** This place and everywhere inside it — what a discovery query considers. */
  placeIds: string[];
  placeSlugs: string[];
  /** "Digbeth, Birmingham, West Midlands" */
  path: string;
  setPlaceSlug: (slug: string) => void;
}

const WorldContext = createContext<WorldContextValue | null>(null);

function storedSlug(): string {
  if (typeof window === "undefined") return DEFAULT_PLACE_SLUG;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_PLACE_SLUG;
  } catch {
    return DEFAULT_PLACE_SLUG;
  }
}

export function WorldProvider({ children }: { children: ReactNode }) {
  // Server and first client render agree on the default; the stored choice is
  // read after hydration so the markup never mismatches.
  const [slug, setSlug] = useState(DEFAULT_PLACE_SLUG);
  useEffect(() => {
    const saved = storedSlug();
    if (saved !== DEFAULT_PLACE_SLUG) setSlug(saved);
  }, []);

  const { data: places, isLoading } = useQuery({
    queryKey: ["places", "index"],
    queryFn: fetchPlaceIndex,
    staleTime: 1000 * 60 * 60,
  });

  const index = useMemo(() => (places ? buildPlaceIndex(places) : null), [places]);

  const setPlaceSlug = useCallback((next: string) => {
    setSlug(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* choosing a place must never fail because storage is unavailable */
    }
  }, []);

  const value = useMemo<WorldContextValue>(() => {
    const place =
      (index && (index.bySlug.get(slug) ?? index.bySlug.get(DEFAULT_PLACE_SLUG))) || null;
    if (!index || !place) {
      return {
        index,
        loading: isLoading,
        place,
        ancestors: [],
        children: [],
        placeIds: [],
        placeSlugs: [],
        path: "",
        setPlaceSlug,
      };
    }
    return {
      index,
      loading: isLoading,
      place,
      ancestors: ancestorsOf(index, place.id),
      children: childrenOf(index, place.id),
      placeIds: descendantIdsOf(index, place.id),
      placeSlugs: descendantSlugsOf(index, place.id),
      path: placePath(index, place.id),
      setPlaceSlug,
    };
  }, [index, isLoading, slug, setPlaceSlug]);

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;
}

export function useWorldContext(): WorldContextValue {
  const value = useContext(WorldContext);
  if (!value) throw new Error("useWorldContext must be used inside WorldProvider");
  return value;
}
