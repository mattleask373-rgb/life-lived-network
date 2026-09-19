import type { LayerId } from "@/lib/world-data";

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

export function money(cost: number, currency = "GBP"): string {
  const symbol = SYMBOL[currency] ?? `${currency} `;
  if (cost < 0) return `Pays ${symbol}${Math.abs(cost)}`;
  if (cost === 0) return "Free";
  return `${symbol}${cost}`;
}

export function duration(minutes: number): string {
  if (minutes === 0) return "No fixed time";
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * A real date and time, in the time zone where it is actually happening.
 *
 * Assembled from numeric parts and our own names rather than a locale string,
 * so a server and a browser in different places always read it out identically.
 */
export function eventDate(startsAt: string, timezone?: string): string {
  const at = new Date(startsAt);
  if (Number.isNaN(at.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(timezone ? { timeZone: timezone } : {}),
  }).formatToParts(at);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = DAYS[new Date(`${at.toISOString()}`).getUTCDay()] ?? "";
  const day = Number(get("day"));
  const month = MONTHS[Number(get("month")) - 1] ?? "";
  const hour = get("hour").padStart(2, "0");
  const minute = get("minute").padStart(2, "0");
  if (!day || !month) return "";
  const named = get("weekday") || weekday;
  return `${named} ${day} ${month}, ${hour}:${minute}`;
}
