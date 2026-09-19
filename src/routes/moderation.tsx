import { privatePage } from "@/lib/seo";
/**
 * An internal safety tool, not a product feature.
 *
 * Nothing links here from ordinary navigation, the page is never indexed, and
 * anyone without the role sees only a plain refusal — the database refuses
 * them too, so this is not the guard, only the door.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { useSession } from "@/hooks/use-session";
import {
  amISafetyReviewer,
  listReports,
  recordReportReview,
  type ReviewerReport,
} from "@/lib/moderation.functions";
import { REASON_LABEL, RESOLUTIONS, SUBJECT_LABEL } from "@/lib/moderation";

const title = "Report review — internal";
const description = "Internal safety review of reports. Not a public page.";

export const Route = createFileRoute("/moderation")({
  head: () => privatePage({ path: "", title, description }),
  component: Moderation,
});

function when(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Moderation() {
  const { user, ready } = useSession();
  const checkRole = useServerFn(amISafetyReviewer);
  const load = useServerFn(listReports);
  const [openId, setOpenId] = useState<string | null>(null);

  const role = useQuery({
    queryKey: ["safety-reviewer"],
    queryFn: () => checkRole(),
    enabled: Boolean(user),
  });
  const reviewer = role.data?.reviewer === true;

  const reports = useQuery({
    queryKey: ["reports"],
    queryFn: () => load(),
    enabled: reviewer,
  });

  if (ready && !user) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16">
        <h1 className="text-2xl">Report review</h1>
        <p className="mt-2 text-muted-foreground">You need to sign in to reach this.</p>
      </main>
    );
  }

  if (role.isLoading || !ready) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16">
        <p className="text-muted-foreground">One moment.</p>
      </main>
    );
  }

  if (!reviewer) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16">
        <h1 className="text-2xl">Report review</h1>
        <p className="mt-2 text-muted-foreground">This isn't open to you.</p>
      </main>
    );
  }

  const list = reports.data ?? [];
  const open = list.find((r) => r.id === openId) ?? null;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <h1 className="text-2xl">Reports</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        A report means someone asked for this to be looked at. It is not a finding about anyone.
        Nothing changes for the person reported unless a reviewer records a decision here.
      </p>

      {reports.isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading.</p>
      ) : !list.length ? (
        <p className="mt-8 text-muted-foreground">Nothing has been reported.</p>
      ) : (
        <table className="mt-8 w-full border-collapse text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="border-b border-border py-2 pr-4 font-normal">Status</th>
              <th className="border-b border-border py-2 pr-4 font-normal">Type</th>
              <th className="border-b border-border py-2 pr-4 font-normal">Reported</th>
              <th className="border-b border-border py-2 pr-4 font-normal">Created</th>
              <th className="border-b border-border py-2 font-normal">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((report) => (
              <tr key={report.id}>
                <td className="border-b border-border py-2 pr-4">
                  {report.status === "reviewed" ? "Reviewed" : "Unreviewed"}
                </td>
                <td className="border-b border-border py-2 pr-4">
                  {REASON_LABEL[report.reason] ?? report.reason}
                </td>
                <td className="border-b border-border py-2 pr-4">{report.reportedName}</td>
                <td className="border-b border-border py-2 pr-4">{when(report.createdAt)}</td>
                <td className="border-b border-border py-2">
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => setOpenId(report.id === openId ? null : report.id)}
                  >
                    {report.status === "reviewed" ? "View" : "Review"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open ? <ReviewPanel report={open} onClose={() => setOpenId(null)} /> : null}
    </main>
  );
}

function ReviewPanel({ report, onClose }: { report: ReviewerReport; onClose: () => void }) {
  const save = useServerFn(recordReportReview);
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState(report.resolution || "");
  const [note, setNote] = useState(report.reviewNote);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      save({ data: { id: report.id, resolution, reviewNote: note, reviewed: true } }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
      onClose();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "That didn't save."),
  });

  return (
    <section className="mt-10 rounded-lg border border-border p-5">
      <h2 className="text-lg">Review this report</h2>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">What was reported</dt>
          <dd>{SUBJECT_LABEL[report.subjectType] ?? report.subjectType}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Reason given</dt>
          <dd>{REASON_LABEL[report.reason] ?? report.reason}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Person reported</dt>
          <dd>{report.reportedName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Reported by</dt>
          <dd>{report.reporterName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Filed</dt>
          <dd>{when(report.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Reviewed</dt>
          <dd>
            {report.status === "reviewed"
              ? `${when(report.reviewedAt)}${report.reviewerName ? ` by ${report.reviewerName}` : ""}`
              : "Not yet"}
          </dd>
        </div>
      </dl>

      {report.contextTitle ? (
        <p className="mt-4 text-sm">
          <span className="text-muted-foreground">Context: </span>
          {report.contextTitle}
          {report.contextPlace ? `, ${report.contextPlace}` : ""}
        </p>
      ) : null}

      {report.note ? (
        <p className="mt-2 max-w-prose text-sm">
          <span className="text-muted-foreground">In their words: </span>
          {report.note}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4">
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">What you decided</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          >
            <option value="">Choose…</option>
            {RESOLUTIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Notes</span>
          <textarea
            className="min-h-24 rounded-md border border-border bg-background px-3 py-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
          />
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex gap-4">
          <button
            type="button"
            className="rounded-md border border-border px-4 py-2 text-sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save review"}
          </button>
          <button type="button" className="text-sm underline underline-offset-4" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </section>
  );
}
