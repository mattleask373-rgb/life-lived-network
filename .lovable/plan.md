# Operation Ocean: My Places audit and next-phase plan (plan only)

This plan changes nothing. No competitor research was done in this session. That work is listed as its own workstream in section 11.

## 1. What exists today (checked in this project)
- **Discovery:** the home map and list (`/`), place pages (`/$country/$place`), requests (`/need`, `/need/$id`), and the make, give, help and earn pages. All of them use the single discovery engine, `findSupply()`, in `src/lib/supply-engine.ts`.
- **My Places MVP is already built:**
  - The `/memories` page ("Places I've known"), linked in the main menu in `__root.tsx`.
  - Data rules and checks in `src/lib/memories.ts`. Server actions in `src/lib/memories.functions.ts` (list, save, delete, export); each one requires sign-in and also filters by the owner.
  - Database table `place_memories`, created in migration `drizzle/migrations/0000_place_memories.sql`. It has owner-only rules for reading, adding, changing and deleting, no access for signed-out visitors, and visibility fixed to private.
  - `/memories` is on the private list in `src/lib/seo.ts`, so it is never in the sitemap.
  - Tests in `src/lib/memories.test.ts` cover input checks, sorting, the export format, privacy boundaries and the migration text.
  - A two-user isolation check was run against the database earlier and rolled back afterwards.
- **Export:** a partial JSON file covering memories, profile, skills, service areas, availability and saved items. It is clearly labelled as not complete.
- **Related lists:** the life list (stored on the device until sign-in, then in `saved_items`), journeys and road trips. These record plans and wishes, not memories.
- **Map:** the hand-drawn map component (`living-map.tsx`). No paid map tiles or Google Maps are in use.
- **Analytics:** no analytics code was found in `src`.

## 2. Unknowns (these need repository or backend access)
- Which GitHub repo is canonical (life-lived-network or life-lived-network2).
- Exposed-schema settings, and whether grants work as intended across all tables.
- Storage rules for photos.
- Whether the migration journal matches what is live in the database.
- Real-device keyboard and screen-reader behaviour on `/memories`.
- Whether the signed-in add, edit and delete flow and the download work end to end in the browser. The isolation check ran in the database, not in a browser.

## 3. Reuse, improve, avoid
- **Reuse:**
  - the place picker (`place-picker.tsx`) and `places` (localities only)
  - `requireSupabaseAuth`
  - the data-state components
  - `TrustChip` wording rules
  - links from a memory to the place page, which uses `findSupply()` for "what's here now"
- **Improve:**
  - year-only and month-level dates (today the form takes full dates only)
  - a full export: conversations, the person's own requests, reports and the life list
  - a confirmation step before deleting
  - a clear "private" label on every card
- **Avoid:**
  - a second matcher, or any feed of memories into discovery, matching or sitemaps
  - live GPS
  - follower counts and streaks
  - storing raw coordinates

## 4. MVP user journey (next phase)
```text
Sign in -> Places I've known -> Add place (search locality) -> optional dates (year/month/day) + note
 -> card shows "Private - only you" -> "What's here now" opens the place page (real records or honest empty state)
 -> Edit / Delete (with confirm) -> Download my data
```

## 5. Privacy and access boundaries
- The database enforces owner-only access. Server filters on the owner are a second check, not the only one.
- Visibility stays fixed to private. Sharing would need a new, separately approved migration.
- A memory never implies the person is there now, offers services there, or is available there.
- Location is stored at locality level only.
- Deleting a memory removes it everywhere at once, export included.
- UK GDPR: visited places can reveal sensitive information. That means explicit consent wording, plus export and deletion rights.

## 6. Export and import
- **Export (P0):**
  - Extend the JSON file to cover every table the person owns.
  - Add a GPX option for memories, using locality centre points only and labelled as approximate.
- **Import (P1, deferred as agreed):**
  - Formats: GPX and Google Takeout.
  - Files are read on the device, and each point is matched to the nearest known locality on the device.
  - Only the locality ID and dates are sent to the server.
  - The person reviews the list before anything is saved.
  - A test checks the network traffic and fails if any raw coordinates are sent.

## 7. Dependencies and cost risks
- **Front end:** no new packages are needed. GPX and Takeout files can be read with built-in browser tools, though a small parsing library may be worth it for P1.
- **Back end:** the existing database and server actions are enough.
- **Costs:**
  - None for P0.
  - Optional AI help (such as tidying notes) would use AI credits, and the draft helper already does this.
  - Map tiles or Google Maps would bring usage charges and licence terms. Keep the hand-drawn map.
  - Ticketmaster needs a key and has its own terms.

## 8. Tests and acceptance criteria
- **Existing tests stay green:** 240+ tests, typecheck, lint with 0 errors, and the build.
- **New unit tests:**
  - partial-date checks (year only, year and month)
  - every section present in the full export
  - delete confirmation
- **Isolation:**
  - repeat the two-user database check after any schema change
  - a browser check signed in as account A cannot see account B's memories
- **Phone width and accessibility:**
  - Playwright at 375px and 1280px
  - 44px tap targets
  - focus returns to the right place after closing a dialog
  - an axe check with no serious issues (this does not mean the page is certified compliant)
- **Truthfulness:** "What's here now" shows only `findSupply()` results, or the honest empty state.

## 9. Phased backlog
- **P0 (next):**
  1. End-to-end browser check of `/memories` while signed in.
  2. Delete confirmation and a "Private - only you" label on every card.
  3. Full export of every table the person owns.
  4. Partial dates (year and month). This needs a schema addition, such as a date-precision column, and your approval.
  5. Database permission and exposed-schema review, with your sign-off.
- **P1:**
  - GPX and Takeout import done on the device
  - GPX export
  - a lifetime summary counting only the person's own records, with no streaks
  - aggregate outcome metrics (no tracking of individuals)
- **P2:**
  - sharing with chosen people, consent-based and revocable
  - "I could help here again", linked to service areas but kept separate from where someone has lived
  - private photo attachments
  - a printed book (needs a commercial decision)

## 10. Questions needing human approval
1. Is a schema addition for date precision approved?
2. Which tables must the full export include? Should conversations include messages from the other person?
3. Is a GPX export with approximate points acceptable?
4. Which import format comes first in P1, GPX or Takeout?
5. Is an analytics approach approved? If so, aggregate only, and which tool?
6. Which GitHub repo is canonical?
7. Who signs off the database permission review?
8. Should sharing ever exist, and with what consent model?

## 11. Separate research workstream (not done)
A public-source comparison against Polarsteps, Been, Wanderlog and Dawarich. The earlier matrix came from public comparison pages, not hands-on testing. This should be repeated with dated sources before any positioning decision.

## Technical notes
Commands to run after building: `bunx tsgo --noEmit`, `bun run lint`, `bunx vitest run`, `bun run build`. Nothing is published without separate confirmation.
