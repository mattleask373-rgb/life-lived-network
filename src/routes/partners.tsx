import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  ORG_TYPES,
  PROPOSED_PRICE_CENTS,
  formatCents,
  interestInput,
  interestSummary,
} from "@/lib/partner-pilot";
import { privatePage } from "@/lib/seo";

const title = "Founding Local Partners (proposed pilot) — Real World Atlas";
const description =
  "A proposed, not-yet-launched pilot for local organisations. Tell us if you'd like a 20-minute conversation.";

export const Route = createFileRoute("/partners")({
  head: () => ({
    ...privatePage({ path: "/partners", title, description }),
    meta: [
      ...privatePage({ path: "/partners", title, description }).meta,
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnersPage,
});

const FIELD =
  "focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-11";

function PartnersPage() {
  const price = formatCents(PROPOSED_PRICE_CENTS);
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <p role="note" className="rounded-lg border border-primary/40 bg-card px-4 py-3 text-sm">
        <strong>Proposed pilot — not yet launched.</strong> Nothing here is for sale. {price}/month
        is an idea we're testing, not an active subscription, and no one can be charged.
      </p>

      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Founding Local Partners
        </p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Help shape how people find real local places</h1>
        <p className="mt-3 text-muted-foreground">
          Real World Atlas is a map of what's really happening in a place: real organisations, real
          events, real needs. We're looking for a small group of local organisations to tell us what
          would genuinely help them, before we build or charge for anything.
        </p>
      </header>

      <section className="card-paper p-5" aria-labelledby="offer">
        <h2 id="offer" className="text-xl">
          What a founding partner might get
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>
            A place on the map for your organisation, using the listing features that exist today.
          </li>
          <li>Hands-on help writing and checking one accurate local listing.</li>
          <li>A say in what we build next, through short feedback sessions.</li>
          <li>
            A simple review of how your listing is used, <em>only</em> once we can measure that in a
            privacy-respecting way. We can't today.
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          We don't promise visitors, leads or sales. Paid placement, featured spots and partner
          dashboards don't exist and aren't guaranteed.
        </p>
      </section>

      <section className="card-paper p-5" aria-labelledby="ask">
        <h2 id="ask" className="text-xl">
          What we'd ask of you
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>A 20-minute conversation about how people find you today.</li>
          <li>Honest feedback on a draft listing and on the proposed price.</li>
        </ul>
        <h3 className="mt-4 font-medium">Trial terms still to be confirmed</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Length of the trial, whether it's free to start, how to cancel, and exactly what's
          included. These will be put in writing before anyone commits to anything.
        </p>
      </section>

      <section className="card-paper p-5" aria-labelledby="trust">
        <h2 id="trust" className="text-xl">
          Our promise about private data
        </h2>
        <p className="mt-2 text-sm">
          The private places people record in their own atlas are never sold, never used for
          advertising and never used to target anyone on behalf of partners.
        </p>
      </section>

      <section className="card-paper p-5" aria-labelledby="next">
        <h2 id="next" className="text-xl">
          What happens next
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          <li>You fill in the short form below. It takes about two minutes.</li>
          <li>You keep a copy of your details; this preview doesn't send them anywhere yet.</li>
          <li>When the pilot team is ready, we arrange a 20-minute conversation.</li>
          <li>Any trial terms are written down for you before you decide anything.</li>
        </ol>
      </section>

      <section className="card-paper p-5" aria-labelledby="faq">
        <h2 id="faq" className="text-xl">
          Common questions
        </h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="font-medium">Will I be charged?</dt>
            <dd className="text-muted-foreground">
              No. There is no way to pay today, and the price is only an idea we're testing.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Is expressing interest a commitment?</dt>
            <dd className="text-muted-foreground">
              No. It's non-binding, and you can say no at any point.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Will this bring me customers?</dt>
            <dd className="text-muted-foreground">
              We can't promise that, and we won't. The pilot is about learning what genuinely helps.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Do you use people's private places to target customers?</dt>
            <dd className="text-muted-foreground">Never. Private places stay private.</dd>
          </div>
        </dl>
      </section>

      <InterestForm />
    </main>
  );
}

type Status = { kind: "idle" } | { kind: "done"; summary: string } | { kind: "error" };

function InterestForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState<"" | "yes" | "no">("");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = interestInput.safeParse({
      organisation: f.get("organisation"),
      contactName: f.get("contactName"),
      email: f.get("email"),
      locality: f.get("locality"),
      orgType: f.get("orgType"),
      challenge: f.get("challenge"),
      notes: f.get("notes") ?? "",
      consent: f.get("consent") === "on",
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0]);
        next[k] ??= issue.message;
      }
      setErrors(next);
      setStatus({ kind: "error" });
      return;
    }
    setErrors({});
    setStatus({ kind: "done", summary: interestSummary(parsed.data) });
  };

  if (status.kind === "done") {
    return (
      <section className="card-paper p-5" aria-labelledby="done" role="status">
        <h2 id="done" className="text-xl">
          Thank you. One honest note.
        </h2>
        <p className="mt-2 text-sm">
          This is a preview. <strong>Your details have not been sent or saved anywhere.</strong>{" "}
          Please copy them below and keep them; we'll share a way to send them once the pilot team
          is ready to follow up.
        </p>
        <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-xs">
          {status.summary}
        </pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11"
            onClick={() => {
              navigator.clipboard
                .writeText(status.summary)
                .then(() => setCopied("yes"))
                .catch(() => setCopied("no"));
            }}
          >
            Copy my details
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => setStatus({ kind: "idle" })}
          >
            Edit
          </Button>
        </div>
        <p aria-live="polite" className="mt-2 text-sm text-muted-foreground">
          {copied === "yes"
            ? "Copied."
            : copied === "no"
              ? "Couldn't copy — please select the text."
              : ""}
        </p>
      </section>
    );
  }

  const err = (k: string) =>
    errors[k] ? (
      <span id={`${k}-error`} className="mt-1 block text-sm text-destructive">
        {errors[k]}
      </span>
    ) : null;
  const a11y = (k: string) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
  });

  return (
    <section className="card-paper p-5" aria-labelledby="interest">
      <h2 id="interest" className="text-xl">
        Express interest or ask for a 20-minute chat
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Non-binding. This doesn't sign you up, and nothing is charged. Please don't include
        sensitive personal details.
      </p>
      {status.kind === "error" ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          A few things need fixing before this can go through.
        </p>
      ) : null}
      <form noValidate onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Organisation name
          <input name="organisation" maxLength={120} className={FIELD} {...a11y("organisation")} />
          {err("organisation")}
        </label>
        <label className="block text-sm">
          Your name
          <input
            name="contactName"
            maxLength={80}
            autoComplete="name"
            className={FIELD}
            {...a11y("contactName")}
          />
          {err("contactName")}
        </label>
        <label className="block text-sm">
          Email
          <input
            name="email"
            type="email"
            maxLength={255}
            autoComplete="email"
            className={FIELD}
            {...a11y("email")}
          />
          {err("email")}
        </label>
        <label className="block text-sm">
          Town or neighbourhood
          <input name="locality" maxLength={120} className={FIELD} {...a11y("locality")} />
          {err("locality")}
        </label>
        <label className="block text-sm sm:col-span-2">
          Type of organisation
          <select name="orgType" defaultValue="" className={FIELD} {...a11y("orgType")}>
            <option value="" disabled>
              Choose one
            </option>
            {ORG_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {err("orgType")}
        </label>
        <label className="block text-sm sm:col-span-2">
          How do people find you today, and what's hard about it?
          <textarea
            name="challenge"
            rows={3}
            maxLength={600}
            className={FIELD}
            {...a11y("challenge")}
          />
          {err("challenge")}
        </label>
        <label className="block text-sm sm:col-span-2">
          Anything else? <span className="text-muted-foreground">(optional)</span>
          <textarea name="notes" rows={2} maxLength={1000} className={FIELD} />
        </label>
        <label className="flex items-start gap-3 text-sm sm:col-span-2">
          <input name="consent" type="checkbox" className="mt-1 h-5 w-5" {...a11y("consent")} />
          <span>
            I'm happy for the Real World Atlas team to contact me about this pilot. I can ask to
            stop at any time.
            {err("consent")}
          </span>
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" className="min-h-11">
            Express interest
          </Button>
        </div>
      </form>
    </section>
  );
}
