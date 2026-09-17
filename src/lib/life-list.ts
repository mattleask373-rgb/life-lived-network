/**
 * Life List — the things a person said "why not" to.
 *
 * Stored locally for the prototype. Swap the two functions below for a real
 * saved_items table later; nothing else needs to change.
 */

const KEY = "living-world.life-list";

export function readLifeList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeLifeList(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — the app still works, it just forgets */
  }
}
