/**
 * Connection: the smallest honest step between a match and real life.
 *
 * Someone says "I could help with this", or "would you help with this?", and
 * the thing they're talking about travels with the message. Nobody has to
 * re-explain themselves, and nobody's contact details are handed over by us.
 *
 * This module is pure. It owns what a request is, what states it can move
 * between, and the snapshot of context taken at the moment of sending.
 */

import type { Need } from "./needs";

/** Who started it. An offer comes from the helper; an invitation from the asker. */
export type ConnectionDirection = "offer" | "invite";

export type ConnectionStatus = "sent" | "accepted" | "declined" | "withdrawn";

export const STATUS_LABEL: Record<ConnectionStatus, string> = {
  sent: "Sent, no answer yet",
  accepted: "Agreed",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

/**
 * The context, frozen. If the need is edited later, the record still says
 * what was actually agreed to at the time.
 */
export interface ConnectionContext {
  title: string;
  place: string;
  when: string;
}

export interface ConnectionRequest {
  id: string;
  needId: string;
  senderId: string;
  recipientId: string;
  direction: ConnectionDirection;
  note: string;
  status: ConnectionStatus;
  context: ConnectionContext;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionMessage {
  id: string;
  requestId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ConnectionRequestRow {
  id: string;
  need_id: string;
  sender_id: string;
  recipient_id: string;
  direction: string;
  note: string;
  status: string;
  context_title: string;
  context_place: string;
  context_when: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectionMessageRow {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export function rowToRequest(row: ConnectionRequestRow): ConnectionRequest {
  return {
    id: row.id,
    needId: row.need_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    direction: row.direction as ConnectionDirection,
    note: row.note ?? "",
    status: row.status as ConnectionStatus,
    context: {
      title: row.context_title ?? "",
      place: row.context_place ?? "",
      when: row.context_when ?? "",
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToMessage(row: ConnectionMessageRow): ConnectionMessage {
  return {
    id: row.id,
    requestId: row.request_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

/** What the need was, in plain words, at the moment of sending. */
export function contextFromNeed(need: Need): ConnectionContext {
  return {
    title: need.title,
    place: need.placeText || "Nearby",
    when: need.startsAt
      ? new Date(need.startsAt).toUTCString().slice(0, 16) + ` (${need.timezone})`
      : "Time still to agree",
  };
}

/**
 * Only these moves are allowed, and only by the named side. The recipient
 * answers; the sender can take it back. Nothing reopens once it's settled.
 */
export type ConnectionRole = "sender" | "recipient";

export function canMove(
  role: ConnectionRole,
  from: ConnectionStatus,
  to: ConnectionStatus,
): boolean {
  if (from !== "sent") return false;
  if (role === "recipient") return to === "accepted" || to === "declined";
  return to === "withdrawn";
}

export function roleFor(request: ConnectionRequest, userId: string): ConnectionRole | null {
  if (request.senderId === userId) return "sender";
  if (request.recipientId === userId) return "recipient";
  return null;
}

/** Whether the two people can still write to each other. */
export function isOpen(status: ConnectionStatus): boolean {
  return status === "sent" || status === "accepted";
}

/** A short, honest heading for the two sides of someone's conversations. */
export const GROUP_HEADING = {
  asked: "About things you needed",
  offered: "About things you offered",
} as const;
