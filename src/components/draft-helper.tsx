import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { draftFromText } from "@/lib/draft-assist.functions";
import { MAX_INPUT, type Draft, type DraftKind } from "@/lib/draft-assist";

const KIND_LABEL: Record<DraftKind, string> = {
  need: "Something you need",
  offer: "Something you can offer",
  place: "A place, event or project",
};

/**
 * Write it in your own words; get a tidy draft back to check. Suggested only —
 * nothing is filled in until you choose "Use this draft", and nothing is
 * posted until you post the form yourself.
 */
export function DraftHelper({ hint, onUse }: { hint: DraftKind; onUse: (draft: Draft) => void }) {
  const draft = useServerFn(draftFromText);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Draft | null>(null);

  async function run() {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const r = await draft({ data: { text, hint } });
      if (r.ok) setResult(r.draft);
      else setError(r.error);
    } catch {
      setError("We couldn't draft that. You can still write it yourself.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="draft-helper-h" className="card-paper p-5">
      <h2 id="draft-helper-h" className="flex items-center gap-2 text-xl">
        <Sparkles aria-hidden size={18} /> Help me write it
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Describe it in your own words. AI tidies it into a draft for you to check — it only uses
        what you wrote and never adds details.
      </p>
      <label className="mt-3 grid gap-1 text-sm">
        <span className="sr-only">Your own words</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_INPUT))}
          rows={3}
          placeholder="e.g. my back garden is overgrown, need someone for a few hours one weekend, can pay"
          className="focus-ink rounded-md border border-border bg-background px-3 py-2"
        />
      </label>
      <button
        type="button"
        onClick={run}
        disabled={busy || text.trim().length < 8}
        className="focus-ink mt-3 min-h-11 rounded-full border border-border bg-background px-5 text-sm disabled:opacity-60"
      >
        {busy ? "Drafting…" : "Draft it for me"}
      </button>
      <div aria-live="polite">
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        {result ? (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Suggested draft · {KIND_LABEL[result.kind]}
            </p>
            <p className="mt-2 text-lg leading-tight">{result.title || "No title yet"}</p>
            {result.category ? (
              <p className="text-muted-foreground">Kind of thing: {result.category}</p>
            ) : null}
            {result.summary ? <p className="mt-2">{result.summary}</p> : null}
            {result.details.length ? (
              <ul className="mt-2 list-disc pl-5">
                {result.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            ) : null}
            {result.missing.length ? (
              <div className="mt-3">
                <p className="font-medium">Worth adding yourself</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {result.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.kind !== hint ? (
              <p className="mt-3 text-muted-foreground">
                This sounds more like {KIND_LABEL[result.kind].toLowerCase()} — you can still use it
                here.
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUse(result)}
                className="focus-ink min-h-11 rounded-full bg-primary px-5 text-sm text-primary-foreground"
              >
                Use this draft
              </button>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="focus-ink min-h-11 rounded-full border border-border px-5 text-sm"
              >
                Discard
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Using it only fills the form below. Check every line — nothing is posted until you
              post it.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
