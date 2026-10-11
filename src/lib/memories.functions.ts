/**
 * Owner-only memory actions. Every call runs as the signed-in person, so the
 * database's owner-only rules decide what can be read or changed; the
 * explicit user filters below are a second fence, not the only one.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  buildExport,
  memoryIdInput,
  memoryInput,
  rowToMemory,
  sortMemories,
  type MemoryRow,
  type PlaceMemory,
} from "./memories";

const SELECT =
  "id, place_id, started_on, ended_on, note, created_at, updated_at, places(name, slug, country_code)";

export const listMyMemories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlaceMemory[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("place_memories")
      .select(SELECT)
      .eq("user_id", userId)
      .limit(1000);
    if (error) throw new Error("Couldn't load your places just now.");
    return sortMemories(((data ?? []) as unknown as MemoryRow[]).map(rowToMemory));
  });

export const saveMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => memoryInput.parse(input))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { supabase, userId } = context;
    const row = {
      place_id: data.placeId,
      started_on: data.startedOn,
      ended_on: data.endedOn,
      note: data.note,
    };
    if (data.id) {
      const { data: updated, error } = await supabase
        .from("place_memories")
        .update(row)
        .eq("id", data.id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();
      if (error) throw new Error("Couldn't save that change.");
      if (!updated) throw new Error("That memory isn't here any more.");
      return { id: updated.id };
    }
    const { data: created, error } = await supabase
      .from("place_memories")
      .insert({ ...row, user_id: userId, visibility: "private" })
      .select("id")
      .single();
    if (error) throw new Error("Couldn't save that place.");
    return { id: created.id };
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => memoryIdInput.parse(input))
  .handler(async ({ data, context }): Promise<{ deleted: boolean }> => {
    const { supabase, userId } = context;
    const { data: gone, error } = await supabase
      .from("place_memories")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("id");
    if (error) throw new Error("Couldn't delete that just now.");
    return { deleted: (gone ?? []).length > 0 };
  });

/** A partial, clearly-labelled export of records this person owns. */
export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [memories, profile, capabilities, areas, availability, saved] = await Promise.all([
      supabase.from("place_memories").select("*").eq("user_id", userId),
      supabase.from("profiles").select("*").eq("id", userId),
      supabase.from("person_capabilities").select("*").eq("user_id", userId),
      supabase.from("service_areas").select("*").eq("user_id", userId),
      supabase.from("availability_windows").select("*").eq("user_id", userId),
      supabase.from("saved_items").select("*").eq("user_id", userId),
    ]);
    const failed = [memories, profile, capabilities, areas, availability, saved].some(
      (r) => r.error,
    );
    if (failed) throw new Error("Couldn't prepare your download. Nothing was partially saved.");
    const file = buildExport(userId, [
      { name: "place_memories", rows: memories.data ?? [] },
      { name: "profile", rows: profile.data ?? [] },
      { name: "capabilities", rows: capabilities.data ?? [] },
      { name: "service_areas", rows: areas.data ?? [] },
      { name: "availability_windows", rows: availability.data ?? [] },
      { name: "saved_items", rows: saved.data ?? [] },
    ]);
    // Sent as text so the download is exactly what the database returned.
    return { exportedAt: file.exportedAt, json: JSON.stringify(file, null, 2) };
  });
