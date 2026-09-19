# Slice 4 — Connection

Slices 1–3 are in place: people can say what they can do, people can post what they need, and both directions of matching work (a need finds people, a person finds needs). Right now every match ends in a dead end — there is no way to say "I could help with this".

This slice builds the smallest honest connection step, and nothing more.

## What exists today (audited)

- Capability profiles, service areas, availability, preferences, contributions — done.
- Needs with place, time, budget, required roles/skills/qualifications — done.
- Deterministic matching in both directions, with labelled match types and factual reasons — done.
- No messaging, no contact, no notifications of any kind. Nothing to extend, so this is built new and kept deliberately small.

## What this slice adds

**One thing: an expression of interest that carries its context.**

From a need, the person who posted it sees who could help and can invite them. From the "Help someone" page, a person can say they're interested in a need. Both produce the same kind of record.

Each message carries the thing it's about — the need, the place, the time — so nobody has to re-explain themselves.

- A short note (the person's own words, optional).
- The context, attached automatically: what the need is, where, when.
- A state: sent, accepted, declined, withdrawn.
- A simple thread of replies on it, so an agreement can actually be reached.

## What is deliberately not built

No inbox platform, no realtime, no typing indicators, no read receipts, no attachments, no group threads, no notifications by email or push, no payments, no reviews, no ratings.

## Privacy and safety rules this slice must hold

- No contact details are ever revealed by the system. If two people choose to swap a number in their own words, that is theirs.
- Nothing is sent on anyone's behalf, ever. Every message is an explicit action.
- A message only reveals what the profile already shows at its stated visibility. Private facts stay private.
- Either side can withdraw or decline, and it says so plainly.
- Existing blocking and reporting will be reused when it lands; this slice adds nothing that would need rewriting for it.

## Where it appears

- On a need you posted: the people who could help, each with an "Invite" action, and the replies you've had.
- On the "Help someone" page: "I could help with this" on each possibility.
- A single quiet page listing your conversations, grouped into "about things you need" and "about things you offered". Empty state says it's empty, honestly.

## Technical notes

- New `connection_requests` table: need reference, sender, recipient, direction (offer or invite), note, status, timestamps, and a snapshot of the context at the moment of sending (so the record stays truthful if the need later changes).
- New `connection_messages` table: request reference, sender, body, timestamps.
- Access rules: only the two people involved can read or write a request or its messages. Recipients can accept, decline; senders can withdraw. No public read of either table.
- All reads and writes go through the existing server data boundary (`*.functions.ts` with the authenticated middleware) — no direct browser queries, bounded reads, same safe error shape as the rest.
- Reuses the existing needs and matching modules unchanged. No second matching path, no new geography, no new profile model.
- Tests: state transitions (only valid moves allowed), access isolation, and context snapshot correctness.

## Acceptance

- Someone can post a need, see real matched people, invite one, and receive a reply.
- Someone with a capability can find a need and offer help, and the poster sees it.
- Neither party's contact details or private profile facts are exposed anywhere in the flow.
- Existing pages, map, design, journeys and Life List are untouched.
- Typecheck, tests and build pass.

## After this

Slice 5 (community: projects, skills exchange, local knowledge) — which needs connection to exist first.
