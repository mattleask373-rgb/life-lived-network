import { useState } from "react";
import { whatIsPossible } from "@/lib/journey-engine";
import { LAYERS, type LayerId, type WorldEntry } from "@/lib/world-data";
import { EntryCard } from "./entry-card";

const HOURS = [1, 2, 3, 5];
const SPENDS = [0, 10, 30, 60];

export function ThreeHours({ onOpen }: { onOpen: (entry: WorldEntry) => void }) {
  const [minutes, setMinutes] = useState(180);
  const [spend, setSpend] = useState(30);
  const [outdoors, setOutdoors] = useState(false);
  const [social, setSocial] = useState<"quiet" | "friendly" | "lively">("friendly");
  const [interests, setInterests] = useState<LayerId[]>([]);
  const [results, setResults] = useState<WorldEntry[] | null>(null);

  const go = () =>
    setResults(whatIsPossible({ minutes, spend, outdoors, social, interests }));

  return (
    <section aria-labelledby="three-hours-heading" className="paper-grain card-paper p-5">
      <h2 id="three-hours-heading" className="text-xl">
        I have a few hours
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us roughly, and we'll show you three things. Not a hundred.
      </p>

      <Row label="Time">
        {HOURS.map((h) => (
          <Chip key={h} on={minutes === h * 60} onClick={() => setMinutes(h * 60)}>
            {h} hr
          </Chip>
        ))}
      </Row>

      <Row label="Spend">
        {SPENDS.map((s) => (
          <Chip key={s} on={spend === s} onClick={() => setSpend(s)}>
            {s === 0 ? "Nothing" : `Up to €${s}`}
          </Chip>
        ))}
      </Row>

      <Row label="Company">
        {(["quiet", "friendly", "lively"] as const).map((s) => (
          <Chip key={s} on={social === s} onClick={() => setSocial(s)}>
            {s === "quiet" ? "On my own" : s === "friendly" ? "A few people" : "Somewhere lively"}
          </Chip>
        ))}
      </Row>

      <Row label="Outside">
        <Chip on={outdoors} onClick={() => setOutdoors(true)}>
          Yes, outdoors
        </Chip>
        <Chip on={!outdoors} onClick={() => setOutdoors(false)}>
          Don't mind
        </Chip>
      </Row>

      <Row label="Feel like">
        {LAYERS.map((l) => (
          <Chip
            key={l.id}
            on={interests.includes(l.id)}
            onClick={() =>
              setInterests((prev) =>
                prev.includes(l.id) ? prev.filter((x) => x !== l.id) : [...prev, l.id],
              )
            }
          >
            {l.label}
          </Chip>
        ))}
      </Row>

      <button
        type="button"
        onClick={go}
        className="focus-ink mt-5 rounded-full bg-accent px-6 py-2.5 text-accent-foreground"
      >
        Go
      </button>

      {results ? (
        results.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {results.map((r) => (
              <EntryCard key={r.id} entry={r} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-border bg-muted p-4 text-sm">
            <p className="font-medium">It's quiet in that shape today.</p>
            <p className="mt-1 text-muted-foreground">
              Nothing here matches, and we won't invent something. Loosen the time or the
              spend — or make something happen yourself.
            </p>
          </div>
        )
      ) : null}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`focus-ink rounded-full border px-3 py-1.5 text-sm transition-colors ${
        on
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
