/**
 * Provider-Neutral Conversion Telemetry Contract.
 *
 * Grounded in the Living World conversion loop:
 * SEARCH -> LOCALITY -> INTENT -> CANONICAL DISCOVERY -> USER ACTION -> REAL LIFE
 *
 * Privacy Invariants:
 * - Never stores or logs raw PII (emails, phone numbers, exact coordinates).
 * - Queries are normalized/sanitized strings.
 * - No third-party ad tracking, fingerprinting, or cross-site identity graphs.
 */

export type TelemetryEventType =
  | "search_submitted"
  | "locality_resolved"
  | "intent_resolved"
  | "result_viewed"
  | "quiet_result"
  | "action_selected"
  | "connection_started"
  | "connection_completed"
  | "contribution_created"
  | "return_discovery";

export interface BaseTelemetryEvent {
  type: TelemetryEventType;
  timestamp: string; // ISO 8601 UTC
  sessionId?: string;
}

export interface SearchSubmittedEvent extends BaseTelemetryEvent {
  type: "search_submitted";
  normalizedQuery: string;
  source: "front_door" | "header" | "direct_url";
}

export interface LocalityResolvedEvent extends BaseTelemetryEvent {
  type: "locality_resolved";
  localityId: string;
  localitySlug: string;
  kind: string;
  confidence: number;
}

export interface IntentResolvedEvent extends BaseTelemetryEvent {
  type: "intent_resolved";
  intentFamily: string;
  subject?: string | null;
  timeframe?: string | null;
  certainty: "clear" | "likely" | "unclear";
}

export interface ResultViewedEvent extends BaseTelemetryEvent {
  type: "result_viewed";
  localityId?: string;
  intentFamily?: string;
  resultCount: number;
  bandsPresent: string[];
}

export interface QuietResultEvent extends BaseTelemetryEvent {
  type: "quiet_result";
  localityId?: string;
  intentFamily?: string;
  reason: string;
}

export interface ActionSelectedEvent extends BaseTelemetryEvent {
  type: "action_selected";
  action: "contact" | "view" | "save" | "go" | "join" | "external_link";
  targetType: "person" | "world_entry" | "need" | "event" | "journey";
  targetId: string;
}

export interface ConnectionStartedEvent extends BaseTelemetryEvent {
  type: "connection_started";
  needId: string;
  recipientPersonId: string;
}

export interface ConnectionCompletedEvent extends BaseTelemetryEvent {
  type: "connection_completed";
  connectionId: string;
  status: "accepted" | "declined" | "withdrawn";
}

export interface ContributionCreatedEvent extends BaseTelemetryEvent {
  type: "contribution_created";
  localityId: string;
  kind: string;
}

export interface ReturnDiscoveryEvent extends BaseTelemetryEvent {
  type: "return_discovery";
  localityId: string;
}

export type TelemetryEvent =
  | SearchSubmittedEvent
  | LocalityResolvedEvent
  | IntentResolvedEvent
  | ResultViewedEvent
  | QuietResultEvent
  | ActionSelectedEvent
  | ConnectionStartedEvent
  | ConnectionCompletedEvent
  | ContributionCreatedEvent
  | ReturnDiscoveryEvent;

// Basic privacy guard: Reject any telemetry payloads containing suspicious PII patterns
const SENSITIVE_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, // Phone
  /bearer\s+[a-zA-Z0-9_\-.]+/i, // Auth token
  /password|secret|apikey|credential/i, // Secret keys
];

export function sanitizeTelemetryPayload<T extends Record<string, unknown>>(data: T): T {
  const json = JSON.stringify(data);
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(json)) {
      throw new Error("Telemetry event rejected: payload contains forbidden sensitive pattern.");
    }
  }
  return data;
}

export type TelemetryListener = (event: TelemetryEvent) => void;

class TelemetryBus {
  private listeners: Set<TelemetryListener> = new Set();
  private buffer: TelemetryEvent[] = [];
  private maxBuffer = 100;

  subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  record(event: TelemetryEvent): void {
    try {
      sanitizeTelemetryPayload(event as unknown as Record<string, unknown>);
      this.buffer.push(event);
      if (this.buffer.length > this.maxBuffer) {
        this.buffer.shift();
      }
      for (const listener of this.listeners) {
        try {
          listener(event);
        } catch (err) {
          console.warn("[Telemetry] listener error", err);
        }
      }
    } catch (err) {
      console.warn("[Telemetry] Dropped unsafe event", err);
    }
  }

  getRecentEvents(): ReadonlyArray<TelemetryEvent> {
    return this.buffer;
  }

  clear(): void {
    this.buffer = [];
  }
}

export const telemetry = new TelemetryBus();
