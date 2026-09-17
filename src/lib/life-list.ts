/**
 * Life List — the things a person said "why not" to.
 *
 * Kept locally while someone is only exploring, and moved into their account
 * (saved_items) the moment they sign in. No scores, nothing public.
 */

const KEY = "living-world.life-list";

export const LIFE_LIST_CATEGORIES = [
  "want to do",
  "want to visit",
  "want to learn",
  "want to help",
  "want to meet",
  "someday",
] as const;

export type LifeListCategory = (typeof LIFE_LIST_CATEGORIES)[number];

export interface LifeListItem {
  ref: string;
  category: LifeListCategory;
}

export function readLifeList(): LifeListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) =>
      typeof item === "string"
        ? { ref: item, category: "want to do" as LifeListCategory }
        : (item as LifeListItem),
    );
  } catch {
    return [];
  }
}

export function writeLifeList(items: LifeListItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable — the app still works, it just forgets */
  }
}
