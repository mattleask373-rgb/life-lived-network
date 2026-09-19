/**
 * The one-hour economy.
 *
 * Someone has an hour and something useful in their hands; someone else needs
 * exactly that. No scores, no leaderboards — just hours, in people's own words.
 */

import { supabase } from "@/integrations/supabase/client";

export type HourDirection = "offering" | "asking";

export interface HourOffer {
  id: string;
  user_id: string;
  title: string;
  detail: string;
  skills: string[];
  neighbourhood: string;
  when_text: string;
  minutes: number;
  direction: HourDirection;
  status: string;
  created_at: string;
  /** Filled in from the person's profile when they're discoverable. */
  person?: string;
}

export interface NewHourOffer {
  title: string;
  detail: string;
  skills: string[];
  neighbourhood: string;
  when_text: string;
  minutes: number;
  direction: HourDirection;
}

/** Open hours for a context, read through the server boundary and paged. */
export async function fetchHours(context: DiscoveryContext = {}): Promise<HourOffer[]> {
  const { getOpenHours } = await import("./hours.functions");
  const page = await getOpenHours({ data: context });
  return page.items;
}

export async function createHour(input: NewHourOffer, userId: string) {
  const { error } = await supabase
    .from("hour_offers")
    .insert({ ...input, user_id: userId });
  if (error) throw error;
}

export async function closeHour(id: string) {
  const { error } = await supabase
    .from("hour_offers")
    .update({ status: "closed" })
    .eq("id", id);
  if (error) throw error;
}
