import { AlertCircle, CheckCircle2, CircleDashed, FlaskConical, Users } from "lucide-react";
import { TRUST_LABEL, trustState } from "@/lib/trust";
import type { WorldEntry } from "@/lib/world-data";

const ICON = {
  demonstration: FlaskConical,
  stale: AlertCircle,
  checked: CheckCircle2,
  confirmed: Users,
  unchecked: CircleDashed,
} as const;

/** Trust shown as icon + words, never colour alone. */
export function TrustChip({ entry }: { entry: WorldEntry }) {
  const state = trustState(entry);
  const Icon = ICON[state];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[0.7rem] text-muted-foreground">
      <Icon aria-hidden size={12} strokeWidth={1.8} />
      {TRUST_LABEL[state]}
    </span>
  );
}
