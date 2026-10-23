import type { LayerId } from "@/lib/world-data";
import {
  formatLocalizedCurrency,
  formatLocalizedDuration,
  formatLocalizedEventDate,
  type Locale,
} from "@/lib/locale";

/**
 * Layer colours resolve to design tokens only — never raw hex in components.
 */
export const layerText: Record<LayerId, string> = {
  work: "text-work",
  experience: "text-experience",
  music: "text-music",
  art: "text-art",
  community: "text-community",
  people: "text-people",
  nature: "text-nature",
  food: "text-food",
};

export const layerBg: Record<LayerId, string> = {
  work: "bg-work",
  experience: "bg-experience",
  music: "bg-music",
  art: "bg-art",
  community: "bg-community",
  people: "bg-people",
  nature: "bg-nature",
  food: "bg-food",
};

export const layerBorder: Record<LayerId, string> = {
  work: "border-work",
  experience: "border-experience",
  music: "border-music",
  art: "border-art",
  community: "border-community",
  people: "border-people",
  nature: "border-nature",
  food: "border-food",
};

const SYMBOL: Record<string, string> = { GBP: "£", EUR: "€", USD: "$" };

/** Just the symbol, for labels and ranges that are not a single amount. */
export function currencySymbol(currency = "GBP"): string {
  return SYMBOL[currency] ?? `${currency} `;
}

export function money(cost: number, currency = "GBP", locale: Locale = "en"): string {
  return formatLocalizedCurrency(cost, currency, locale);
}
export function duration(minutes: number, locale: Locale = "en"): string {
  return formatLocalizedDuration(minutes, locale);
}
export function eventDate(startsAt: string, timezone?: string, locale: Locale = "en"): string {
  return formatLocalizedEventDate(startsAt, timezone, locale);
}
