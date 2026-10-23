import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flag } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { useSession } from "@/hooks/use-session";
import { reportPublicContent } from "@/lib/public-content-report.functions";
import type { PublicReportSubject } from "@/lib/public-content-report";
import type { ReportReason } from "@/lib/safety";

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "safety", label: "I feel unsafe" },
  { id: "harassment", label: "Harassment" },
  { id: "spam", label: "Spam" },
  { id: "misleading", label: "Misleading information" },
  { id: "other", label: "Something else" },
];

/**
 * A quiet, private request for review. Reporting never removes content, changes
 * a reputation signal, or tells the reported person who filed the report.
 */
export function ReportPublicContent({
  subjectType,
  subjectId,
  label,
  placeId = null,
}: {
  subjectType: PublicReportSubject;
  subjectId: string;
  label: string;
  placeId?: string | null;
}) {
  const { user } = useSession();
  const submit = useServerFn(reportPublicContent);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("misleading");
  const [note, setNote] = useState("");
  const report = useMutation({
    mutationFn: () =>
      submit({
        data: {
          subjectType,
          subjectId,
          reason,
          note: note.trim(),
          placeId,
        },
      }),
  });

  if (report.isSuccess) {
    return (
      <p className="mt-3 text-sm text-muted-foreground" role="status">
        Thank you. Your private report has been sent for review. It doesn't automatically hide{" "}
        {label} or make a judgement about anyone.
      </p>
    );
  }

  return (
    <section className="mt-6 border-t border-border pt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ink inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground underline underline-offset-4"
        >
          <Flag aria-hidden="true" size={15} />
          Report this {label}
        </button>
      ) : !user ? (
        <div className="rounded-xl border border-border bg-background p-4 text-sm">
          <p>Sign in to send a private report to the safety review team.</p>
          <Link to="/auth" className="focus-ink mt-2 inline-flex min-h-11 items-center underline">
            Sign in
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="focus-ink ml-4 inline-flex min-h-11 items-center text-muted-foreground underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <form
          className="rounded-2xl border border-border bg-background p-4"
          onSubmit={(event) => {
            event.preventDefault();
            report.mutate();
          }}
        >
          <h3 className="text-sm font-semibold">Report this {label}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            This goes privately to the review team, not to a public rating. A report is a request
            for review, not a verdict; nothing is hidden automatically.
          </p>
          <label className="mt-3 grid gap-1.5 text-sm">
            What concerns you?
            <select
              required
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              className="focus-ink min-h-11 rounded-lg border border-border bg-card px-3"
            >
              {REASONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 grid gap-1.5 text-sm">
            Anything else (optional)
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 1000))}
              maxLength={1000}
              rows={3}
              placeholder="Please don't include private details that aren't needed."
              className="focus-ink rounded-lg border border-border bg-card px-3 py-2"
            />
          </label>
          {report.isError ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              We couldn't send that report. The item may have changed or the service may be
              unavailable. Try again later.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={report.isPending}
              className="focus-ink inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm text-primary-foreground disabled:opacity-60"
            >
              {report.isPending ? "Sending…" : "Send private report"}
            </button>
            <button
              type="button"
              disabled={report.isPending}
              onClick={() => setOpen(false)}
              className="focus-ink inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
