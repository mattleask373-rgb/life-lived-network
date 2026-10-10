import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export type ActivitySignalTone = "happening_now" | "upcoming" | "sparse" | "quiet";

export interface LivingWorldSignalProps {
  children: ReactNode;
  tone?: ActivitySignalTone;
  eyebrow?: string;
  contributionLink?: {
    label: string;
    to: string;
  };
}

export function determineActivityTone(count: number, hasHappeningNow = false): ActivitySignalTone {
  if (count <= 0) return "quiet";
  if (hasHappeningNow) return "happening_now";
  if (count <= 2) return "sparse";
  return "upcoming";
}

const TONE_STYLES: Record<
  ActivitySignalTone,
  { container: string; bar: string; badge: string; defaultEyebrow: string }
> = {
  happening_now: {
    container: "border-primary/30 bg-card shadow-paper",
    bar: "bg-primary motion-safe:animate-pulse",
    badge: "text-primary font-semibold",
    defaultEyebrow: "Happening now",
  },
  upcoming: {
    container: "border-primary/20 bg-card shadow-paper",
    bar: "bg-primary",
    badge: "text-muted-foreground font-semibold",
    defaultEyebrow: "Something's happening here",
  },
  sparse: {
    container: "border-border/80 bg-paper-deep/40 shadow-paper",
    bar: "bg-muted-foreground/50",
    badge: "text-muted-foreground font-medium",
    defaultEyebrow: "A few things recorded",
  },
  quiet: {
    container: "border-border bg-paper-deep/60 shadow-paper",
    bar: "bg-border",
    badge: "text-muted-foreground font-medium",
    defaultEyebrow: "It's quiet here",
  },
};

/**
 * Living World Activity Signal Primitive.
 *
 * A reusable presentation component reflecting real-world activity states
 * with a warm, editorial, festival-programme aesthetic.
 *
 * Invariants:
 * - Pure presentation component: consumes canonical data only.
 * - Unknown remains unknown; zero supply is presented honestly.
 * - Respects reduced-motion preferences.
 * - Never invents people, events, or popularity.
 */
export function LivingWorldSignal({
  children,
  tone = "upcoming",
  eyebrow,
  contributionLink,
}: LivingWorldSignalProps) {
  const styles = TONE_STYLES[tone];
  const displayEyebrow = eyebrow ?? styles.defaultEyebrow;

  return (
    <div
      data-testid="living-world-signal"
      data-tone={tone}
      className={[
        "relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-colors",
        styles.container,
      ].join(" ")}
    >
      <div aria-hidden="true" className={["absolute inset-y-0 left-0 w-1", styles.bar].join(" ")} />
      <div className="pl-2">
        <div className="flex items-center justify-between gap-2">
          <p className={["text-xs uppercase tracking-[0.18em]", styles.badge].join(" ")}>
            {displayEyebrow}
          </p>
          {tone === "happening_now" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-ping"
              />
              Live
            </span>
          ) : null}
        </div>
        <div className="mt-2 font-display text-2xl leading-tight text-foreground sm:text-3xl">
          {children}
        </div>
        {contributionLink ? (
          <div className="mt-4 border-t border-border/40 pt-3">
            <Link
              to={contributionLink.to}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm"
            >
              <span>{contributionLink.label}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
