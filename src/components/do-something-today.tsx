import { useState } from "react";
import { INTENTS, doSomethingToday, whyNot, type Intent } from "@/lib/intents";
import type { WorldEntry } from "@/lib/world-data";
import { EntryCard } from "./entry-card";

export function DoSomethingToday({
  world,
  savedIds,
  onOpen,
}: {
  world: WorldEntry[];
  savedIds: string[];
  onOpen: (entry: WorldEntry) => void;
}) {
  const [intent, setIntent] = useState<Intent | null>(null);
  const [nudge, setNudge] = useState(0);
  const [surprise, setSurprise] = useState<WorldEntry | null>(null);

  const results = intent ? doSomethingToday(world, intent) : [];

  const choose = (i: Intent) => {
    setSurprise(null);
    if (i.id === "surprise") {
      setIntent(null);
      ask();
      return;
    }
    setIntent(i);
  };

  const ask = () => {
    const next = whyNot(world, savedIds, nudge);
    setNudge((n) => n + 1);
    setSurprise(next ?? null);
    setIntent(null);
  };

  return (
    <section aria-labelledby="today-heading" className="card-paper p-5">
      <h2 id="today-heading" className="text-xl">
        Do something today
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        What would you like today to contain? We'll only show things that really exist.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {INTENTS.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => choose(i)}
            aria-pressed={intent?.id === i.id}
            className={`focus-ink rounded-full border px-3 py-1.5 text-sm transition-colors ${
              intent?.id === i.id
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {i.label}
          </button>
        ))}
      </div>

      {intent ? (
        <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
          {intent.blurb}
        </p>
      ) : null}

      {intent ? (
        results.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {results.map((e) => (
              <EntryCard key={e.id} entry={e} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-border bg-muted p-4 text-sm">
            <p className="font-medium">There's nothing here I'd pretend is right for you.</p>
            <p className="mt-1 text-muted-foreground">
              Nobody has put anything like that on the map today. Try another shape — or make
              something happen yourself.
            </p>
          </div>
        )
      ) : null}

      {surprise ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Why not?</p>
          <div className="mt-2 sm:max-w-sm">
            <EntryCard entry={surprise} onOpen={onOpen} />
          </div>
          <button
            type="button"
            onClick={ask}
            className="focus-ink mt-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Something else
          </button>
        </div>
      ) : null}
    </section>
  );
}
