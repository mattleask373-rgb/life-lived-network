/**
 * Possibility Front Door — Search Front Door + Conversion Instrumentation.
 *
 * Translates natural search queries ("Drake Birmingham", "gardener Brixton",
 * "things to do Birmingham tonight") into structured intent and locality
 * references, emitting provider-neutral telemetry and navigating towards
 * canonical Living World discovery.
 */
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useWorldContext } from "@/lib/world-context";
import { parseSearchIntent, type StructuredSearchIntent } from "@/lib/search-intent";
import { telemetry } from "@/lib/telemetry";

export function PossibilityFrontDoor() {
  const [text, setText] = useState("");
  const [lastSubmitted, setLastSubmitted] = useState<StructuredSearchIntent | null>(null);
  const navigate = useNavigate();
  const { index } = useWorldContext();

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    return parseSearchIntent(text, index);
  }, [text, index]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const intent = parseSearchIntent(text, index);
    setLastSubmitted(intent);

    // Emit conversion telemetry events
    telemetry.record({
      type: "search_submitted",
      timestamp: new Date().toISOString(),
      normalizedQuery: intent.normalizedQuery,
      source: "front_door",
    });

    if (intent.locality) {
      telemetry.record({
        type: "locality_resolved",
        timestamp: new Date().toISOString(),
        localityId: intent.locality.place.id,
        localitySlug: intent.locality.place.slug,
        kind: intent.locality.place.kind,
        confidence: intent.locality.confidence,
      });
    }

    telemetry.record({
      type: "intent_resolved",
      timestamp: new Date().toISOString(),
      intentFamily: intent.intentFamily,
      subject: intent.subject,
      timeframe: intent.timeframe,
      certainty: intent.certainty,
    });

    // Navigate to canonical route if resolved
    if (intent.suggestedPath && intent.suggestedPath !== "/") {
      void navigate({ to: intent.suggestedPath });
    }
  }

  return (
    <section aria-labelledby="front-door-heading" className="card-paper mt-6 p-5 sm:p-6">
      <h2 id="front-door-heading" className="text-xl sm:text-2xl font-serif">
        Search the real world
      </h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        Search for what you need, an artist, or things to do. We route you to verified real-world
        activity — we don&apos;t invent people, events, or availability.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="sr-only">Search the real world</span>
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setLastSubmitted(null);
            }}
            placeholder="e.g. Drake Birmingham · gardener Brixton · things to do tonight"
            className="focus-ink w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          className="focus-ink shrink-0 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground font-medium"
        >
          Discover
        </button>
      </form>

      {preview && (
        <div className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-2 items-center">
          {preview.locality && (
            <span className="rounded bg-muted px-2 py-0.5">
              Locality: <strong className="text-foreground">{preview.locality.place.name}</strong>
            </span>
          )}
          {preview.intentFamily !== "unknown" && (
            <span className="rounded bg-muted px-2 py-0.5">
              Intent: <strong className="text-foreground">{preview.intentFamily}</strong>
            </span>
          )}
          {preview.subject && (
            <span className="rounded bg-muted px-2 py-0.5">
              Subject: <strong className="text-foreground">{preview.subject}</strong>
            </span>
          )}
          {preview.timeframe && (
            <span className="rounded bg-muted px-2 py-0.5">
              When: <strong className="text-foreground">{preview.timeframe}</strong>
            </span>
          )}
        </div>
      )}

      {lastSubmitted && !lastSubmitted.locality && (
        <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground bg-muted/30">
          <p className="font-medium text-foreground">Honest quiet state</p>
          <p className="mt-1">
            We couldn&apos;t truthfully resolve a canonical locality for &quot;
            {lastSubmitted.rawQuery}&quot;. Pick a place from the map or explore your region to
            discover verified local activity.
          </p>
        </div>
      )}
    </section>
  );
}
