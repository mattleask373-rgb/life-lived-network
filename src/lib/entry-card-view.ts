/**
 * Pure view helpers for EntryCard. Reads only canonical entry fields — never
 * invents a photo, alt text or credit.
 */
import type { SourcePhoto, WorldEntry } from "./world-data";

export interface CardPhoto {
  url: string;
  alt: string;
  credit: string;
}

/** First source-backed photo with a usable URL, or null for the neutral fallback. */
export function cardPhoto(entry: Pick<WorldEntry, "photos" | "title">): CardPhoto | null {
  const photo = (entry.photos ?? []).find((p: SourcePhoto) => p.url.trim().length > 0);
  if (!photo) return null;
  return {
    url: photo.url,
    // Source alt text when supplied; otherwise describe it truthfully as a listing photo.
    alt: photo.alt.trim() || `Photo supplied with “${entry.title}”`,
    credit: photo.credit.trim(),
  };
}

export const NO_PHOTO_LABEL = "No photo supplied";
