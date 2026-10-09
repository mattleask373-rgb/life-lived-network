import { publicPage } from "@/lib/seo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { createListing, KINDS, type NewListing } from "@/lib/listings";
import { currencySymbol } from "@/components/layer-colour";
import { useWorldContext } from "@/lib/world-context";
import { PlacePicker } from "@/components/place-picker";
import { LAYERS, type LayerId, type TimeBand } from "@/lib/world-data";

const title = "Make something happen — Real World Atlas";
const description =
  "Offer work, host an experience, put on an event, share a project, open a table or offer an hour of what you're good at.";

export const Route = createFileRoute("/make")({
  head: () => publicPage({ path: "/make", title, description }),
  component: MakePage,
});

/**
 * Somewhere on the drawn map, derived from the title so two things posted in
 * the same locality don't sit on top of each other. Real coordinates come from
 * the chosen place; this is only the illustrative fallback position.
 */
function illustrativePosition(seed: string): { x: number; y: number } {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  return { x: 20 + (hash % 60), y: 20 + ((hash >> 3) % 60) };
}

const BANDS: { id: TimeBand; label: string }[] = [
  { id: "now", label: "Happening now / most days" },
  { id: "today", label: "Later today" },
  { id: "tonight", label: "Tonight" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "weekend", label: "At the weekend" },
];

function MakePage() {
  const { user, ready } = useSession();
  const navigate = useNavigate();
  // What someone posts belongs to a real place from the shared hierarchy.
  const { place, children, path } = useWorldContext();
  // Either exactly here, or somewhere inside here.
  const options = useMemo(() => (place ? [place, ...children] : []), [place, children]);
  const [areaId, setAreaId] = useState<string>("");
  const chosen = options.find((p) => p.id === areaId) ?? place ?? null;
  const [kind, setKind] = useState<string | null>(null);
  const [mine, setMine] = useState<{ id: string; title: string; kind: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    title: "",
    summary: "",
    details: "",
    place: "",
    layer: "experience" as LayerId,
    when_text: "",
    band: "today" as TimeBand,
    hours: "2",
    cost: "0",
    pays: false,
    give: "",
    social: "friendly" as NewListing["social"],
    outdoors: false,
    people_needed: "",
    accessibility: "",
    contact_note: "",
  });

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("listings")
      .select("id, title, kind")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMine(data ?? []));
  }, [user, done]);

  const chooseKind = (id: string) => {
    const k = KINDS.find((x) => x.id === id);
    setKind(id);
    setDone(false);
    if (k) setForm((f) => ({ ...f, layer: k.layer, pays: id === "work" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !kind) return;
    setBusy(true);
    setError(null);
    const amount = Math.abs(Number(form.cost) || 0);
    const drawn = illustrativePosition(form.title || kind);
    try {
      await createListing(
        {
          kind,
          layer: form.layer,
          title: form.title,
          summary: form.summary,
          details: form.details
            .split("\n")
            .map((d) => d.trim())
            .filter(Boolean),
          place: form.place || (chosen?.name ?? ""),
          neighbourhood: chosen?.name ?? "",
          x: drawn.x,
          y: drawn.y,
          when_text: form.when_text,
          band: form.band,
          minutes: Math.round((Number(form.hours) || 1) * 60),
          cost: form.pays ? -amount : amount,
          give: form.give.trim() || null,
          social: form.social,
          outdoors: form.outdoors,
          people_needed: form.people_needed ? Number(form.people_needed) : null,
          accessibility: form.accessibility.trim() || null,
          contact_note: form.contact_note.trim() || null,
          place_id: chosen?.id ?? null,
          // Place-level coordinates only. Never an address, never a home.
          lat: chosen?.lat ?? null,
          lng: chosen?.lng ?? null,
        },
        user.id,
      );
      setDone(true);
      setKind(null);
      setForm((f) => ({ ...f, title: "", summary: "", details: "", when_text: "" }));
    } catch {
      setError("We couldn't save that right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <main className="paper-grain min-h-screen" />;

  if (!user) {
    return (
      <main className="paper-grain min-h-screen">
        <div className="mx-auto max-w-xl px-4 pt-10 pb-20 sm:px-6">
          <h1 className="text-3xl sm:text-4xl">Make something happen</h1>
          <p className="mt-2 text-muted-foreground">
            This is the part where a real person puts something real into the world, so we need to
            know who you are first. Looking around never needs an account.
          </p>
          <Link
            to="/auth"
            className="focus-ink mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
          >
            Sign in or make an account
          </Link>
        </div>
      </main>
    );
  }

  const input =
    "focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-20 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">Make something happen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only post things that genuinely exist. Anything unchecked is shown to other people as
          unchecked — that's fine, it just has to be honest.
        </p>

        <div className="mt-5">
          <PlacePicker />
        </div>

        {done ? (
          <div className="card-paper mt-6 p-5">
            <p>It's on the map.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              People will see it marked as not yet checked until someone who went confirms it.
            </p>
            <Link
              to="/"
              className="focus-ink mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              See it on the map
            </Link>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => chooseKind(k.id)}
              aria-pressed={kind === k.id}
              className={`focus-ink rounded-xl border p-3 text-left transition-colors ${
                kind === k.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:shadow-paper"
              }`}
            >
              <span className="block text-sm">{k.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{k.blurb}</span>
            </button>
          ))}
        </div>

        {kind ? (
          <form onSubmit={submit} className="mt-6 space-y-6">
            <div className="card-paper space-y-4 p-5">
              <label className="block text-sm">
                <span className="text-muted-foreground">
                  What is it? Say it the way you'd say it to a friend.
                </span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="We have an empty Tuesday"
                  className={input}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">A little more</span>
                <textarea
                  required
                  rows={3}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className={input}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Things worth knowing — one per line</span>
                <textarea
                  rows={3}
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  placeholder={"Bring a bag\nCash only\nEnds when it ends"}
                  className={input}
                />
              </label>
            </div>

            <div className="card-paper grid gap-4 p-5 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted-foreground">Where (a place name, not an address)</span>
                <input
                  value={form.place}
                  onChange={(e) => setForm({ ...form, place: e.target.value })}
                  placeholder="The name of the café, hall, farm or park"
                  className={input}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">
                  Which locality{path ? ` (inside ${path})` : ""}
                </span>
                <select
                  value={areaId || (place?.id ?? "")}
                  onChange={(e) => setAreaId(e.target.value)}
                  className={input}
                >
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Somewhere else? Change where you are at the top of this page.
                </span>
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">When, in words</span>
                <input
                  required
                  value={form.when_text}
                  onChange={(e) => setForm({ ...form, when_text: e.target.value })}
                  placeholder="Tuesday evening, from 21:00"
                  className={input}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Roughly when</span>
                <select
                  value={form.band}
                  onChange={(e) => setForm({ ...form, band: e.target.value as TimeBand })}
                  className={input}
                >
                  {BANDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">How many hours it takes</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  className={input}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">
                  {form.pays
                    ? `What it pays (${currencySymbol(place?.currency)})`
                    : `What it costs (${currencySymbol(place?.currency)}, 0 for free)`}
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className={input}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Which layer of the map</span>
                <select
                  value={form.layer}
                  onChange={(e) => setForm({ ...form, layer: e.target.value as LayerId })}
                  className={input}
                >
                  {LAYERS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">How many people, if it matters</span>
                <input
                  type="number"
                  min="1"
                  value={form.people_needed}
                  onChange={(e) => setForm({ ...form, people_needed: e.target.value })}
                  className={input}
                />
              </label>
            </div>

            <div className="card-paper space-y-4 p-5">
              <label className="block text-sm">
                <span className="text-muted-foreground">
                  Something a person could give here, if there is one
                </span>
                <input
                  value={form.give}
                  onChange={(e) => setForm({ ...form, give: e.target.value })}
                  placeholder="Play something. Or photograph whoever does."
                  className={input}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">
                  Access — steps, seating, noise, anything useful to know
                </span>
                <input
                  value={form.accessibility}
                  onChange={(e) => setForm({ ...form, accessibility: e.target.value })}
                  className={input}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">How someone gets in touch</span>
                <input
                  value={form.contact_note}
                  onChange={(e) => setForm({ ...form, contact_note: e.target.value })}
                  placeholder="Say hello here first and we'll share the address"
                  className={input}
                />
              </label>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <span className="text-muted-foreground">Feels</span>
                  <select
                    value={form.social}
                    onChange={(e) =>
                      setForm({ ...form, social: e.target.value as NewListing["social"] })
                    }
                    className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <option value="quiet">quiet</option>
                    <option value="friendly">friendly</option>
                    <option value="lively">lively</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.outdoors}
                    onChange={(e) => setForm({ ...form, outdoors: e.target.checked })}
                  />
                  Outdoors
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.pays}
                    onChange={(e) => setForm({ ...form, pays: e.target.checked })}
                  />
                  This pays the person
                </label>
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="focus-ink rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Putting it on the map…" : "Put it on the map"}
            </button>
          </form>
        ) : null}

        {mine.length ? (
          <section className="mt-10">
            <h2 className="text-xl">Things you've put into the world</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {mine.map((m) => (
                <li key={m.id} className="rounded-lg border border-border bg-card p-3">
                  {m.title}
                  <span className="block text-xs text-muted-foreground">
                    {KINDS.find((k) => k.id === m.kind)?.label ?? m.kind}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
