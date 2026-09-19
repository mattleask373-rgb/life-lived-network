import { privatePage } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { useSession } from "@/hooks/use-session";
import { createNeed, getMyNeeds, getOpenNeeds } from "@/lib/needs.functions";
import { FLEXIBILITIES, NEED_INTENTS, URGENCIES, type Need } from "@/lib/needs";
import { fetchDefaultPlace } from "@/lib/places";

const title = "What do you need? — The Living World";
const description =
  "Say what you actually need — a gardener on Thursday, a hand with a community garden, someone to swap skills with — and see who nearby could genuinely help.";

export const Route = createFileRoute("/need")({
  head: () => privatePage({ path: "", title, description }),
  component: NeedPage,
});

function NeedPage() {
  const { user, ready } = useSession();
  const qc = useQueryClient();
  const openNeeds = useServerFn(getOpenNeeds);
  const myNeeds = useServerFn(getMyNeeds);

  const { data: place } = useQuery({ queryKey: ["place", "default"], queryFn: fetchDefaultPlace });
  const { data: needs } = useQuery({
    queryKey: ["needs", "open"],
    queryFn: () => openNeeds({ data: {} }),
  });
  const { data: mine } = useQuery({
    queryKey: ["needs", "mine", user?.id],
    queryFn: () => myNeeds(),
    enabled: Boolean(user),
  });

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Say what you need
          </p>
          <h1 className="mt-1 text-4xl leading-none">What do you need?</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            A gardener on Thursday. A hand clearing a community plot. Someone to swap an hour with.
            Say it plainly and we'll show you what's actually there — and say so when there's
            nothing.
          </p>
        </header>

        {ready && user ? (
          <NeedForm
            placeId={place?.place.id ?? null}
            placeName={place?.place.name ?? ""}
            timezone={place?.place.timezone ?? "UTC"}
            currency={place?.place.currency ?? "EUR"}
            lat={place?.place.lat ?? null}
            lng={place?.place.lng ?? null}
            onDone={() => qc.invalidateQueries({ queryKey: ["needs"] })}
          />
        ) : (
          <section className="card-paper mt-6 p-5">
            <h2 className="text-xl">Posting a need takes an account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only so whoever helps knows who they're helping. Looking around never does.
            </p>
            <Link
              to="/auth"
              className="focus-ink mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              Sign in or join
            </Link>
          </section>
        )}

        {mine?.length ? <NeedList heading="Yours" needs={mine} /> : null}
        <NeedList
          heading="What people nearby need"
          needs={needs ?? []}
          empty="Nobody has asked for anything yet. Yours could be the first."
        />
      </div>
    </main>
  );
}

function NeedList({ heading, needs, empty }: { heading: string; needs: Need[]; empty?: string }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl">{heading}</h2>
      {needs.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {needs.map((need) => (
            <li key={need.id} className="card-paper p-4">
              <Link to="/need/$id" params={{ id: need.id }} className="focus-ink block">
                <p className="text-lg leading-tight">{need.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {need.placeText || "Nearby"} ·{" "}
                  {need.startsAt
                    ? new Date(need.startsAt).toLocaleString(undefined, {
                        weekday: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: need.timezone,
                      })
                    : "Time still to agree"}
                  {need.paymentType === "paid" && need.budget
                    ? ` · up to ${need.budget} ${need.currency}`
                    : need.paymentType === "contribution"
                      ? " · given time"
                      : need.paymentType === "exchange"
                        ? " · a swap"
                        : ""}
                </p>
                {need.description ? <p className="mt-2 text-sm">{need.description}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">See who could help →</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NeedForm({
  placeId,
  placeName,
  timezone,
  currency,
  lat,
  lng,
  onDone,
}: {
  placeId: string | null;
  placeName: string;
  timezone: string;
  currency: string;
  lat: number | null;
  lng: number | null;
  onDone: () => void;
}) {
  const submit = useServerFn(createNeed);
  const [category, setCategory] = useState("");
  const [needTitle, setNeedTitle] = useState("");
  const [description, setDescription] = useState("");
  const [intent, setIntent] = useState("paid_work");
  const [when, setWhen] = useState("");
  const [minutes, setMinutes] = useState(120);
  const [budget, setBudget] = useState("");
  const [flexibility, setFlexibility] = useState("some");
  const [urgency, setUrgency] = useState("soon");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentType =
    intent === "skills_exchange"
      ? "exchange"
      : intent === "volunteering" || intent === "community_project" || intent === "help"
        ? "contribution"
        : "paid";

  async function save() {
    setError(null);
    if (!category.trim() || !needTitle.trim()) {
      setError("A word for what it is, and a line about what you need.");
      return;
    }
    setBusy(true);
    try {
      const startsAt = when ? new Date(when).toISOString() : null;
      await submit({
        data: {
          category: category.trim().toLowerCase(),
          title: needTitle.trim(),
          description: description.trim(),
          intent,
          place_id: placeId,
          place_text: placeName,
          lat,
          lng,
          timezone,
          starts_at: startsAt,
          ends_at:
            startsAt && minutes
              ? new Date(new Date(startsAt).getTime() + minutes * 60000).toISOString()
              : null,
          duration_minutes: minutes,
          flexibility,
          budget: budget ? Number(budget) : null,
          currency,
          payment_type: paymentType,
          required_skills: category.trim() ? [category.trim().toLowerCase()] : [],
          required_qualifications: [],
          recurring: intent === "recurring_work",
          urgency,
          visibility: "local_discovery",
        },
      });
      setCategory("");
      setNeedTitle("");
      setDescription("");
      setBudget("");
      setWhen("");
      onDone();
    } catch {
      setError("We couldn't save that right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-paper mt-6 p-5">
      <h2 className="text-xl">Say what you need</h2>
      <div className="mt-4 grid gap-4">
        <label className="grid gap-1 text-sm">
          What kind of thing is it?
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="gardening, cleaning, translation, carrying things"
            className="focus-ink rounded-md border border-border bg-background px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          In one line
          <input
            value={needTitle}
            onChange={(e) => setNeedTitle(e.target.value)}
            placeholder="Gardener for an overgrown back garden"
            className="focus-ink rounded-md border border-border bg-background px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Anything else worth knowing
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="focus-ink rounded-md border border-border bg-background px-3 py-2"
          />
        </label>

        <fieldset className="grid gap-2 text-sm">
          <legend>What are you asking for?</legend>
          <div className="flex flex-wrap gap-2">
            {NEED_INTENTS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setIntent(option.id)}
                className={`focus-ink rounded-full border px-3 py-1.5 text-xs ${
                  intent === option.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            When, if you know
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="focus-ink rounded-md border border-border bg-background px-3 py-2"
            />
            <span className="text-xs text-muted-foreground">Times are read in {timezone}.</span>
          </label>

          <label className="grid gap-1 text-sm">
            Roughly how long
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="focus-ink rounded-md border border-border bg-background px-3 py-2"
            >
              <option value={60}>An hour</option>
              <option value={120}>Two hours</option>
              <option value={240}>Half a day</option>
              <option value={480}>A day</option>
            </select>
          </label>
        </div>

        {paymentType === "paid" ? (
          <label className="grid gap-1 text-sm">
            What you could pay ({currency})
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              className="focus-ink rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
        ) : (
          <p className="text-xs text-muted-foreground">
            No money involved — this will be shown as{" "}
            {paymentType === "exchange" ? "a swap" : "given time"}.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            How fixed is the time?
            <select
              value={flexibility}
              onChange={(e) => setFlexibility(e.target.value)}
              className="focus-ink rounded-md border border-border bg-background px-3 py-2"
            >
              {FLEXIBILITIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            How soon?
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="focus-ink rounded-md border border-border bg-background px-3 py-2"
            >
              {URGENCIES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="focus-ink rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Saving…" : "Post it"}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            Your need is shown at {placeName || "place"} level only — never an address.
          </p>
        </div>
      </div>
    </section>
  );
}
