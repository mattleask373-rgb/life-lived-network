/**
 * Multi-agent fleet lanes and work routing (pure).
 * Coordinates Grok, ChatGPT, Lovable, and human gates without granting LIVE authority.
 */

export type AgentLane =
  | "ORCHESTRATOR"
  | "CONTROL_PLANE"
  | "PRODUCT_DOMAIN"
  | "GEOGRAPHY_WORLD"
  | "TRUST_SAFETY"
  | "PROVIDER_DATA"
  | "UX"
  | "SEO_GROWTH"
  | "QA_EVALUATION"
  | "SECURITY"
  | "REVIEWER"
  | "LOVABLE_SURFACE"
  | "HUMAN";

export type AgentActor = "grok" | "chatgpt" | "lovable" | "human" | "any";

export type WorkClass =
  | "control_plane_fencing"
  | "control_plane_recovery"
  | "control_plane_identity"
  | "durable_sql_rpc"
  | "product_api"
  | "product_ui"
  | "locality_geo"
  | "seo_meta_sitemap"
  | "growth_draft"
  | "ingest_adapter"
  | "security_audit"
  | "adversarial_tests"
  | "lovable_ui_polish"
  | "lovable_cloud_wiring"
  | "docs_status"
  | "human_merge"
  | "human_deploy"
  | "human_credentials"
  | "human_paid_spend";

export type RouteDecision = Readonly<{
  primary: AgentActor;
  lane: AgentLane;
  collaborators: readonly AgentActor[];
  autonomyCeiling: "L0" | "L1" | "L2";
  humanGate: boolean;
  reason: string;
}>;

const ROUTES: Record<WorkClass, RouteDecision> = {
  control_plane_fencing: {
    primary: "grok",
    lane: "CONTROL_PLANE",
    collaborators: ["chatgpt"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "Grok owns pure fencing/recovery; ChatGPT challenges",
  },
  control_plane_recovery: {
    primary: "grok",
    lane: "CONTROL_PLANE",
    collaborators: ["chatgpt"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "Recovery/reclaim/attention pure + durable wire-up",
  },
  control_plane_identity: {
    primary: "grok",
    lane: "CONTROL_PLANE",
    collaborators: ["chatgpt"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "Authenticated run/actor bootstrap policies",
  },
  durable_sql_rpc: {
    primary: "chatgpt",
    lane: "CONTROL_PLANE",
    collaborators: ["grok"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "ChatGPT often owns durable SQL/RPC; Grok security-reviews",
  },
  product_api: {
    primary: "chatgpt",
    lane: "PRODUCT_DOMAIN",
    collaborators: ["grok", "lovable"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "APIs + contracts; Lovable may surface; Grok integrity checks",
  },
  product_ui: {
    primary: "lovable",
    lane: "LOVABLE_SURFACE",
    collaborators: ["chatgpt", "grok"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "Lovable maximises UI iteration speed against real routes/data",
  },
  locality_geo: {
    primary: "chatgpt",
    lane: "GEOGRAPHY_WORLD",
    collaborators: ["lovable", "grok"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "Locality hierarchy + public API; Lovable map/UI",
  },
  seo_meta_sitemap: {
    primary: "chatgpt",
    lane: "SEO_GROWTH",
    collaborators: ["grok"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "Truthful SEO; Grok indexability invariants",
  },
  growth_draft: {
    primary: "chatgpt",
    lane: "SEO_GROWTH",
    collaborators: ["human"],
    autonomyCeiling: "L1",
    humanGate: true,
    reason: "Draft only; human publishes/spends",
  },
  ingest_adapter: {
    primary: "chatgpt",
    lane: "PROVIDER_DATA",
    collaborators: ["grok"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "One ingest boundary; provenance required",
  },
  security_audit: {
    primary: "grok",
    lane: "SECURITY",
    collaborators: ["chatgpt"],
    autonomyCeiling: "L1",
    humanGate: false,
    reason: "Adversarial security; independent challenge",
  },
  adversarial_tests: {
    primary: "chatgpt",
    lane: "QA_EVALUATION",
    collaborators: ["grok"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "ChatGPT challenges; Grok fixes",
  },
  lovable_ui_polish: {
    primary: "lovable",
    lane: "LOVABLE_SURFACE",
    collaborators: ["chatgpt"],
    autonomyCeiling: "L2",
    humanGate: false,
    reason: "Visual/UX polish without inventing data authority",
  },
  lovable_cloud_wiring: {
    primary: "lovable",
    lane: "LOVABLE_SURFACE",
    collaborators: ["human", "grok"],
    autonomyCeiling: "L1",
    humanGate: true,
    reason: "Cloud/env wiring may touch secrets — human gate",
  },
  docs_status: {
    primary: "any",
    lane: "ORCHESTRATOR",
    collaborators: ["grok", "chatgpt"],
    autonomyCeiling: "L1",
    humanGate: false,
    reason: "Honest STATUS updates from any agent",
  },
  human_merge: {
    primary: "human",
    lane: "HUMAN",
    collaborators: [],
    autonomyCeiling: "L0",
    humanGate: true,
    reason: "Merge is always human",
  },
  human_deploy: {
    primary: "human",
    lane: "HUMAN",
    collaborators: [],
    autonomyCeiling: "L0",
    humanGate: true,
    reason: "Production deploy is always human",
  },
  human_credentials: {
    primary: "human",
    lane: "HUMAN",
    collaborators: [],
    autonomyCeiling: "L0",
    humanGate: true,
    reason: "Credentials are always human",
  },
  human_paid_spend: {
    primary: "human",
    lane: "HUMAN",
    collaborators: [],
    autonomyCeiling: "L0",
    humanGate: true,
    reason: "Paid spend is always human",
  },
};

export function routeWork(workClass: WorkClass): RouteDecision {
  return ROUTES[workClass];
}

export function isHumanOnly(workClass: WorkClass): boolean {
  return ROUTES[workClass].humanGate && ROUTES[workClass].primary === "human";
}
