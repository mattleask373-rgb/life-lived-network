import { publicPage } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { closeHour, createHour, fetchHours, type HourDirection } from "@/lib/hours";

const title = "What can you give? — The Living World";
const description =
  "An hour of something useful: teaching, painting, photography, a garden, a language. Real people offering real hours, and people who'd love to learn.";

export const Route = createFileRoute("/give")({
  head: () => publicPage({ path: "/give", title, description }),
  component: Give,
});

const SUGGESTIONS = [
  "I can help paint",
  "I can teach the basics of a language I speak",
  "I can photograph your event",
  "I can help in your garden",
  "I can teach guitar",
  "I can help carry things",
  "I can help you practise English",
  "I can help fix a bike",
];

function Give() {
  const { user, ready } = useSession();
  const qc = useQueryClient();
  const { data: hours, isLoading } = useQuery({ queryKey: ["hours"], queryFn: () => fetchHours() });

  const offering = (hours ?? []).filter((h) => h.direction === "offering");
  const asking = (hours ?? []).filter((h) => h.direction === "asking");

  return (
    <main className="paper-grain min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            The one-hour economy
          </p>
          <h1 className="mt-1 text-4xl leading-none">What can you give?</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            One hour is enough to change somebody's week. Nothing here is scored, ranked or
            counted — it's just hours, in people's own words.
          </p>
        </header>

        {ready && user ? (
          <NewHour userId={user.id} onDone={() => qc.invalidateQueries({ queryKey: ["hours"] })} />
        ) : (
          <section className="card-paper mt-6 p-5">
            <h2 className="text-xl">Offering an hour needs an account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only so the person you're helping knows who's coming. Looking around never does.
            </p>
            <Link
              to="/auth"
              className="focus-ink mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              Sign in or join
            </Link>
          </section>
        )}

        <Column
          heading="Hours people are offering"
          empty="Nobody has offered an hour yet. Yours could be the first."
          loading={isLoading}
          rows={offering}
          userId={user?.id}
          onClose={async (id) => {
            await closeHour(id);
            await qc.invalidateQueries({ queryKey: ["hours"] });
          }}
        />

        <Column
          heading="Hours people would love"
          empty="Nobody's asked for a hand yet."
          loading={isLoading}
          rows={asking}
          userId={user?.id}
          onClose={async (id) => {
            await closeHour(id);
            await qc.invalidateQueries({ queryKey: ["hours"] });
          }}
        />

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Give an hour. Leave it better. Then put the phone away.
        </p>
      </div>
    </main>
  );
}

function Column({
  heading,
  empty,
  loading,
  rows,
  userId,
  onClose,
}: {
  heading: string;
  empty: string;
  loading: boolean;
  rows: Awaited<ReturnType<typeof fetchHours>>;
  userId?: string | undefined;
  onClose: (id: string) => void;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl">{heading}</h2>
      {loading ? (
        <p className="mt-2 text-sm text-muted-foreground">Looking…</p>
      ) : rows.length ? (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {rows.map((h) => (
            <li key={h.id} className="card-paper p-4">
              <p className="text-base">{h.title}</p>
              {h.detail ? (
                <p className="mt-1 text-sm text-muted-foreground">{h.detail}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {[
                  h.person ?? "Someone here",
                  h.neighbourhood || null,
                  h.when_text || null,
                  `${h.minutes} min`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {h.skills.length ? (
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {h.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </p>
              ) : null}
              {userId === h.user_id ? (
                <button
                  type="button"
                  onClick={() => onClose(h.id)}
                  className="focus-ink mt-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  This hour is taken
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

function NewHour({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [direction, setDirection] = useState<HourDirection>("offering");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [when, setWhen] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [skills, setSkills] = useState("");

  const save = useMutation({
    mutationFn: () =>
      createHour(
        {
          direction,
          title: title.trim(),
          detail: detail.trim(),
          neighbourhood: neighbourhood.trim(),
          when_text: when.trim(),
          minutes,
          skills: skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        userId,
      ),
    onSuccess: () => {
      setTitle("");
      setDetail("");
      setSkills("");
      onDone();
    },
  });

  return (
    <section className="card-paper mt-6 p-5">
      <h2 className="text-xl">I have one hour</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["offering", "asking"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            aria-pressed={direction === d}
            className={`focus-ink rounded-full border px-3 py-1.5 text-sm ${
              direction === d
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {d === "offering" ? "I can give an hour" : "I could use a hand"}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm">
        In your own words
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={direction === "offering" ? "I can teach guitar" : "I need help painting a room"}
          className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTitle(s)}
            className="focus-ink rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm">
        Anything worth knowing
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={2}
          className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          Roughly where
          <input
            value={neighbourhood}
            onChange={(e) => setNeighbourhood(e.target.value)}
            placeholder="The part of town you'd travel to"
            className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          When you're free
          <input
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            placeholder="Most weekday evenings"
            className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Minutes
          <input
            type="number"
            min={15}
            max={480}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value) || 60)}
            className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm">
        Skills, separated by commas
        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="guitar, teaching"
          className="focus-ink mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>

      <p className="mt-3 text-xs text-muted-foreground">
        Only your name and roughly where — never your address.
      </p>

      <button
        type="button"
        disabled={!title.trim() || save.isPending}
        onClick={() => save.mutate()}
        className="focus-ink mt-4 rounded-full bg-accent px-6 py-2.5 text-accent-foreground disabled:opacity-50"
      >
        {save.isPending ? "Putting it up…" : "Put it on the noticeboard"}
      </button>
      {save.isError ? (
        <p className="mt-2 text-sm text-destructive">
          That didn't save. Have another go in a moment.
        </p>
      ) : null}
    </section>
  );
}
