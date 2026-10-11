import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CONTACT_STATUSES,
  TARGETS,
  readTracker,
  scorecard,
  writeTracker,
  type TrackerRow,
} from "@/lib/partner-pilot";
import { privatePage } from "@/lib/seo";

const title = "Partner pilot tracker (internal) — Real World Atlas";
const description = "Internal validation scorecard for the proposed partner pilot. Device-only.";

export const Route = createFileRoute("/partner-tracker")({
  head: () => ({
    meta: [
      ...privatePage({ path: "/partner-tracker", title, description }).meta,
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackerPage,
});

const FIELD =
  "focus-ink w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-11";

function TrackerPage() {
  const [rows, setRows] = useState<TrackerRow[] | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [org, setOrg] = useState("");
  const [loc, setLoc] = useState("");

  useEffect(() => setRows(readTracker()), []);

  const update = (next: TrackerRow[]) => {
    setRows(next);
    setSaveFailed(!writeTracker(next));
  };
  const patch = (id: string, p: Partial<TrackerRow>) =>
    rows && update(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const score = scorecard(rows ?? []);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Internal</p>
        <h1 className="mt-1 text-3xl">Partner pilot tracker</h1>
        <p role="note" className="mt-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
          Stored only in this browser on this device. Not saved to the backend, not shared, not
          backed up; clearing browser data deletes it. Don't put sensitive personal details here.
        </p>
      </header>

      <section className="card-paper p-5" aria-labelledby="score">
        <h2 id="score" className="text-xl">
          Scorecard
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Targets are our own working guesses for this pilot, not industry benchmarks.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.keys(TARGETS) as (keyof typeof TARGETS)[]).map((k) => {
            const t = TARGETS[k];
            const goal = "max" in t ? `${t.min}–${t.max}` : `${t.min}`;
            return (
              <div key={k} className="rounded-lg border border-border bg-background p-3">
                <dt className="text-sm text-muted-foreground">{t.label}</dt>
                <dd className="text-2xl">
                  {score[k]} <span className="text-sm text-muted-foreground">/ target {goal}</span>
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          A price commitment means someone said yes to the proposed price subject to written terms.
          It is not a payment or a contract.
        </p>
      </section>

      <section className="card-paper p-5" aria-labelledby="add">
        <h2 id="add" className="text-xl">
          Add an organisation
        </h2>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!rows || !org.trim()) return;
            update([
              ...rows,
              {
                id: crypto.randomUUID(),
                organisation: org.trim().slice(0, 120),
                locality: loc.trim().slice(0, 120),
                status: "not contacted",
                interviewed: false,
                strongInterest: false,
                priceCommitment: false,
                notes: "",
              },
            ]);
            setOrg("");
            setLoc("");
          }}
        >
          <label className="text-sm">
            Organisation
            <input
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className={FIELD}
              required
            />
          </label>
          <label className="text-sm">
            Locality
            <input value={loc} onChange={(e) => setLoc(e.target.value)} className={FIELD} />
          </label>
          <Button type="submit" className="min-h-11 self-end">
            Add
          </Button>
        </form>
      </section>

      {saveFailed ? (
        <p role="alert" className="text-sm text-destructive">
          This browser wouldn't save the change. It will be lost when you leave the page.
        </p>
      ) : null}

      {rows === null ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading…
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No organisations yet. Add the first one above when you start reaching out.
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Organisations">
          {rows.map((r) => (
            <li key={r.id} className="card-paper space-y-3 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium">
                  {r.organisation}
                  {r.locality ? (
                    <span className="ml-2 text-sm text-muted-foreground">{r.locality}</span>
                  ) : null}
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => {
                    if (window.confirm(`Remove ${r.organisation} from this tracker?`))
                      update(rows.filter((x) => x.id !== r.id));
                  }}
                >
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="text-sm">
                  Contact status
                  <select
                    value={r.status}
                    onChange={(e) =>
                      patch(r.id, { status: e.target.value as TrackerRow["status"] })
                    }
                    className={FIELD}
                  >
                    {CONTACT_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                {(
                  [
                    ["interviewed", "Interview done"],
                    ["strongInterest", "Strong interest"],
                    ["priceCommitment", "Yes to price (terms pending)"],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={r[k]}
                      onChange={(e) => patch(r.id, { [k]: e.target.checked })}
                      className="h-5 w-5"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <label className="block text-sm">
                Follow-up notes
                <textarea
                  value={r.notes}
                  maxLength={2000}
                  rows={2}
                  onChange={(e) => patch(r.id, { notes: e.target.value })}
                  className={FIELD}
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
