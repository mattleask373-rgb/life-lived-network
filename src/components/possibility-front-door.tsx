/**
 * Possibility Front Door — UX entry only.
 * Routes intent to existing product doorways. Never runs the supply engine.
 */
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  classifyPossibilityIntent,
  FRONT_DOOR_ACTIONS,
  type PossibilityIntent,
} from "@/lib/possibility-intent";

export function PossibilityFrontDoor() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<PossibilityIntent | null>(null);
  const navigate = useNavigate();

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    return classifyPossibilityIntent(text);
  }, [text]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const intent = classifyPossibilityIntent(text);
    setSubmitted(intent);
    if (intent.kind !== "DISCOVER" && intent.certainty !== "unclear") {
      void navigate({ to: intent.href });
    }
  }

  return (
    <section aria-labelledby="front-door-heading" className="card-paper mt-6 p-5 sm:p-6">
      <h2 id="front-door-heading" className="text-xl sm:text-2xl">
        What are you looking for?
      </h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        Say it in plain words, or pick a door. We only route you — we don&apos;t invent people,
        places, or qualifications.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="sr-only">What are you looking for?</span>
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSubmitted(null);
            }}
            placeholder="e.g. I need a gardener · I can help with painting · I'm travelling"
            className="focus-ink w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          className="focus-ink shrink-0 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground"
        >
          Continue
        </button>
      </form>

      {preview && text.trim() && preview.kind !== "DISCOVER" ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          We&apos;d take you to <strong className="text-foreground">{preview.label}</strong>
          {preview.certainty === "clear" ? "." : " — does that sound right?"}
        </p>
      ) : null}

      {submitted && submitted.kind === "DISCOVER" ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {submitted.blurb}
        </p>
      ) : null}

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {FRONT_DOOR_ACTIONS.map((action) => (
          <li key={action.kind}>
            <Link
              to={action.href}
              className="focus-ink flex flex-col rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:border-foreground/20"
            >
              <span className="text-sm font-medium">{action.label}</span>
              <span className="mt-0.5 text-xs text-muted-foreground">{action.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
