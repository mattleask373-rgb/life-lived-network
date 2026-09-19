# The Living World — UK-First Trial: Three Slices

The architecture already exists. This plan activates it in Britain. Nothing here is a redesign: every slice extends the existing geography, discovery, matching, journey, connection and design systems.

Portugal and Lisbon stay valid places. They simply stop being the default world.

## What already exists (and is reused, not rebuilt)

- One generic place hierarchy: country, region, area, city, town, village, neighbourhood — with parent links, slug, country code, timezone, currency and approximate centre. Only Portugal and Lisbon are populated today.
- One person model plus separate, private-by-default records for capabilities, qualifications, experience, service areas, availability, opportunity preferences and contributions.
- Needs as a first-class thing, covering paid work, help, community projects, volunteering and swaps.
- One deterministic possibility engine that explains every result, keeps unknown availability unknown, and says plainly when there is nothing honest to show.
- Explicit connection requests, participant-only conversations, blocking and reporting.
- Persisted journeys with stops and times, private unless the owner opts in.
- The hand-drawn map, warm design language, honest freshness labels, source-attributed photos and neutral avatars.
- The live backend currently has no accounts and no content. Everything visible today is development-only demonstration material.

## Current default assumptions to change (UK-first)

Default place is Lisbon; loading fallback text is Lisbon/Portugal; home and journey copy name Lisbon; the create-something screen has a fixed list of Lisbon districts; the give-an-hour example is a Lisbon district; the map artwork is Lisbon-shaped; discovery matches one exact locality with no parent/child or travel-time reasoning. Only these assumptions are removed — the generic model stays.

---

## SLICE 1 — The UK world, genuinely populated

**User-visible outcome.** Opening the app lands in Britain, not Portugal. You can choose where you are — Birmingham, Bristol or Herefordshire to begin with, and any other supported British locality as it is added — and everything on screen follows that choice: the map, what's around you, what's on today, tonight and this weekend, and the things people have posted. Rural Herefordshire and metropolitan Birmingham behave identically, because there is no city-specific code. Anything that is demonstration material is labelled as such, plainly, on the card itself.

**Existing architecture reused.** The place hierarchy; the single listing-to-card conversion seam; the server-side world read with its context, paging and limits; the map component's existing interface; the existing time bands and honesty labels; the existing development-only demonstration policy.

**Files and components affected.** Place helpers (default becomes the UK, fallback copy stops naming Lisbon, label no longer falls back to a wrong city, add ancestor/descendant lookup and bounded place search); the shared world read (accept a locality and its child localities, apply the time and radius fields the contract already defines); the world card shape (carry real coordinates, currency and timezone alongside the existing illustrative position); the home screen (locality chooser, UK copy, today/tonight/weekend views); create-a-listing and give-an-hour screens (choose a real place instead of a fixed district list); the map component (draw from real coordinates, with the existing illustrated view kept as fallback); demonstration content moved to Britain and clearly marked.

**Database changes.** Add British places: United Kingdom; England, Scotland, Wales, Northern Ireland; the counties/areas needed for the named cities and towns; Birmingham, Bristol and Herefordshire with their towns and a modest set of real neighbourhoods; and the secondary cities listed (London, Manchester, Liverpool, Leeds, Sheffield, Nottingham, Leicester, Coventry, Oxford, Cambridge, Newcastle, Edinburgh, Glasgow, Cardiff, Belfast) as valid, empty localities. Add locality identity that tolerates repeated British place names, coordinate sanity checks, and indexes for locality, time and status discovery. Portugal and Lisbon rows are untouched.

**Data required.** Real place names, hierarchy, timezone (Europe/London), currency (GBP) and approximate centres for the British localities. Real listing content only where it is genuinely known; otherwise a small, coherent, clearly-labelled trial set for Birmingham, Bristol and Herefordshire.

**Real versus demonstration data.** Geography is real. Activity content in the three trial areas is a deliberately small trial set, visibly marked as demonstration, never presented as a real named person or a real named local event that does not exist. No fabricated people, no invented photographs, no AI faces, no stock imagery standing in for a real local event. Empty localities stay honestly empty.

**Security implications.** No change to who can see what. Geography stays publicly readable and service-managed. Locality names and approximate centres only — never an address, never a live position.

**Testing.** Deep hierarchy resolves (neighbourhood up to United Kingdom); repeated British place names resolve unambiguously; a city-level view includes its neighbourhoods; Herefordshire and Birmingham both return their own world; Lisbon still works; empty localities read as quiet rather than inventing content; demonstration labelling is present; map renders on phone and desktop; existing tests and build stay green.

**Complexity and cost.** Medium. The geography data is the bulk of the work. A real map provider is deliberately **not** introduced here — the existing illustrated map continues, driven by real coordinates, so this slice adds no metered external usage.

**Not touched.** Matching, Needs, capabilities, connections, conversations, journeys, Life List, the design system, authentication, privacy rules, or anything about Portugal beyond it no longer being the default.

---

## SLICE 2 — The real human possibility and connection loop

**User-visible outcome.** A person in Birmingham can say what they need help with; a person in Herefordshire can say what they can genuinely offer. Each sees explained possibilities — why this person, where they are, what they said they were free for, and what has not been checked — and chooses whether to make contact. Nothing happens automatically. Blocked people disappear from everything, not just conversations. You can add a real photograph of yourself, or keep a neutral one.

**Existing architecture reused.** The deterministic possibility engine, unchanged as the source of truth; the existing reciprocal "what could I give" path; capabilities, availability, service areas and preferences exactly as modelled; existing connection requests, conversations, blocking and reporting; the existing explanation and freshness labels.

**Files and components affected.** The possibility retrieval layer (use locality hierarchy and stated service areas rather than one exact place; apply time; group candidates efficiently; report when results were cut short); the possibility engine (retire the older ungated travelling shortcut so only explicitly opted-in journeys can ever suggest someone); safety filtering applied consistently before results are shown in both directions; the need, help and conversation screens (clearer evidence, quiet states and safety actions); profile (add a photograph, remove it, neutral fallback kept); the person-facing capability and availability panel; report submission made explicit.

**Database changes.** A private photo store with owner-only writes and controlled reading; missing account links with proper cleanup on the older capability, service-area, availability, preference and Need tables; indexes supporting the hierarchy-and-time candidate reads.

**Data required.** Real trial participants creating their own capabilities, availability and Needs. A small number of clearly-labelled demonstration people for the three trial areas so the loop is demonstrable before real sign-ups exist — always identified as demonstration, never as a real named individual.

**Security implications.** This is the safety slice. Blocking must hold across browsing, matching, invitations and messaging. Private facts stay private; stale availability stops appearing; regulated things (childcare, gas, electrical, medical and similar) keep their "nobody has checked this" warning. Photographs are owner-controlled, size- and type-limited, and deletable. Reports gain an explicit review path and a named person responsible during the trial.

**Testing.** A full two-account run: sign up, profile, capability, availability, preference, Need, possibilities, contact, reply, block, report, unblock. Blocked-person tests in every direction. Private and stale facts excluded. Regulated warning present. Rural and urban both return sensible, different results. Photo upload, replacement, deletion and fallback.

**Complexity and cost.** Medium-high, mostly careful work rather than new architecture. No AI, no realtime, no notifications platform.

**Not touched.** The map, the design system, journeys, Life List, the way possibilities are explained or ordered, or the deterministic nature of matching.

---

## SLICE 3 — Journeys, local discovery and the investor front door

**User-visible outcome.** The front door asks what you want to do — look around you, find something to do, find somewhere to go, find people, find help, offer what you can do, or explore a journey — and each answer resolves into the one existing discovery system. "My Living World" gathers where you are, what you want, what you can offer, what you need and where you're going, in one quiet place. You can build a real British journey (for example Bristol to Birmingham to Manchester) and see what is genuinely along it. "What's within about thirty minutes?" works, and says clearly whether that is a travel time or a straight-line estimate. The signature moment works end to end: "I have Saturday free and I'm interested in photography" returns explainable real possibilities across place, time, interest, people, events and communities.

**Existing architecture reused.** One discovery path with named intents — no second search engine; the persisted journey records and their overlap rules; the pure journey arranger; the same possibility engine and explanations; existing cards, sheets and map.

**Files and components affected.** The home screen becomes the intent front door; a "My Living World" view assembled from existing data; the journey screen connected to the existing saved-journey functions, with stops, dates, visibility and opportunity opt-in; along-the-journey and nearby-in-time discovery added to the existing retrieval; a travel-time helper that labels its own certainty; polish across every screen — dead controls, placeholder copy, empty and error states, loading, mobile and desktop layout, consistent wording, and unique page information for each locality page worth sharing.

**Database changes.** Minimal: indexes for journey-stop and time discovery, if needed. No new entity model.

**Data required.** Journey stops from the real UK place hierarchy. Travel time only where a routing source is genuinely available; otherwise clearly-labelled approximate distance.

**Real versus demonstration data.** Every journey and weekend result must trace back to a real record or a labelled trial record. No result is invented to fill a gap, and empty is shown as empty.

**Security implications.** Journeys stay private unless the owner chooses public and opts into opportunities; a journey never implies a live location or that someone is available for work. If a routing service is used, calls stay on the server, behind sign-in, bounded and cached to avoid runaway cost.

**Testing.** Intent front door resolves each intent to real results or an honest quiet state. Saturday-photography flow in Birmingham, Bristol and Herefordshire. Journey visibility matrix. Along-the-route correctness. Travel-time labelling. Full walkthrough of every screen on phone and desktop for dead ends, broken links and placeholder text.

**Complexity and cost.** Medium. Any routing or map provider is the only metered cost, is optional, and is introduced with limits and caching. Its selection is confirmed before use.

**Not touched.** The matching engine's logic, privacy model, payments, booking, bookings, ratings, followers, feeds, realtime, machine learning, external provider ingestion, or a separate graph database.

---

## Open questions (flagging, not blocking)

- A real interactive map and any travel-time routing need a paid mapping service. Slice 1 works without one; confirm before Slice 3 whether to enable it.
- Named trial participants for Birmingham, Bristol and Herefordshire: real invitees, or labelled demonstration people until real ones sign up?
- Who reviews safety reports during the trial?

## Note

The project task list cannot be updated from plan mode; the three slices above will be recorded there as soon as building begins.
