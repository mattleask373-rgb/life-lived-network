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

export function money(cost: number): string {
  if (cost < 0) return `Pays €${Math.abs(cost)}`;
  if (cost === 0) return "Free";
  return `€${cost}`;
}

export function duration(minutes: number): string {
  if (minutes === 0) return "No fixed time";
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr`;
}
