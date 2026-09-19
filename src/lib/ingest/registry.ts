/**
 * Which adapters exist. Sources themselves are rows in the database, so adding
 * a locality, a venue calendar or a council feed is a matter of data; adding a
 * differently-shaped source is the only thing that needs code.
 */

import type { SourceAdapter } from "./contract";
import { ticketmasterAdapter, TICKETMASTER_KEY } from "./ticketmaster";

const ADAPTERS: SourceAdapter[] = [ticketmasterAdapter];

export function adapterFor(key: string): SourceAdapter | null {
  return ADAPTERS.find((adapter) => adapter.key === key) ?? null;
}

export function adapterKeys(): string[] {
  return ADAPTERS.map((adapter) => adapter.key);
}

export { TICKETMASTER_KEY };
