import { useState } from "react";
import { useRouter } from "@tanstack/react-router";

import { checkForLocalityUpdates } from "@/lib/locality-refresh";

/** Refreshes the existing locality route; it does not claim source-level freshness. */
export function LocalityRefresh({ placeId }: { placeId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "checking" | "checked" | "error">("idle");

  async function handleCheck() {
    setState("checking");
    const result = await checkForLocalityUpdates(() => router.invalidate());
    setState(result);
  }

  return (
    <section aria-label={`Updates for place ${placeId}`} className="mt-5 max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleCheck()}
          disabled={state === "checking"}
          aria-busy={state === "checking"}
          className="focus-ink min-h-11 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary disabled:cursor-wait disabled:opacity-60"
        >
          {state === "checking" ? "Checking…" : state === "checked" ? "Check again" : "Check for updates"}
        </button>
        <p className="text-xs text-muted-foreground">
          Reloads the records available for this place. Source update times may vary.
        </p>
      </div>
      {state === "checking" ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          Checking the latest records available for this place…
        </p>
      ) : null}
      {state === "checked" ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          Refresh completed. Individual records or sources may still be older.
        </p>
      ) : null}
      {state === "error" ? (
        <p className="mt-2 text-sm text-muted-foreground" role="alert">
          We couldn’t check for updates. The current results may be out of date. Please try again.
        </p>
      ) : null}
    </section>
  );
}
