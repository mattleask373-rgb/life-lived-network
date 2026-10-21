/**
 * Pure view helpers for EntryCard. Reads only canonical entry fields — never
 * invents a photo, alt text or credit.
 */
import type { SourcePhoto, WorldEntry } from "./world-data";

/** Filter source photo records to entries with a usable URL. Be defensive at
 * this presentation boundary because imported/provider data may be malformed. */
export function usableSourcePhotos(
  photos: readonly SourcePhoto[] | null | undefined,
): SourcePhoto[] {
  return (photos ?? []).filter((photo): photo is SourcePhoto => {
    const url: unknown = (photo as { url?: unknown } | null | undefined)?.url;
    return typeof url === "string" && url.trim().length > 0;
  });
}

export interface CardPhoto {
  url: string;
  alt: string;
  credit: string;
}

/** First source-backed photo with a usable URL, or null for the neutral fallback. */
export function cardPhoto(entry: Pick<WorldEntry, "photos" | "title">): CardPhoto | null {
  const photo = usableSourcePhotos(entry.photos)[0];
  if (!photo) return null;
  return {
    url: photo.url,
    // Source alt text when supplied; otherwise describe it truthfully as a listing photo.
    alt: photo.alt.trim() || `Photo supplied with “${entry.title}”`,
    credit: photo.credit.trim(),
  };
}

export const NO_PHOTO_LABEL = "No photo supplied";
