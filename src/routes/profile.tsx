import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useQuery } from "@tanstack/react-query";
import { fetchPlaces } from "@/lib/places";

const title = "Who you are — The Living World";
const description =
  "A profile that reads like a person: what you're interested in, what you could offer, and what you'd love to do. No followers, no scores.";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

const CAN_OFFER = [
  "time",
  "skills",
  "knowledge",
  "photography",
  "music",
  "transport",
  "equipment",
  "cooking",
  "gardening",
  "languages",
  "design",
  "technology",
  "organisation",
  "teaching",
  "creativity",
  "local knowledge",
];

const WOULD_LOVE_TO = [
  "learn",
  "explore",
  "meet people",
  "work",
  "volunteer",
  "create",
  "travel",
  "collaborate",
  "contribute",
  "find community",
];

function Chips({
  options,
  value,
  onChange,
  label,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
}) {
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  return (
    <fieldset>
      <legend className="text-sm text-muted-foreground">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              aria-pressed={on}
              className={`focus-ink rounded-full border px-3 py-1.5 text-sm transition-colors ${
                on
                  ? "border-transparent bg-secondary text-secondary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ProfilePage() {
  const { user, ready } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    display_name: "",
    intro: "",
    location: "",
    place_id: "",
    languages: "",
    interests: "",
    can_offer: [] as string[],
    would_love_to: [] as string[],
    can_teach: "",
    wants_to_learn: "",
    discoverable: false,
  });

  useEffect(() => {
    if (ready && !user) void navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!alive) return;
      if (data) {
        setForm({
          display_name: data.display_name ?? "",
          intro: data.intro ?? "",
          location: data.location ?? "",
          place_id: data.place_id ?? "",
          languages: (data.languages ?? []).join(", "),
          interests: (data.interests ?? []).join(", "),
          can_offer: data.can_offer ?? [],
          would_love_to: data.would_love_to ?? [],
          can_teach: (data.can_teach ?? []).join(", "),
          wants_to_learn: (data.wants_to_learn ?? []).join(", "),
          discoverable: data.discoverable ?? false,
        });
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const { data: places } = useQuery({
    queryKey: ["places", "settleable"],
    queryFn: () => fetchPlaces(["city", "town", "village", "neighbourhood"]),
  });

  const list = (s: string) =>
    s
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaved(false);
    const { error: err } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: form.display_name,
      intro: form.intro,
      location: form.location,
      place_id: form.place_id || null,
      languages: list(form.languages),
      interests: list(form.interests),
      can_offer: form.can_offer,
      would_love_to: form.would_love_to,
      can_teach: list(form.can_teach),
      wants_to_learn: list(form.wants_to_learn),
      discoverable: form.discoverable,
    });
    if (err) setError(err.message);
    else setSaved(true);
  };

  if (!ready || loading) return <main className="paper-grain min-h-screen" />;

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-20 sm:px-6">
        <h1 className="text-3xl sm:text-4xl">Who you are</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A few honest lines is plenty. There are no followers here, and nothing is scored.
        </p>

        <form onSubmit={save} className="mt-6 space-y-6">
          <div className="card-paper space-y-4 p-5">
            <label className="block text-sm">
              <span className="text-muted-foreground">Name</span>
              <input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">A short introduction</span>
              <textarea
                value={form.intro}
                onChange={(e) => setForm({ ...form, intro: e.target.value })}
                rows={3}
                className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted-foreground">Where you are</span>
                <select
                  value={form.place_id}
                  onChange={(e) => {
                    const id = e.target.value;
                    const found = places?.find((pl) => pl.id === id);
                    setForm({
                      ...form,
                      place_id: id,
                      location: found ? found.name : form.location,
                    });
                  }}
                  className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                >
                  <option value="">Somewhere else</option>
                  {(places ?? []).map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-muted-foreground">
                  A place, never an address.
                </span>
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Languages (comma separated)</span>
                <input
                  value={form.languages}
                  onChange={(e) => setForm({ ...form, languages: e.target.value })}
                  className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-muted-foreground">Interests (comma separated)</span>
              <input
                value={form.interests}
                onChange={(e) => setForm({ ...form, interests: e.target.value })}
                className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              A photograph goes here when you have one you actually took. We'd rather have an
              empty space than an invented face.
            </p>
          </div>

          <div className="card-paper space-y-5 p-5">
            <Chips
              label="I can offer"
              options={CAN_OFFER}
              value={form.can_offer}
              onChange={(can_offer) => setForm({ ...form, can_offer })}
            />
            <Chips
              label="I would love to"
              options={WOULD_LOVE_TO}
              value={form.would_love_to}
              onChange={(would_love_to) => setForm({ ...form, would_love_to })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted-foreground">I can teach</span>
                <input
                  value={form.can_teach}
                  onChange={(e) => setForm({ ...form, can_teach: e.target.value })}
                  placeholder="guitar, bicycle repair"
                  className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">I want to learn</span>
                <input
                  value={form.wants_to_learn}
                  onChange={(e) => setForm({ ...form, wants_to_learn: e.target.value })}
                  placeholder="Portuguese, pottery"
                  className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
            </div>
          </div>

          <div className="card-paper p-5">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.discoverable}
                onChange={(e) => setForm({ ...form, discoverable: e.target.checked })}
                className="mt-1"
              />
              <span>
                Let other people find me on the map.
                <span className="block text-muted-foreground">
                  Only your name, introduction and what you offer. Never your exact location, and
                  you can turn this off at any moment.
                </span>
              </span>
            </label>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saved ? <p className="text-sm text-muted-foreground">Saved.</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="focus-ink rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              Save
            </button>
            <Link
              to="/make"
              className="focus-ink rounded-full border border-border bg-card px-5 py-2.5 text-sm"
            >
              Make something happen
            </Link>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                void navigate({ to: "/" });
              }}
              className="focus-ink rounded-full border border-border bg-card px-5 py-2.5 text-sm"
            >
              Sign out
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
