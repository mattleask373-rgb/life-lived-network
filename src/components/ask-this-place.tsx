import { useId } from "react";

import { askPlaceState } from "@/lib/ask-place";

/** Honest, read-only entry point. It cannot be used yet and says so. */
export function AskThisPlace({ placeName }: { placeName: string }) {
  const state = askPlaceState();
  const inputId = useId();
  const noteId = useId();

  return (
    <section aria-labelledby={`${inputId}-h`} className="card-paper mt-6 max-w-2xl p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${inputId}-h`} className="font-display text-lg">
          Ask about {placeName}
        </h2>
        <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
          Coming soon
        </span>
      </div>
      <label htmlFor={inputId} className="sr-only">
        Question about {placeName}
      </label>
      <input
        id={inputId}
        type="text"
        disabled
        aria-describedby={noteId}
        placeholder="Not available yet"
        className="mt-3 min-h-11 w-full cursor-not-allowed rounded-full border border-border bg-muted px-4 text-base text-muted-foreground"
      />
      <p id={noteId} role="status" className="mt-2 text-sm text-muted-foreground">
        {state.reason} Answers will only use the records shown on this page.
      </p>
    </section>
  );
}
