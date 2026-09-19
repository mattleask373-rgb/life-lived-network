import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LAYERS, QUALITY_LABEL, relatedEntries, type WorldEntry } from "@/lib/world-data";
import {
  asBookingState,
  BOOKING_LABEL,
  isService,
  nextStepFor,
  providerLine,
  qualificationLine,
} from "@/lib/services";
import { duration, eventDate, layerText, money } from "./layer-colour";
import { LayerIcon } from "./layer-icon";

export function EntrySheet({
  entry,
  world = [],
  saved,
  onSave,
  onClose,
  onOpenEntry,
}: {
  entry: WorldEntry;
  /** The entries this screen is already showing; related things come from here. */
  world?: WorldEntry[];
  saved: boolean;
  onSave: (id: string) => void;
  onClose: () => void;
  onOpenEntry: (entry: WorldEntry) => void;
}) {
  const layer = LAYERS.find((l) => l.id === entry.layer);
  const related = relatedEntries(world, entry);
  const service = isService(entry);
  const step = nextStepFor(entry);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="paper-grain bottom-0 top-auto max-h-[88vh] w-full max-w-none translate-y-0 gap-0 overflow-y-auto rounded-t-2xl p-0 sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-lg"
      >
        <div
          className={`relative border-b border-border ${entry.photos?.length ? "bg-muted" : "photo-placeholder h-32"}`}
        >
          {entry.photos?.length ? (
            <div
              className="flex snap-x snap-mandatory gap-1 overflow-x-auto"
              aria-label="Real photos from this listing"
            >
              {entry.photos.slice(0, 6).map((photo, index) => (
                <figure
                  key={`${photo.url}-${index}`}
                  className="relative h-44 min-w-[82%] snap-start sm:h-52"
                >
                  <img
                    src={photo.url}
                    alt={photo.alt || `${entry.title}, photo ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-ink/75 px-3 py-2 text-xs text-card">
                    {photo.credit || "Source photo"} ·{" "}
                    <a
                      href={photo.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ink underline"
                    >
                      View source
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="absolute bottom-2 left-4 text-xs text-muted-foreground">
              A photo goes here when someone who was there shares one.
            </p>
          )}
        </div>

        <div className="p-5">
          <p
            className={`flex items-center gap-2 text-xs uppercase tracking-widest ${layerText[entry.layer]}`}
          >
            {layer ? <LayerIcon icon={layer.icon} size={15} strokeWidth={1.7} /> : null}{" "}
            {layer?.label}
          </p>
          <DialogTitle className="mt-1 text-2xl leading-tight">{entry.title}</DialogTitle>
          {entry.demonstration ? (
            <p className="mt-2 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
              <span className="uppercase tracking-widest">Demonstration record</span> — this is
              trial data showing how the Living World works here. It is not a real listing, and no
              real person or place is being described.
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">
            {entry.place} · {entry.neighbourhood}
          </p>

          {entry.cancellation ? (
            <p className="mt-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              The source says this is {entry.cancellation}. Check with them before setting off.
            </p>
          ) : null}

          <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="card-paper p-3">
              <dt className="text-xs text-muted-foreground">When</dt>
              <dd className="mt-0.5">
                {entry.startsAt ? eventDate(entry.startsAt, entry.timezone) : entry.when}
              </dd>
            </div>
            <div className="card-paper p-3">
              <dt className="text-xs text-muted-foreground">Takes</dt>
              <dd className="mt-0.5">{duration(entry.minutes)}</dd>
            </div>
            <div className="card-paper p-3">
              <dt className="text-xs text-muted-foreground">Money</dt>
              <dd className="mt-0.5">{money(entry.cost, entry.currency)}</dd>
            </div>
          </dl>

          <p className="mt-4 leading-relaxed">{entry.summary}</p>

          {/* A service: what it is, who provides it, where, when, what it costs,
              and the one next step that is actually true. */}
          {service ? (
            <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Service or practice
              </p>
              <p className="mt-1">{providerLine(entry)}</p>
              <p className="mt-1 text-muted-foreground">
                {entry.place} · {entry.neighbourhood}
              </p>
              <p className="mt-1 text-muted-foreground">Availability: {entry.when}</p>
              <p className="mt-1 text-muted-foreground">
                {BOOKING_LABEL[asBookingState(entry.bookingState)]} ·{" "}
                {money(entry.cost, entry.currency)}
              </p>
              <p className="mt-1 text-muted-foreground">{qualificationLine(entry)}</p>
              <div className="mt-3">
                {step.href ? (
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="focus-ink inline-flex rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
                  >
                    {step.label}
                  </a>
                ) : step.kind === "enquire" ? (
                  <Link
                    to="/need"
                    className="focus-ink inline-flex rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
                  >
                    {step.label}
                  </Link>
                ) : (
                  <span className="inline-flex rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                    {step.label}
                  </span>
                )}
                <p className="mt-2 text-xs text-muted-foreground">{step.note}</p>
              </div>
            </div>
          ) : null}

          {/* Where this came from, said plainly, with the way back to them. */}
          {entry.origin === "source" || entry.origin === "confirmed" ? (
            <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Where this came from
              </p>
              <p className="mt-1">
                Listed by {entry.sourceName || "an outside source"}
                {entry.organiser ? `, organised by ${entry.organiser}` : ""}. Nobody here posted it,
                so details are theirs, not ours.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                {entry.sourceUrl ? (
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="focus-ink underline"
                  >
                    See their page
                  </a>
                ) : null}
                {entry.ticketUrl && entry.ticketUrl !== entry.sourceUrl ? (
                  <a
                    href={entry.ticketUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="focus-ink underline"
                  >
                    Tickets
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            {entry.details.map((d) => (
              <li key={d} className="flex gap-2">
                <span aria-hidden="true">–</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>

          {entry.give ? (
            <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-3">
              <p className="text-xs uppercase tracking-widest text-primary">What you could give</p>
              <p className="mt-1 text-sm">{entry.give}</p>
            </div>
          ) : null}

          <p className="mt-4 text-sm text-muted-foreground">
            {entry.host}
            {entry.verified ? (
              <span className="ml-2 rounded-full border border-primary/40 px-2 py-0.5 text-xs text-primary">
                {QUALITY_LABEL.verified}
              </span>
            ) : (
              <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs">
                {entry.quality ? QUALITY_LABEL[entry.quality] : QUALITY_LABEL.unverified}
              </span>
            )}
            {entry.community ? (
              <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs">
                Posted by someone here
              </span>
            ) : null}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSave(entry.id)}
              className={`focus-ink rounded-full px-4 py-2 text-sm transition-colors ${
                saved
                  ? "border border-primary bg-primary/10 text-primary"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {saved ? "On your life list" : "Why not — save it"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="focus-ink rounded-full border border-border bg-card px-4 py-2 text-sm"
            >
              Put the phone away and go
            </button>
          </div>

          {related.length ? (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Close by</h3>
              <ul className="mt-2 space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onOpenEntry(r)}
                      className="focus-ink w-full rounded-lg border border-border bg-card p-3 text-left text-sm hover:shadow-paper"
                    >
                      {(() => {
                        const relatedLayer = LAYERS.find((l) => l.id === r.layer);
                        return relatedLayer ? (
                          <LayerIcon
                            icon={relatedLayer.icon}
                            size={14}
                            className={`mr-1 inline ${layerText[r.layer]}`}
                          />
                        ) : null;
                      })()}
                      {r.title}
                      <span className="block text-xs text-muted-foreground">
                        {r.neighbourhood} · {r.when}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
