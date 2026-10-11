# My Places: first complete version

## Audit: what already exists (checked this session)
- **Framework and sign-in:** the app's existing setup and sign-in. Every action on private places requires sign-in, and the four server actions (list, save, delete, export) each require it.
- **Private places page:** `/memories` ("Places I've known"), in the main menu and kept out of the sitemap. It has a list, add and edit, delete with a basic browser pop-up, and a JSON download.
- **Database table** `place_memories`:
  - It is linked to a known locality, not raw coordinates, with optional full dates and a note of up to 2,000 characters.
  - Visibility is locked to private.
  - The database rules let each owner read, add, edit and delete only their own places; signed-out visitors have no access.
  - An earlier two-account check passed.
- **Map:** the app's own hand-drawn map, with no paid map provider. Places come from the app's list of localities, each with a centre point.
- **Discovery:** the place page uses the single discovery engine, `findSupply()`, and shows trust labels.
- **Tests:** 35 files and 254 tests, all passing. The type check is clean.

## Gaps against the brief
- No memory type (lived, visited, worked, meaningful), no tags, and no approximate period such as a year or month.
- No map view of my places, and no search or filters.
- No detail page for a single memory with a separate discovery section.
- No Data and Privacy page, no documented export format, and no note on how to delete an account.
- Duplicate saves are not prevented, and the private-by-default notice before the first save could be clearer.

## Proposed slice (the smallest complete version)
1. **Database addition** (adds fields only; nothing removed or renamed):
   - `memory_type`: one of the four types, default "meaningful".
   - `tags`: up to 10 short tags, default empty.
   - `date_precision`: day, month or year, default day.
   - `place_label`: an optional name in the person's own words, default empty.
   - Owner-only access and private-only visibility stay as they are.
2. **My Places (`/memories`):**
   - Map and List switch. The map plots the centre of each place's locality.
   - Search by place or note, plus a filter by type.
   - Cards show place, period and type.
   - A friendly first-use screen.
   - An "Add a place" button.
3. **Add and edit form:**
   - Fields: locality picker (required), type, start and end dates with day/month/year choice, tags and note.
   - Shown before the first save: "Private by default."
   - The Save button locks while saving, so a double tap can't create two entries.
   - Clear saving, success and error messages.
4. **Place detail (`/memories/$id`):**
   - The private memory, with edit, delete (an in-app confirmation) and privacy status ("Only you").
   - A separately boxed section, "What's on in [place] now". It uses the existing discovery engine and shows only real records, their source and freshness, or an honest empty state with a link to the place page.
5. **Data and Privacy (`/privacy-data`):**
   - Download my data.
   - A plain field-by-field list of what is exported.
   - The documented JSON format, version 2.
   - Delete all my places, with confirmation.
   - Explains that full account deletion is not yet supported in-app and how to request it.
   - The download is created on request and is never stored at a public address.
6. **Tests:**
   - Input checks for type, tags, precision and date order.
   - Export covers only the owner's records, is complete for memories and matches the documented format.
   - Edit and delete only work on the owner's own records.
   - A source check that every new server action requires sign-in.
   - A live two-account database check, rolled back afterwards: signed-out visitors and other accounts can't read, edit or delete someone's places.
   - A phone-width (375px) browser check of the screens a signed-out visitor sees.

## Kept out on purpose
- Free-typed coordinates or exact addresses. The approved MVP stores locality-level location only, for privacy. The "optional address" in the brief becomes the person's own `place_label`, which is never matched to a map location.
- Imports, sharing, photos and live GPS.

## Checks after building
`bunx tsgo --noEmit`, `bun run lint`, `bunx vitest run` and `bun run build`, plus a Playwright check at 375px and 1280px. The signed-in flows will be checked with a test sign-in if one is available; otherwise they will be reported as not checked. Nothing is published.

## Decisions
- Is the database addition above approved?
- Should location stay at locality level only, as the plan recommends, instead of the exact coordinates the brief mentions?
