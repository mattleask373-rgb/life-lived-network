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
import { intentTarget, planFrontDoor, type FrontDoorPlan } from "@/lib/search-context";
import { placePath } from "@/lib/places";
import { useWorldContext } from "@/lib/world-context";

export function PossibilityFrontDoor() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<PossibilityIntent | null>(null);
  const navigate = useNavigate();
  const { index } = useWorldContext();
  const [choose, setChoose] = useState<Extract<FrontDoorPlan, { kind: "ambiguous" }> | null>(null);

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    return classifyPossibilityIntent(text);
  }, [text]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const plan = planFrontDoor(index, text);
    if (plan.kind === "locality") {
      void navigate({
        to: "/$country/$place",
        params: plan.target.params,
        search: plan.target.search,
      });
      return;
    }
    if (plan.kind === "ambiguous") {
      setChoose(plan);
      return;
    }
    const intent = classifyPossibilityIntent(text);
    setSubmitted(intent);
    if (intent.kind !== "DISCOVER" && intent.certainty !== "unclear") {
      const target = intentTarget(intent.href, text);
      void navigate(target.search ? { to: target.to, search: target.search } : { to: target.to });
    }
  }

  return (
    <section aria-labelledby="front-door-heading" className="card-paper p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Start here
      </p>
      <h2 id="front-door-heading" className="mt-1 font-display text-2xl leading-tight sm:text-3xl">
        What are you <span className="italic text-primary">looking for?</span>
      </h2>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
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
              setChoose(null);
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

      {choose ? (
        <div className="mt-3 text-sm" role="status">
          <p className="text-muted-foreground">
            More than one place has that name. Which did you mean?
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {choose.choices.map(({ place, target }) => (
              <li key={place.id}>
                <Link
                  className="focus-ink inline-flex min-h-11 items-center rounded-full border border-border px-4"
                  params={target.params}
                  search={target.search}
                  to="/$country/$place"
                >
                  {index ? placePath(index, place.id) : place.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
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
