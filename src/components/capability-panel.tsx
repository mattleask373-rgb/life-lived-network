/**
 * What a person can do, where they'll go, when they're free, and what they're
 * open to — four separate statements, never collapsed into one.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  CAPABILITY_KINDS,
  CAPABILITY_LEVELS,
  PREFERENCES,
  VERIFICATION_LABEL,
  type VerificationState,
} from "@/lib/capability";
import {
  addAvailability,
  addCapability,
  getMyCapabilityProfile,
  removeAvailability,
  removeCapability,
  setPreferences,
  setServiceAreas,
} from "@/lib/capability.functions";
import { fetchPlaces } from "@/lib/places";

export function CapabilityPanel() {
  const qc = useQueryClient();
  const load = useServerFn(getMyCapabilityProfile);
  const { data } = useQuery({ queryKey: ["capability", "mine"], queryFn: () => load() });
  const { data: places } = useQuery({
    queryKey: ["places", "settleable"],
    queryFn: () => fetchPlaces(["city", "town", "village", "neighbourhood"]),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["capability", "mine"] });
  const add = useMutation({ mutationFn: useServerFn(addCapability), onSuccess: refresh });
  const drop = useMutation({ mutationFn: useServerFn(removeCapability), onSuccess: refresh });
  const areas = useMutation({ mutationFn: useServerFn(setServiceAreas), onSuccess: refresh });
  const prefs = useMutation({ mutationFn: useServerFn(setPreferences), onSuccess: refresh });
  const addWindow = useMutation({ mutationFn: useServerFn(addAvailability), onSuccess: refresh });
  const dropWindow = useMutation({ mutationFn: useServerFn(removeAvailability), onSuccess: refresh });

  const [kind, setKind] = useState("skill");
  const [label, setLabel] = useState("");
  const [level, setLevel] = useState("confident");
  const [evidence, setEvidence] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const chosenAreas = data?.serviceAreas.map((a) => a.placeId) ?? [];
  const chosenPrefs = data?.preferences ?? [];

  return (
    <div className="mt-6 space-y-6">
      <section className="card-paper p-5">
        <h2 className="text-xl">What you can do</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Saying you can garden doesn't say you're free, qualified or looking for work. Those are
          separate, below, and only you can state them.
        </p>

        <ul className="mt-4 space-y-2">
          {(data?.capabilities ?? []).map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
              <span>
                {c.label}
                <span className="block text-xs text-muted-foreground">
                  {CAPABILITY_KINDS.find((k) => k.id === c.kind)?.label ?? c.kind} ·{" "}
                  {CAPABILITY_LEVELS.find((l) => l.id === c.level)?.label ?? c.level} ·{" "}
                  {VERIFICATION_LABEL[c.verification as VerificationState] ?? "Not checked"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => drop.mutate({ data: { id: c.id } })}
                className="focus-ink text-xs text-muted-foreground underline"
              >
                Remove
              </button>
            </li>
          ))}
          {data && data.capabilities.length === 0 ? (
            <li className="text-sm text-muted-foreground">Nothing added yet.</li>
          ) : null}
        </ul>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            What is it?
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
            >
              {CAPABILITY_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            In your words
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="gardening, plastering, Portuguese"
              className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            How well?
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
            >
              {CAPABILITY_LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Anything that backs it up
            <input
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="City & Guilds, ten years at a nursery"
              className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={!label.trim() || add.isPending}
          onClick={() => {
            add.mutate({ data: { kind, label: label.trim(), level, evidence: evidence.trim() } });
            setLabel("");
            setEvidence("");
          }}
          className="focus-ink mt-3 rounded-full border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
        >
          Add
        </button>
      </section>

      <section className="card-paper p-5">
        <h2 className="text-xl">Where you'd actually go</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Places, not addresses. Leave it empty and nobody will be shown you for work nearby.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(places ?? []).map((p) => {
            const on = chosenAreas.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  areas.mutate({
                    data: {
                      placeIds: on
                        ? chosenAreas.filter((id) => id !== p.id)
                        : [...chosenAreas, p.id],
                    },
                  })
                }
                aria-pressed={on}
                className={`focus-ink rounded-full border px-3 py-1.5 text-sm ${
                  on
                    ? "border-transparent bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-paper p-5">
        <h2 className="text-xl">What you're open to</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing is assumed. If you don't tick it, we never suggest you for it.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PREFERENCES.map((p) => {
            const on = chosenPrefs.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  prefs.mutate({
                    data: {
                      preferences: on
                        ? chosenPrefs.filter((id) => id !== p.id)
                        : [...chosenPrefs, p.id],
                    },
                  })
                }
                aria-pressed={on}
                className={`focus-ink rounded-full border px-3 py-1.5 text-sm ${
                  on
                    ? "border-transparent bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-paper p-5">
        <h2 className="text-xl">When you're free</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Only what you put here counts as availability. Nothing else on your profile implies it.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {(data?.availability ?? []).map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-3">
              <span>
                {new Date(w.startsAt).toLocaleString()} – {new Date(w.endsAt).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => dropWindow.mutate({ data: { id: w.id } })}
                className="focus-ink text-xs text-muted-foreground underline"
              >
                Remove
              </button>
            </li>
          ))}
          {data && data.availability.length === 0 ? (
            <li className="text-muted-foreground">Nothing said yet.</li>
          ) : null}
        </ul>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            From
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Until
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={!from || !to || addWindow.isPending}
          onClick={() => {
            addWindow.mutate({
              data: {
                startsAt: new Date(from).toISOString(),
                endsAt: new Date(to).toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                note: "",
              },
            });
            setFrom("");
            setTo("");
          }}
          className="focus-ink mt-3 rounded-full border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
        >
          Add that window
        </button>
      </section>
    </div>
  );
}
