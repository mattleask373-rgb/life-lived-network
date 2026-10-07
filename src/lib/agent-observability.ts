/**
 * Lightweight pure helpers so the control plane can answer operational questions.
 * No I/O — Lovable / ops UI can call these over fetched task rows.
 */

import type { LeaseStatus } from "./agent-lease-policy";
import { evaluateStale, type LeaseSnapshot } from "./agent-lease-policy";

export interface TaskObservationRow {
  taskId: string;
  status: LeaseStatus;
  owner: string | null;
  risk?: string;
  lane?: string;
  provider?: string;
  leaseExpiry: Date | null;
  lastHeartbeat: Date | null;
  updatedAt?: Date | null;
  createdAt?: Date | null;
}

export interface ControlPlaneSnapshot {
  total: number;
  byStatus: Record<string, number>;
  claimed: number;
  ready: number;
  stale: number;
  blocked: number;
  inReview: number;
  acceptedAwaitingHuman: number;
  activeWithValidLease: number;
  activeLeaseExpired: number;
  owners: Record<string, number>;
}

export function summariseTasks(
  rows: TaskObservationRow[],
  now: Date = new Date(),
): ControlPlaneSnapshot {
  const byStatus: Record<string, number> = {};
  const owners: Record<string, number> = {};
  let claimed = 0;
  let ready = 0;
  let stale = 0;
  let blocked = 0;
  let inReview = 0;
  let acceptedAwaitingHuman = 0;
  let activeWithValidLease = 0;
  let activeLeaseExpired = 0;

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    if (row.owner) {
      owners[row.owner] = (owners[row.owner] ?? 0) + 1;
    }

    switch (row.status) {
      case "READY":
        ready += 1;
        break;
      case "CLAIMED":
      case "IN_PROGRESS":
      case "VERIFYING":
        claimed += 1;
        {
          const snap: LeaseSnapshot = {
            taskId: row.taskId,
            status: row.status,
            owner: row.owner,
            leaseExpiry: row.leaseExpiry,
            lastHeartbeat: row.lastHeartbeat,
          };
          if (row.leaseExpiry && row.leaseExpiry.getTime() > now.getTime()) {
            activeWithValidLease += 1;
          } else if (evaluateStale(snap, now).isStale) {
            activeLeaseExpired += 1;
          } else {
            activeLeaseExpired += 1;
          }
        }
        break;
      case "STALE":
        stale += 1;
        break;
      case "BLOCKED":
        blocked += 1;
        break;
      case "REVIEW":
      case "CHANGES_REQUESTED":
        inReview += 1;
        break;
      case "ACCEPTED":
        acceptedAwaitingHuman += 1;
        break;
      default:
        break;
    }
  }

  return {
    total: rows.length,
    byStatus,
    claimed,
    ready,
    stale,
    blocked,
    inReview,
    acceptedAwaitingHuman,
    activeWithValidLease,
    activeLeaseExpired,
    owners,
  };
}
