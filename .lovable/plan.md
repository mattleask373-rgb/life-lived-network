# Real World Atlas: positioning audit and build plan (read-only)

Nothing is edited or published by this plan. Competitor information comes only from public comparison pages, and several of those pages are written by rival apps, so treat it as indicative. None of the competitor products were tested hands-on.

## 1. Current state, from this codebase
**What exists (seen in code):**
- 18 pages: home map/list, place pages (`$country.$place`), requests (`need`), make/give/help/earn, conversations, profile, journey, road-trip, life-list, sources, moderation, auth.
- One discovery engine, `findSupply()`, with trust chips, provenance and fixture-labelled demonstrations.
- Database tables cover: places (221 UK/IE localities), listings plus photos, needs, connection requests and messages, blocks, reports, capabilities, availability, service areas, journeys and journey stops, sources and records, and saved items.
- Accessibility: 44px tap targets on the map filters and item detail; app-wide error and not-found pages.
- Sign-in is required for every write. Input checks exist. The block filter fails closed.

**Gaps against "lifelong place and memory map":**
- No record of places a person has been, with dates and notes. Life-list and saved items are wish and save lists, not a memory history.
- No import of past travel (Google Timeline, GPX, photo locations), and no export of a person's own data.
- `journeys` exists, but it is about planning or opting into opportunities, not looking back on trips.
- There is no live event supply. Ticketmaster is switched off until a key is supplied, so only demonstration data shows.
- No measurement of outcomes at all.
- Not verified: database permission rules end to end, exposed schemas, storage rules for photos, and the escape-key focus return in the item detail panel.

## 2. Competitor opportunity matrix (public info)
| Pattern | Polarsteps | Been | Wanderlog | Dawarich | Atlas today | Opportunity |
|---|---|---|---|---|---|---|
| Past places / visited map | trips only | country checklist | no | full history | none | **Core gap** |
| Auto GPS tracking | yes | no | no | yes | no | Avoid (privacy, battery) |
| Import history (Takeout/GPX) | no [1](https://dawarich.app/docs/comparisons/vs-polarsteps/) | manual | booking emails [2](https://trekit.app/compare) | yes | no | Import in the browser, kept private by default |
| Itinerary planning | light | no | strong [3](https://travelhighlights.io/travel-apps/polarsteps-vs-wanderlog/) | no | road-trip (basic) | Keep it light |
| Journal / photos | strong | no | basic | some | none | Private notes per place |
| Social sharing / followers | yes | share card | collaborative | none | consent requests | Share with chosen people only, no follower counts |
| Data ownership / export | partial | ? | ? | strong | none | Export everything |
| **Local opportunities, needs, communities** | no | no | no | no | **yes** | **Unique differentiator** |

Positioning: the competitors record where you have been or plan where you will go. Atlas can connect where you have been with what you can do and who you can meet there now, using real records only.

## 3. Top 10 opportunities (V=value, D=differentiation, E=effort, R=risk; each H/M/L)
1. **Private "Places I've known"**: add a place with an optional date range and a note. Private by default. V-H D-M E-M R-L
2. **"What's here now" from a memory**: open a remembered place and run the existing place discovery. Only real items, honest when empty. V-H D-H E-L R-L
3. **Export my data** as JSON or GPX. V-M D-M E-L R-L
4. **Import a GPX or Google Takeout file read in the browser**, turned into place-level visits. Raw points are never stored. V-H D-M E-M R-M
5. **Finish the keyboard focus return in the item detail panel** (a known accessibility bug). V-M D-L E-L R-L
6. **Turn on a live event source** (Ticketmaster, once a key and licence check are in place). V-H D-M E-M R-M
7. **Share one memory or trip with specific people**, consent-based, link revocable. V-M D-M E-M R-M
8. **Lifetime "places known" summary**: counts that come only from the person's own records, with no streaks and no rankings. V-M D-L E-L R-L
9. **"I could help here again"**: from a remembered place, offer skills there through the existing service areas, keeping service area separate from where someone has lived. V-M D-H E-M R-M
10. **Outcome metrics**, aggregate only: enquiries started and completed, and the useful-result rate. V-M D-L E-M R-M

## 4. Roadmap
- **MVP (2–3 weeks):** items 1, 2, 3, 5. They need one new table for place memories (owner-only access rules, behind your approval) and one new page, `/memories`.
- **Next release:** items 4, 8, 10, plus the database permission review that is already outstanding.
- **Later bets:** items 6, 7, 9; optional photo attachments in the private bucket; a printable book (needs a commercial decision).
- **Explicitly not planned:** always-on GPS tracking, live location sharing, follower counts and feeds.

## 5. Architecture and integrations
- Add a `place_memories` table: id, user_id, place_id (an existing locality), started_on and ended_on dates, note, visibility (private, or shared with chosen people), and created_at. Precision stays at locality level; addresses or raw coordinates are never stored.
- Server functions: create, list, delete and export. The database restricts every row to its owner.
- The memory screen sends people to the existing `/$country/$place` page. No new discovery logic: `findSupply()` stays the only engine.
- Import: parse files in the browser and convert points to the nearest known locality on the device. Only locality IDs and dates are sent to the server.
- Maps: keep the current hand-drawn map. If real map tiles are added later, check the tile provider's licence (OpenStreetMap requires attribution and does not allow heavy use of its own tile servers).
- Licensing and privacy cautions:
  - Google Takeout is the user's own data, so it may be imported but never scraped.
  - Ticketmaster has its own display and attribution terms.
  - Visited-places history counts as sensitive personal data under UK GDPR (it can reveal health, religion and similar). That means explicit consent, and deletion and export rights.
  - No content from competitors is reused.

## 6. Acceptance criteria and metrics
- A memory is private by default. A second account cannot read it; this must be proven with a two-user database test.
- Deleting a memory removes it from export and from every view.
- The export contains every memory the person has, and nothing belonging to anyone else.
- An imported file never sends raw coordinates to the server (checked by watching network traffic in a test).
- The "what's here now" view shows only real records or an honest empty state, and its order matches `findSupply()`.
- The page works at 375px, has 44px tap targets and sensible keyboard focus, and passes the axe accessibility check with no serious issues (this does not mean it is certified compliant).
- **Metrics** (aggregate only, introduced after approval):
  - share of new accounts who add at least 3 memories
  - share of memory views that lead to a place-discovery visit
  - enquiries started from those visits
  - exports used
  - deletion requests completed within 30 days

## 7. Product-owner decisions
1. Is the lifelong memory map the main positioning, or a secondary feature beside local opportunities?
2. Is the new `place_memories` table and its owner-only access rules approved?
3. Should dates be optional? How precise (year, month or day)?
4. Is import (item 4) in scope for the next release? Which formats come first?
5. Should memories ever be public, or only shared with chosen people?
6. Licence and budget for live events (the Ticketmaster key)?
7. Is a paid tier planned (for example a printed book)? If so, what can be paid for without breaking the trust rules?
8. The open decisions from earlier still stand: which repo is canonical, backend A/B/C, and the duplicate ADR 003 numbers.

## Technical notes
Plan only. No files, schema, secrets or deployment change until approved. Commands to run after building: `bunx tsgo --noEmit`, `bun run lint`, `bunx vitest run`, `bun run build`.
