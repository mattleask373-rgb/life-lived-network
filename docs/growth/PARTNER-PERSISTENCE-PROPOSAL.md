# Proposal: storing partner interest (NOT implemented — needs approval)

Table `partner_interest`: id uuid, created_at, organisation, contact_name, email, locality,
org_type, challenge, notes, consent_at (required), status (default 'new'), internal_notes.

Access:
- Insert only via a server function that re-validates with `interestInput` (zod), rate-limited by
  honeypot field + duplicate (email, organisation) check within 24h.
- No public SELECT. Reads/updates only for a `partner_team` role in `user_roles`, checked server-side.
- internal_notes never returned to submitters.
- Retention: delete records 12 months after last contact; deletion on request.

UI change after approval: success state switches to "Sent — we'll be in touch", only when the
insert returns success; failures show an error and keep the copyable summary.
Tracker migrates from browser storage to this table for team members.
