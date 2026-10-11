/**
 * Places a person has known — the private half of the lifelong map.
 *
 * A memory is the person's own words about a place on record. It is always
 * private, never feeds discovery or matching, and never implies the person is
 * there now, serves there, or is available there.
 */
import { z } from "zod";

export const MEMORY_NOTE_MAX = 2000;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a full date")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Not a real date");

const optionalDate = z
  .union([isoDate, z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : null));

export const memoryInput = z
  .object({
    id: z.string().uuid().optional(),
    placeId: z.string().uuid(),
    startedOn: optionalDate,
    endedOn: optionalDate,
    note: z.string().trim().max(MEMORY_NOTE_MAX).default(""),
  })
  .refine((m) => !m.startedOn || !m.endedOn || m.endedOn >= m.startedOn, {
    message: "The end can't be before the start",
    path: ["endedOn"],
  });

export type MemoryInput = z.input<typeof memoryInput>;

export const memoryIdInput = z.object({ id: z.string().uuid() });

export interface PlaceMemory {
  id: string;
  placeId: string;
  startedOn: string | null;
  endedOn: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
  place: { name: string; slug: string; countryCode: string } | null;
}

export interface MemoryRow {
  id: string;
  place_id: string;
  started_on: string | null;
  ended_on: string | null;
  note: string;
  created_at: string;
  updated_at: string;
  places?: { name: string; slug: string; country_code: string } | null;
}

export function rowToMemory(row: MemoryRow): PlaceMemory {
  return {
    id: row.id,
    placeId: row.place_id,
    startedOn: row.started_on,
    endedOn: row.ended_on,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    place: row.places
      ? { name: row.places.name, slug: row.places.slug, countryCode: row.places.country_code }
      : null,
  };
}

/** Newest first; undated memories last, in the order they were added. */
export function sortMemories(list: PlaceMemory[]): PlaceMemory[] {
  return [...list].sort((a, b) => {
    const ak = a.startedOn ?? a.endedOn;
    const bk = b.startedOn ?? b.endedOn;
    if (ak && bk) return ak < bk ? 1 : ak > bk ? -1 : 0;
    if (ak) return -1;
    if (bk) return 1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

/** Honest wording for whatever dates were (or weren't) given. */
export function memoryWhen(m: Pick<PlaceMemory, "startedOn" | "endedOn">): string {
  if (m.startedOn && m.endedOn)
    return m.startedOn === m.endedOn ? m.startedOn : `${m.startedOn} to ${m.endedOn}`;
  if (m.startedOn) return `From ${m.startedOn}`;
  if (m.endedOn) return `Until ${m.endedOn}`;
  return "No dates given";
}

export interface ExportSection {
  name: string;
  rows: unknown[];
}

export const EXPORT_SCOPE_NOTE =
  "This download contains the records listed under 'included'. It is not a complete account export: conversations, requests you posted, reports and your on-device life list are not included yet.";

export function buildExport(userId: string, sections: ExportSection[], now = new Date()) {
  return {
    format: "real-world-atlas-export",
    version: 1,
    exportedAt: now.toISOString(),
    userId,
    complete: false,
    scopeNote: EXPORT_SCOPE_NOTE,
    included: sections.map((s) => s.name),
    data: Object.fromEntries(sections.map((s) => [s.name, s.rows])),
  };
}
