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

export async function fetchHours(): Promise<HourOffer[]> {
  const { data, error } = await supabase
    .from("hour_offers")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = (data ?? []) as HourOffer[];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ids);
    for (const p of profiles ?? []) {
      if (p.display_name) names.set(p.id, p.display_name);
    }
  }
  return rows.map((r) => {
    const person = names.get(r.user_id);
    return person ? { ...r, person } : r;
  });
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
