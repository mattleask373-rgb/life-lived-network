import { privatePage } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { useSession } from "@/hooks/use-session";
import { PersonAvatar } from "@/components/person-avatar";
import { sendConnectionRequest } from "@/lib/connection.functions";

import { findSupplyForNeed } from "@/lib/needs.functions";
import {
  BAND_HEADING,
  BAND_ORDER,
  type SupplyAction,
  type SupplyBand,
  type SupplyResult,
} from "@/lib/supply-engine";

const title = "Who could help — Real World Atlas";
const description =
  "Real possibilities for a real need: people who've said they can help, community projects, freely offered hours, swaps, and travellers passing through — each one plainly labelled.";

export const Route = createFileRoute("/need/$id")({
  head: () => privatePage({ path: "", title, description }),
  errorComponent: () => (
    <Shell>
      <p className="text-sm text-muted-foreground">
        We couldn't load this one just now. Try again in a moment.
      </p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <p className="text-sm text-muted-foreground">That need isn't here any more.</p>
    </Shell>
  ),
  component: NeedAnswer,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6">
        <Link
          to="/need"
          className="focus-ink text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          ← Needs
        </Link>
        {children}
      </div>
    </main>
  );
}

function NeedAnswer() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const find = useServerFn(findSupplyForNeed);
  const { data, isLoading } = useQuery({
    queryKey: ["supply", id],
    queryFn: () => find({ data: { needId: id } }),
  });

  if (isLoading) {
    return (
      <Shell>
        <p className="mt-6 text-sm text-muted-foreground">Looking…</p>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <p className="mt-6 text-sm text-muted-foreground">That need isn't here any more.</p>
      </Shell>
    );
  }

  const { need, results, quiet } = data;
  const isQuiet = quiet || results.length === 0;

  return (
    <Shell>
      <header className="mt-4">
        <h1 className="text-3xl leading-tight">{need.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {need.placeText || "Nearby"} ·{" "}
          {need.startsAt
            ? new Date(need.startsAt).toLocaleString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: need.timezone,
              })
            : "Time still to agree"}
        </p>
        {need.description ? <p className="mt-3 text-sm">{need.description}</p> : null}
      </header>

      {isQuiet ? (
        <section className="card-paper mt-8 p-5">
          <h2 className="text-xl">No suitable possibilities found yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We don't have anyone or anything reliable to point you at for this, in this place, at
            this time. We'd rather say that than make something up. If you post what you can give on
            the hours page, or ask again in a day or two, the picture changes as people join.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/give"
              className="focus-ink inline-flex rounded-full border border-border px-4 py-2 text-sm"
            >
              See what people are giving
            </Link>
            <Link
              to="/help"
              className="focus-ink inline-flex rounded-full border border-border px-4 py-2 text-sm"
            >
              Offer help in your area
            </Link>
          </div>
        </section>
      ) : (
        <div className="mt-8 space-y-10">
          {BAND_ORDER.map((band) => {
            const rows = results.filter((r) => r.band === band);
            if (!rows.length) return null;
            return (
              <Band
                key={band}
                band={band}
                rows={rows}
                needId={id}
                canInvite={Boolean(user && user.id === need.creatorId)}
              />
            );
          })}
        </div>
      )}

      <p className="mt-12 text-center text-sm text-muted-foreground">
        Nothing here is a promise. Everything here is a real person or a real posting surfaced
        through canonical supply.
      </p>

      {import.meta.env.DEV ? (
        <details className="mt-6 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Why these possibilities appeared</summary>
          <p className="mt-2">
            Considered {data.diagnostics.peopleConsidered} people; excluded{" "}
            {data.diagnostics.excludedByPlace} by place, {data.diagnostics.excludedByFreshness} by
            freshness, {data.diagnostics.excludedByQualification} by qualification, and{" "}
            {data.diagnostics.excludedByStatus} by reviewed status.
          </p>
        </details>
      ) : null}
    </Shell>
  );
}

function Invite({ needId, personId }: { needId: string; personId: string }) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const send = useMutation({ mutationFn: useServerFn(sendConnectionRequest) });

  if (send.isSuccess) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        Asked. It's in your{" "}
        <Link to="/conversations" className="focus-ink underline">
          conversations
        </Link>
        . They'll see the thing you asked about, and nothing else.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ink rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:bg-accent"
      >
        Ask if they'd help
      </button>
    );
  }

  return (
    <div className="mt-3">
      <label className="grid gap-1 text-sm">
        Anything you'd like to say
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Optional. What it involves, or when suits."
          className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={send.isPending}
          onClick={() =>
            send.mutate({
              data: { needId, recipientId: personId, direction: "invite", note: note.trim() },
            })
          }
          className="focus-ink rounded-full border border-border bg-card px-4 py-1.5 text-sm disabled:opacity-60"
        >
          Send request
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="focus-ink rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      {send.isError ? (
        <p className="mt-2 text-xs text-muted-foreground">
          That didn't send. Try again in a moment.
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        No contact details are shared. You'll both be able to reply here.
      </p>
    </div>
  );
}

function ActionBadge({ action }: { action: SupplyAction }) {
  const labels: Record<SupplyAction, string> = {
    contact: "Can be contacted",
    view: "View details",
    save: "Can be saved",
    go: "Go in person",
    join: "Join activity",
  };
  return (
    <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-xs text-foreground/80">
      {labels[action] ?? action}
    </span>
  );
}

function Band({
  band,
  rows,
  needId,
  canInvite,
}: {
  band: SupplyBand;
  rows: SupplyResult[];
  needId: string;
  canInvite: boolean;
}) {
  return (
    <section>
      <h2 className="text-2xl leading-tight">{BAND_HEADING[band]}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{rows[0]?.caveat}</p>
      <ul className="mt-4 space-y-4">
        {rows.map((r) => {
          const hasUnknowns = (r.evidence?.unknown.length ?? 0) > 0;
          const permitsContact = r.actions.includes("contact");

          return (
            <li key={r.id} className="card-paper p-5">
              {/* WHO */}
              <div className="flex items-start gap-3">
                {r.personId ? (
                  <span className="shrink-0">
                    <PersonAvatar name={r.title} photoUrl={r.photoUrl} size={48} />
                  </span>
                ) : null}
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {r.personId ? "Person" : r.provenance.origin.replaceAll("_", " ")}
                  </span>
                  <p className="text-lg font-medium leading-snug">{r.title}</p>
                </div>
              </div>

              {/* WHAT */}
              <div className="mt-3">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">What</span>
                <p className="text-sm font-medium">{r.what}</p>
              </div>

              {/* WHERE & WHEN */}
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Where
                  </span>
                  <p className="text-sm text-foreground/90">
                    {r.where || "Location not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    When
                  </span>
                  <p className="text-sm text-foreground/90">
                    {r.when || "Availability not specified"}
                  </p>
                </div>
              </div>

              {/* WHY */}
              {r.why.length ? (
                <div className="mt-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Why
                  </span>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {r.why.map((line) => (
                      <li key={line}>✓ {line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* UNKNOWN */}
              <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">What remains unknown: </span>
                {hasUnknowns
                  ? r.evidence!.unknown.map((u) => `${u} not specified`).join(", ")
                  : "Stated constraints line up; no missing availability or verification detected"}
              </div>

              {/* PROVENANCE & TRUST */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{r.trust.label}</span>
                <span>·</span>
                <span>
                  {r.freshness === "unknown"
                    ? "Freshness not known"
                    : r.freshness.replaceAll("_", " ")}
                </span>
                <span>·</span>
                <span>{r.provenance.label}</span>
              </div>

              {/* ACTIONS */}
              <div className="mt-4 border-t border-border/50 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {r.actions.map((act) => (
                    <ActionBadge key={act} action={act} />
                  ))}
                </div>
                {canInvite && r.personId && permitsContact ? (
                  <Invite needId={needId} personId={r.personId} />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
