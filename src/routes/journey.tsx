import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { planJourney, type Journey } from "@/lib/journey-engine";
import { LAYERS, type LayerId, type WorldEntry } from "@/lib/world-data";
import { EntrySheet } from "@/components/entry-sheet";
import { duration, layerText, money } from "@/components/layer-colour";
import { useLifeList } from "@/hooks/use-life-list";
import { useQuery } from "@tanstack/react-query";
import { fetchWorldEntries } from "@/lib/listings";

const title = "What could your journey become? — The Living World";
const description =
  "Say how long you're staying, what you can spend and what you'd like to find. We arrange real opportunities, music, food and community projects into a few possible journeys.";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: JourneyPage,
});

function JourneyPage() {
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(30);
  const [interests, setInterests] = useState<LayerId[]>(["music", "community", "nature"]);
  const [wantsPaidWork, setWantsPaidWork] = useState(true);
  const [social, setSocial] = useState<"quiet" | "friendly" | "lively">("friendly");
  const [journeys, setJourneys] = useState<Journey[] | null>(null);
  const [open, setOpen] = useState<WorldEntry | null>(null);
  const { has, toggle } = useLifeList();
  const { data: world } = useQuery({ queryKey: ["world"], queryFn: () => fetchWorldEntries() });

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">What could your journey become?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing here is invented. Every step below is something a real person in Lisbon has
          actually offered, and anything unchecked is marked as such.
        </p>

        <section className="card-paper mt-6 p-5">
          <Field label="How long">
            {[1, 3, 7, 10].map((d) => (
              <Chip key={d} on={days === d} onClick={() => setDays(d)}>
                {d === 1 ? "A day" : `${d} days`}
              </Chip>
            ))}
          </Field>

          <Field label="What you can spend a day">
            {[0, 15, 30, 60].map((b) => (
              <Chip key={b} on={budget === b} onClick={() => setBudget(b)}>
                {b === 0 ? "Almost nothing" : `€${b}`}
              </Chip>
            ))}
          </Field>

          <Field label="Do you want to earn something?">
            <Chip on={wantsPaidWork} onClick={() => setWantsPaidWork(true)}>
              Yes, find me paid hours
            </Chip>
            <Chip on={!wantsPaidWork} onClick={() => setWantsPaidWork(false)}>
              Not this time
            </Chip>
          </Field>

          <Field label="How social">
            {(["quiet", "friendly", "lively"] as const).map((s) => (
              <Chip key={s} on={social === s} onClick={() => setSocial(s)}>
                {s === "quiet" ? "Mostly on my own" : s === "friendly" ? "A few people" : "Lively"}
              </Chip>
            ))}
          </Field>

          <Field label="What you'd like to find">
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
          </Field>

          <button
            type="button"
            onClick={() =>
              setJourneys(
                planJourney({ days, budget, interests, wantsPaidWork, social }, world ?? []),
              )
            }
            className="focus-ink mt-5 rounded-full bg-accent px-6 py-2.5 text-accent-foreground"
          >
            Show me
          </button>
        </section>

        {journeys?.length ? (
          <div className="mt-8 space-y-8">
            {journeys.map((j) => (
              <article key={j.name} className="card-paper p-5">
                <h2 className="text-2xl">{j.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{j.idea}</p>
                <p className="mt-2 text-sm">
                  You'd spend about €{j.spend}
                  {j.earn > 0 ? ` and earn about €${j.earn}.` : "."}
                </p>

                <ol className="mt-4 space-y-3">
                  {j.steps.map((s) => (
                    <li key={s.entry.id} className="border-l-2 border-border pl-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {s.bandLabel}
                      </p>
                      <button
                        type="button"
                        onClick={() => setOpen(s.entry)}
                        className="focus-ink mt-0.5 text-left"
                      >
                        <span className={`${layerText[s.entry.layer]} text-base`}>
                          {s.entry.title}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {s.entry.place} · {duration(s.entry.minutes)} ·{" "}
                          {money(s.entry.cost)}
                        </span>
                      </button>
                      <p className="mt-1 text-sm text-foreground/75 italic">{s.why}</p>
                    </li>
                  ))}
                </ol>

                {j.uncertain.length ? (
                  <p className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                    Not yet checked, so treat it as a maybe: {j.uncertain.join("; ")}.
                  </p>
                ) : null}
              </article>
            ))}
            <p className="text-center text-sm text-muted-foreground">
              Then leave it better than you found it.
            </p>
          </div>
        ) : journeys ? (
          <p className="mt-8 rounded-lg border border-border bg-muted p-4 text-sm">
            It's quiet for that shape of trip. Rather than invent something, we'd say: widen the
            days, or go and make something happen.
          </p>
        ) : null}
      </div>

      {open ? (
        <EntrySheet
          world={world ?? []}
          entry={open}
          saved={has(open.id)}
          onSave={toggle}
          onClose={() => setOpen(null)}
          onOpenEntry={setOpen}
        />
      ) : null}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
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
