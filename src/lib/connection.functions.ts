/**
 * Connection, behind the server.
 *
 * Every read and write here is scoped to the two people involved, by the
 * access rules and again in code. Nothing is public. Nothing is sent on
 * anyone's behalf.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  canMove,
  contextFromNeed,
  isOpen,
  roleFor,
  rowToMessage,
  rowToRequest,
  type ConnectionDirection,
  type ConnectionMessage,
  type ConnectionRequest,
  type ConnectionRequestRow,
  type ConnectionMessageRow,
  type ConnectionStatus,
} from "./connection";
import { rowToNeed, type NeedRow } from "./needs";

const MAX_NOTE = 600;
const MAX_LIST = 100;

export interface ConnectionSummary extends ConnectionRequest {
  /** The other person's display name, only if their profile is discoverable. */
  otherName: string;
  lastMessageAt: string | null;
  messageCount: number;
}

/** Say you could help with something, or ask someone if they would. */
export const sendConnectionRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      needId: string;
      recipientId: string;
      direction: ConnectionDirection;
      note?: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<ConnectionRequest> => {
    if (data.recipientId === context.userId) {
      throw new Error("You can't send this to yourself.");
    }

    const { data: needRow, error: needError } = await context.supabase
      .from("needs")
      .select("*")
      .eq("id", data.needId)
      .maybeSingle();
    if (needError) throw needError;
    if (!needRow) throw new Error("That need isn't here any more.");
    const need = rowToNeed(needRow as unknown as NeedRow);

    // An invitation can only come from the person who asked for help.
    if (data.direction === "invite" && need.creatorId !== context.userId) {
      throw new Error("Only the person who posted this can invite someone to it.");
    }
    // An offer of help can only go to the person who asked.
    if (data.direction === "offer" && need.creatorId !== data.recipientId) {
      throw new Error("An offer of help goes to the person who asked.");
    }

    const snapshot = contextFromNeed(need);
    const { data: row, error } = await context.supabase
      .from("connection_requests")
      .insert({
        need_id: data.needId,
        sender_id: context.userId,
        recipient_id: data.recipientId,
        direction: data.direction,
        note: (data.note ?? "").slice(0, MAX_NOTE),
        context_title: snapshot.title,
        context_place: snapshot.place,
        context_when: snapshot.when,
      })
      .select("*")
      .single();
    if (error) throw error;
    return rowToRequest(row as unknown as ConnectionRequestRow);
  });

/** Accept, decline, or take it back. Only the right side can do each one. */
export const moveConnectionRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: ConnectionStatus }) => input)
  .handler(async ({ data, context }): Promise<ConnectionRequest> => {
    const { data: current, error: readError } = await context.supabase
      .from("connection_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) throw new Error("That conversation isn't here any more.");

    const request = rowToRequest(current as unknown as ConnectionRequestRow);
    const role = roleFor(request, context.userId);
    if (!role) throw new Error("That isn't yours.");
    if (!canMove(role, request.status, data.status)) {
      throw new Error("That isn't something you can do to this one.");
    }

    const { data: row, error } = await context.supabase
      .from("connection_requests")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw error;
    return rowToRequest(row as unknown as ConnectionRequestRow);
  });

/** Everything you're part of, both directions, newest first. */
export const getMyConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConnectionSummary[]> => {
    const { data: rows, error } = await context.supabase
      .from("connection_requests")
      .select("*")
      .or(`sender_id.eq.${context.userId},recipient_id.eq.${context.userId}`)
      .order("created_at", { ascending: false })
      .limit(MAX_LIST);
    if (error) throw error;

    const requests = (rows ?? []).map((r) => rowToRequest(r as unknown as ConnectionRequestRow));
    if (!requests.length) return [];

    const otherIds = [
      ...new Set(
        requests.map((r) => (r.senderId === context.userId ? r.recipientId : r.senderId)),
      ),
    ];
    const [{ data: profiles }, { data: messages }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", otherIds)
        .eq("discoverable", true),
      context.supabase
        .from("connection_messages")
        .select("request_id, created_at")
        .in(
          "request_id",
          requests.map((r) => r.id),
        ),
    ]);

    const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name as string]));

    return requests.map((r) => {
      const otherId = r.senderId === context.userId ? r.recipientId : r.senderId;
      const mine = (messages ?? []).filter((m) => m.request_id === r.id);
      const last = mine
        .map((m) => m.created_at as string)
        .sort()
        .at(-1);
      return {
        ...r,
        otherName: names.get(otherId) || "Someone",
        lastMessageAt: last ?? null,
        messageCount: mine.length,
      };
    });
  });

/** One conversation and its replies. Only the two people can read it. */
export const getConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      request: ConnectionRequest;
      messages: ConnectionMessage[];
      otherName: string;
      youAre: "sender" | "recipient";
    } | null> => {
      const { data: row, error } = await context.supabase
        .from("connection_requests")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (error) throw error;
      if (!row) return null;

      const request = rowToRequest(row as unknown as ConnectionRequestRow);
      const role = roleFor(request, context.userId);
      if (!role) return null;

      const otherId = role === "sender" ? request.recipientId : request.senderId;
      const [{ data: messages }, { data: profile }] = await Promise.all([
        context.supabase
          .from("connection_messages")
          .select("*")
          .eq("request_id", data.id)
          .order("created_at", { ascending: true })
          .limit(MAX_LIST),
        context.supabase
          .from("profiles")
          .select("display_name")
          .eq("id", otherId)
          .eq("discoverable", true)
          .maybeSingle(),
      ]);

      return {
        request,
        messages: (messages ?? []).map((m) => rowToMessage(m as unknown as ConnectionMessageRow)),
        otherName: (profile?.display_name as string) || "Someone",
        youAre: role,
      };
    },
  );

/** A reply, in their own words. */
export const sendConnectionMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string; body: string }) => input)
  .handler(async ({ data, context }): Promise<ConnectionMessage> => {
    const body = data.body.trim().slice(0, MAX_NOTE);
    if (!body) throw new Error("Nothing to send.");

    const { data: row, error: readError } = await context.supabase
      .from("connection_requests")
      .select("*")
      .eq("id", data.requestId)
      .maybeSingle();
    if (readError) throw readError;
    if (!row) throw new Error("That conversation isn't here any more.");

    const request = rowToRequest(row as unknown as ConnectionRequestRow);
    if (!roleFor(request, context.userId)) throw new Error("That isn't yours.");
    if (!isOpen(request.status)) throw new Error("This conversation is closed.");

    const { data: message, error } = await context.supabase
      .from("connection_messages")
      .insert({ request_id: data.requestId, sender_id: context.userId, body })
      .select("*")
      .single();
    if (error) throw error;
    return rowToMessage(message as unknown as ConnectionMessageRow);
  });
