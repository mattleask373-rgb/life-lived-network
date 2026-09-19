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
  CONTRIBUTIONS,
  EARNING_PREFERENCES,
  PREFERENCES,
  VERIFICATION_LABEL,
  type VerificationState,
} from "@/lib/capability";
import { FRESHNESS_LABEL, freshness } from "@/lib/capability-freshness";
import {
  addAvailability,
  addCapability,
  confirmCapability,
  getMyCapabilityProfile,
  removeAvailability,
  removeCapability,
  setCapabilityVisibility,
  setContributions,
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
  const gives = useMutation({ mutationFn: useServerFn(setContributions), onSuccess: refresh });
  const stillTrue = useMutation({ mutationFn: useServerFn(confirmCapability), onSuccess: refresh });
  const visibility = useMutation({
    mutationFn: useServerFn(setCapabilityVisibility),
    onSuccess: refresh,
  });

  const [kind, setKind] = useState("skill");
  const [label, setLabel] = useState("");
  const [level, setLevel] = useState("confident");
  const [evidence, setEvidence] = useState("");
  const [issuingBody, setIssuingBody] = useState("");
  const [obtainedOn, setObtainedOn] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [years, setYears] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const chosenAreas = data?.serviceAreas.map((a) => a.placeId) ?? [];
  const chosenPrefs = data?.preferences ?? [];
  const chosenGives = data?.contributions.map((c) => c.contribution) ?? [];
  const earning = data?.earningPreference ?? "unstated";
  const now = new Date().toISOString();

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
                <span className="block text-xs text-muted-foreground">
                  {FRESHNESS_LABEL[
                    freshness({ lastConfirmedAt: c.lastConfirmedAt, kind: "capability", now })
                  ]}
                  {c.kind === "qualification" && c.issuingBody ? ` · ${c.issuingBody}` : ""}
                  {c.kind === "experience" && c.organisation ? ` · ${c.organisation}` : ""}
                  {c.kind === "experience" && c.yearsExperience
                    ? ` · ${c.yearsExperience} years`
                    : ""}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={c.visibility}
                    onChange={(e) =>
                      visibility.mutate({ data: { id: c.id, visibility: e.target.value } })
                    }
                    aria-label={`Who can see ${c.label}`}
                    className="focus-ink rounded-lg border border-border bg-background px-2 py-1"
                  >
                    <option value="private">Just me</option>
                    <option value="local_discovery">People nearby</option>
                    <option value="public">Anyone</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => stillTrue.mutate({ data: { id: c.id } })}
                    className="focus-ink text-muted-foreground underline"
                  >
                    Still true
                  </button>
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

        {kind === "qualification" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">
              Who issued it
              <input
                value={issuingBody}
                onChange={(e) => setIssuingBody(e.target.value)}
                placeholder="City & Guilds"
                className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              When you got it
              <input
                type="date"
                value={obtainedOn}
                onChange={(e) => setObtainedOn(e.target.value)}
                className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              When it runs out
              <input
                type="date"
                value={expiresOn}
                onChange={(e) => setExpiresOn(e.target.value)}
                className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
        ) : null}

        {kind === "experience" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Where
              <input
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                placeholder="A nursery in Brighton"
                className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              For how many years
              <input
                inputMode="decimal"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="10"
                className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
        ) : null}

        <p className="mt-3 text-xs text-muted-foreground">
          Nobody has checked any of this. It will say so, everywhere it appears.
        </p>

        <button
          type="button"
          disabled={!label.trim() || add.isPending}
          onClick={() => {
            add.mutate({
              data: {
                kind,
                label: label.trim(),
                level,
                evidence: evidence.trim(),
                issuingBody: issuingBody.trim(),
                obtainedOn: obtainedOn || null,
                expiresOn: expiresOn || null,
                organisation: organisation.trim(),
                yearsExperience: years ? Number(years) : null,
              },
            });
            setLabel("");
            setEvidence("");
            setIssuingBody("");
            setObtainedOn("");
            setExpiresOn("");
            setOrganisation("");
            setYears("");
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
        <h2 className="text-xl">What you'd give</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Separate from what you're open to. This is the thing itself — your time, a van, a room.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONTRIBUTIONS.map((c) => {
            const on = chosenGives.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  gives.mutate({
                    data: {
                      contributions: on
                        ? chosenGives.filter((id) => id !== c.id)
                        : [...chosenGives, c.id],
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
                {c.label}
              </button>
            );
          })}
        </div>
        <label className="mt-4 grid max-w-xs gap-1 text-sm">
          And about money
          <select
            value={earning}
            onChange={(e) =>
              prefs.mutate({
                data: { preferences: chosenPrefs, earningPreference: e.target.value },
              })
            }
            className="focus-ink rounded-lg border border-border bg-background px-3 py-2"
          >
            {EARNING_PREFERENCES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
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
                <span className="block text-xs text-muted-foreground">
                  {
                    FRESHNESS_LABEL[
                      freshness({
                        lastConfirmedAt: w.lastConfirmedAt,
                        expiresAt: w.expiresAt,
                        kind: "availability",
                        now,
                      })
                    ]
                  }
                </span>
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
