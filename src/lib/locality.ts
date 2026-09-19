/**
 * A locality, read as one thing.
 *
 * The same canonical entries that fill the map also answer the questions a
 * person actually arrives with: what's happening, what's here, who provides
 * something, what could I give. These are pure helpers over entries somebody
 * else fetched — no locality is named here, and nothing is invented: a question
 * with no answer returns nothing, and the interface says so.
 */

import { isService } from "./services";
import type { WorldEntry } from "./world-data";

/** Something with a real instant, still ahead of us, not called off. */
export function upcomingEvents(entries: WorldEntry[], now = Date.now()): WorldEntry[] {
  return entries
    .filter((entry) => Boolean(entry.startsAt) && !entry.cancellation)
    .filter((entry) => {
      const at = Date.parse(entry.startsAt ?? "");
      return Number.isFinite(at) && at >= now - 3 * 3600_000;
    })
    .sort((a, b) => Date.parse(a.startsAt ?? "") - Date.parse(b.startsAt ?? ""));
}

export interface ProviderGroup {
  /** The practice, studio, venue or business. Empty for unattached services. */
  organisation: string;
  entries: WorldEntry[];
}

/**
 * Services gathered under whoever provides them, so an organisation reads as
 * one place with several practices rather than as several adverts. The system
 * has no idea which organisation is which; it only groups on a stored fact.
 */
export function providerGroups(entries: WorldEntry[]): ProviderGroup[] {
  const groups = new Map<string, WorldEntry[]>();
  for (const entry of entries) {
    if (!isService(entry)) continue;
    if (entry.quality === "expired" || entry.cancellation) continue;
    const key = entry.organisation?.trim() ?? "";
    const list = groups.get(key);
    if (list) list.push(entry);
    else groups.set(key, [entry]);
  }
  return (
    [...groups.entries()]
      .map(([organisation, list]) => ({
        organisation,
        entries: [...list].sort((a, b) => a.title.localeCompare(b.title)),
      }))
      // A named provider before loose services; then alphabetical, never ranked.
      .sort((a, b) => {
        if (Boolean(a.organisation) !== Boolean(b.organisation)) return a.organisation ? -1 : 1;
        if (a.entries.length !== b.entries.length) return b.entries.length - a.entries.length;
        return a.organisation.localeCompare(b.organisation);
      })
  );
}

/** Hours and skills somebody has actually offered here. */
export function contributions(entries: WorldEntry[]): WorldEntry[] {
  return entries.filter((entry) => Boolean(entry.give && entry.give.trim()) && !isService(entry));
}

export interface LocalityQuestion {
  id: "happening" | "here" | "who" | "needed" | "possible";
  question: string;
  /** How many real answers exist. 0 is a valid, honest answer. */
  count: number;
  /** What the count is counting, in plain words. */
  unit: string;
  /** Where the answer lives: a section on this page, or another screen. */
  href: string;
}

/**
 * The questions a locality answers, with true counts. A question is never
 * hidden because the answer is zero — a quiet locality is a fact worth saying,
 * and an invitation.
 */
export function localityQuestions(
  entries: WorldEntry[],
  openNeeds: number,
  now = Date.now(),
): LocalityQuestion[] {
  const services = providerGroups(entries);
  return [
    {
      id: "happening",
      question: "What's happening?",
      count: upcomingEvents(entries, now).length,
      unit: "with a date and time",
      href: "#happening",
    },
    {
      id: "here",
      question: "What's here?",
      count: services.reduce((total, group) => total + group.entries.length, 0),
      unit: "practices and services",
      href: "#here",
    },
    {
      id: "who",
      question: "Who's here?",
      count: contributions(entries).length,
      unit: "offers of time or skill",
      href: "#who",
    },
    {
      id: "needed",
      question: "What's needed?",
      count: openNeeds,
      unit: "things people have asked for",
      href: "/need",
    },
    {
      id: "possible",
      question: "What could happen?",
      count: entries.length,
      unit: "real things to build from",
      href: "/journey",
    },
  ];
}
