import { createHmac, timingSafeEqual } from "node:crypto";

export type AgentLane =
  | "PRODUCT"
  | "ARCHITECTURE"
  | "IMPLEMENTATION"
  | "QA"
  | "SECURITY"
  | "REVIEW";

export type AutonomyLevel = "L0" | "L1" | "L2" | "L3" | "L4";
export type RiskLevel = "P0" | "P1" | "P2" | "P3";

export interface PlaneWebhookEnvelope {
  version: "v2";
  delivery_id: string;
  event_id: string;
  entity_id: string;
  entity_type: string;
  event: string;
  webhook_id: string;
  workspace_id: string;
  data: Record<string, unknown>;
  previous_attributes?: Record<string, unknown>;
}

export interface AgentTaskEnvelope {
  task_id: string;
  source: {
    system: "plane";
    workspace_id: string;
    work_item_id: string;
    event_id: string;
  };
  objective: string;
  lane: AgentLane | "ORCHESTRATOR";
  autonomy: AutonomyLevel;
  risk: RiskLevel;
  scope_in: string[];
  scope_out: string[];
  dependencies: string[];
  acceptance_criteria: string[];
  invariants: string[];
  provider: "auto";
}

export interface PlaneTaskData {
  id?: string;
  name?: string;
  description?: string | null;
  priority?: string | null;
  labels?: Array<{ name?: string | null }>;
  state?: { name?: string | null; group?: string | null } | null;
}

const LANE_BY_LABEL: Record<string, AgentLane> = {
  "agent-product": "PRODUCT",
  "agent-architecture": "ARCHITECTURE",
  "agent-implementation": "IMPLEMENTATION",
  "agent-qa": "QA",
  "agent-security": "SECURITY",
  "agent-review": "REVIEW",
};

const RISK_BY_PRIORITY: Record<string, RiskLevel> = {
  urgent: "P0",
  high: "P1",
  medium: "P2",
  low: "P3",
  none: "P3",
};

export function verifyPlaneSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    actual.length === expectedBuffer.length &&
    timingSafeEqual(actual, expectedBuffer)
  );
}

export function isAgentReady(event: PlaneWebhookEnvelope): boolean {
  if (!event.event.startsWith("workitem.")) return false;

  const data = event.data as PlaneTaskData;
  const labels = new Set(
    (data.labels ?? [])
      .map((label) => label.name?.toLowerCase())
      .filter((name): name is string => Boolean(name)),
  );

  return labels.has("agent-ready");
}

export function laneFromTask(data: PlaneTaskData): AgentLane | "ORCHESTRATOR" {
  for (const label of data.labels ?? []) {
    const lane = label.name
      ? LANE_BY_LABEL[label.name.toLowerCase()]
      : undefined;
    if (lane) return lane;
  }

  return "ORCHESTRATOR";
}

export function riskFromTask(data: PlaneTaskData): RiskLevel {
  return RISK_BY_PRIORITY[data.priority?.toLowerCase() ?? "none"] ?? "P3";
}

export function normalizePlaneTask(
  event: PlaneWebhookEnvelope,
  taskId: string,
): AgentTaskEnvelope {
  const data = event.data as PlaneTaskData;
  const objective = data.description?.trim() || data.name?.trim();

  if (!objective) {
    throw new Error("Agent-ready work item must have an objective");
  }

  return {
    task_id: taskId,
    source: {
      system: "plane",
      workspace_id: event.workspace_id,
      work_item_id: event.entity_id,
      event_id: event.event_id,
    },
    objective,
    lane: laneFromTask(data),
    autonomy: "L2",
    risk: riskFromTask(data),
    scope_in: [],
    scope_out: ["main"],
    dependencies: [],
    acceptance_criteria: [],
    invariants: [
      "No autonomous merge to main",
      "No second possibility / matching engine",
      "Unknown must not become confirmed",
    ],
    provider: "auto",
  };
}

export function shouldIgnoreDuplicate(
  eventId: string,
  processedEventIds: ReadonlySet<string>,
): boolean {
  return processedEventIds.has(eventId);
}
