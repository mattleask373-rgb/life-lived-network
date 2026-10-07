import type { ReactNode } from "react";

type LivingWorldSignalProps = {
  children: ReactNode;
  eyebrow?: string;
  quiet?: boolean;
};

export function LivingWorldSignal({
  children,
  eyebrow = "Something's happening here",
  quiet = false,
}: LivingWorldSignalProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border p-5 shadow-paper sm:p-6",
        quiet ? "border-border bg-paper-deep/60" : "border-primary/20 bg-card",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className={["absolute inset-y-0 left-0 w-1", quiet ? "bg-border" : "bg-primary"].join(
          " ",
        )}
      />
      <div className="pl-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <div className="mt-2 font-display text-2xl leading-tight text-foreground sm:text-3xl">
          {children}
        </div>
      </div>
    </div>
  );
}
