# The Living World — UK & Ireland Investor-Ready Activation

The architecture already exists. This plan activates it across the UK and Ireland. Nothing here is a redesign: every slice extends the existing geography, discovery, matching, journey, connection and design systems.

Portugal and Lisbon stay valid places. They simply stop being the default world.

## Reconciliation — what is actually in the repository today

Working:
- One generic place hierarchy: country, region, county/area, city, town, village, neighbourhood — with parent links, slug, country code, timezone, currency and approximate centre.
- One person model with separate, private-by-default records for capabilities, qualifications, experience, service areas, availability, opportunity preferences and contributions.
- Needs as a first-class thing, covering paid work, help, community projects, volunteering and swaps.
- One deterministic possibility engine that explains every result from stored facts, keeps unknown availability unknown, and shows an honest quiet state when there is nothing real to show. Reciprocal (need→people and person→needs) uses the same rules.
- Explicit connection requests with an immutable context snapshot, participant-only conversations, blocking and reporting.
- Persisted journeys with stops, times, visibility and opportunity opt-in — private unless the owner opts in.
- Hand-drawn map, warm design language, mature line icons, honest freshness labels, source-attributed photo records, neutral avatars, server-side bounded reads with paging.

Partially implemented:
- Journey screen is not wired to the saved-journey records; the arranger is separate.
- Blocking is enforced in connection rules but not consistently before discovery and matching results are shown.
- Reports exist but have no explicit review state or owner.
- Photo records exist for listings, but there is no way for a person to upload their own photograph.
- Discovery matches one exact locality only: no parent/child hierarchy, no radius, no time-window filter applied.

Missing / blocking the UK & Ireland demonstration:
- The live backend contains only Portugal and Lisbon, and zero accounts or content.
- Default place, loading and fallback copy, home and journey copy, the create-a-listing district list, and the give-an-hour example are all Lisbon-specific.
- The map artwork is Lisbon-shaped and positions things by illustrative percentages, not real coordinates.
- No locality selector, so the user cannot choose or change where they are.
- No intent front door, no "My Living World" view, no along-the-journey or roughly-30-minutes discovery.
- No routing source, so travel time cannot be claimed — only honestly labelled approximate distance.

---

## SLICE 1 — UK & Ireland world activation

**User-visible outcome.** Opening the app lands in the UK and Ireland, not Portugal. You choose where you are, anywhere from a neighbourhood up to a country, and move between places and up and down the hierarchy without losing context. Everything on screen follows that choice. Birmingham, Bristol and Herefordshire have coherent demonstration content — city, creative city, rural — and everywhere else is genuinely navigable and honestly quiet. Scotland, Wales, Northern Ireland and Ireland visibly belong to the same world. Lisbon still works.

**Existing architecture reused.** The place hierarchy; the single listing-to-card conversion seam; the server-side world read with its existing context, paging and limits; the map component's existing interface; existing time bands, honesty labels and demonstration policy.

**Files and components affected.** Place helpers (default becomes the UK and Ireland world, fallback copy stops naming Lisbon, add ancestor/descendant resolution and bounded place search); the shared world read (accept a locality plus its child localities, apply the time and radius fields the contract already defines); the world card shape (carry real coordinates, currency and timezone alongside the existing illustrative position); the home screen (locality chooser, UK and Ireland copy, today/tonight/weekend views); create-a-listing and give-an-hour screens (choose a real place instead of the fixed district list); the map component (draw from real coordinates, keeping the existing illustrated treatment); demonstration content relocated and clearly marked.

**Database changes.** Add real places: United Kingdom with England, Scotland, Wales and Northern Ireland; Ireland as a separate country; meaningful regions and counties beneath each; the cities, towns and a modest set of real neighbourhoods needed for navigation, including Birmingham, Bristol and Herefordshire in depth and a credible path through the Republic of Ireland. Add locality identity that tolerates repeated place names across the isles, coordinate sanity checks, and indexes for locality, time and status discovery. Portugal and Lisbon rows untouched.

**Data changes.** Real names, hierarchy, timezone (Europe/London, Europe/Dublin), currency (GBP, EUR) and approximate centres. A small, geographically coherent, clearly-labelled trial set of activity for the three hotspots only.

**UI changes.** Locality selector, hierarchy navigation, UK and Ireland copy throughout, honest quiet states, map fed by real coordinates. No visual redesign.

**Real versus demonstration data.** Geography is real. Activity in the three hotspots is a small trial set, visibly marked as demonstration, isolated from genuine user data and removable. No fabricated towns, coordinates, people, events, photographs, reviews or testimonials. Everywhere else stays honestly empty.

**Security implications.** No change to who can see what. Geography stays publicly readable and service-managed; approximate centres only, never an address or a live position.

**Tests.** Deep hierarchy resolves both directions; repeated place names resolve unambiguously; a city view includes its neighbourhoods; Birmingham, Bristol, Herefordshire, a Scottish, Welsh, Northern Irish and Irish locality each return their own world; Lisbon still works; empty localities read as quiet; demonstration labelling present; map renders on phone and desktop; existing suite and build stay green.

**Dependencies.** None external. No map or routing provider introduced.

**Complexity.** Medium — the geography dataset is the bulk of the work.

**Unlocks.** Every later slice; without a real world there is nothing to demonstrate.

**Not touched.** Matching, Needs, capabilities, connections, conversations, journeys, Life List, design system, authentication, privacy rules.

---

## SLICE 2 — Human possibility to connection

**User-visible outcome.** A person in Birmingham says what they need; a person in Herefordshire says what they can genuinely offer. Each sees explained possibilities — why this person, where they are, what they said they were free for, what has not been checked — and chooses whether to make contact. The recipient sees the context and accepts or declines; a conversation follows. Nothing contacts anyone automatically. Blocked people disappear from everything. You can add a real photograph of yourself, or keep a neutral one.

**Existing architecture reused.** The deterministic possibility engine unchanged as the source of truth; the existing reciprocal path; capabilities, availability, service areas and preferences as modelled; existing connection requests, conversations, blocking and reporting; existing explanation and freshness labels.

**Files and components affected.** Possibility retrieval (use locality hierarchy and stated service areas instead of one exact place, apply time, group candidates efficiently, report when results were cut short); the possibility engine (retire the older ungated travelling shortcut so only explicit journey opt-in can suggest someone); safety filtering applied consistently before results in both directions; the need, help and conversation screens (clearer evidence, quiet states, safety actions); profile (add, replace and remove a photograph, neutral fallback); the capability and availability panel; report submission made explicit.

**Database changes.** A private photo store with owner-only writes and controlled reads; missing account links with proper cleanup on the older capability, service-area, availability, preference and Need tables; an explicit review state for reports; indexes for hierarchy-and-time candidate reads.

**Data changes.** Real trial participants creating their own records. A small number of clearly-labelled demonstration people in the three hotspots so the loop is demonstrable before real sign-ups — always identified as demonstration, never presented as a real named resident, never with an AI-generated face.

**UI changes.** Evidence and freshness made legible; block, report and unblock reachable from conversations and profiles; photograph controls; honest quiet states.

**Security implications.** This is the safety slice. Blocking holds across browsing, matching, invitations, conversations and reciprocal discovery. Private facts stay private; stale availability stops appearing but is distinguished from incapable; regulated categories (childcare, gas, electrical, medical and similar) keep their "nobody has checked this" warning. Photographs are owner-controlled, type- and size-limited, deletable. Reports get a review state and a named person responsible during the trial. No RLS weakened for the sake of the demo.

**Tests.** A full two-account run: sign up, profile, capability, availability, service area, preference, Need, possibilities, contact, accept, decline, reply, block, report, unblock. Blocked-person tests in every direction. Private and stale facts excluded. Regulated warning present. Rural and urban return sensibly different results. Photo upload, replacement, deletion, fallback.

**Dependencies.** Slice 1 (hierarchy and real localities).

**Complexity.** Medium-high — careful work, no new architecture. No AI, no realtime, no notifications platform.

**Unlocks.** The core human loop, and the investor's "I could contact them" moment.

**Not touched.** The map, design system, journeys, Life List, or the deterministic nature and ordering of matching.

---

## SLICE 3 — Journey, discovery and the investor experience

**User-visible outcome.** The front door asks what you want to do — explore around me, find something to do, find somewhere to go, find people, find help, say what I need, offer what I can do, explore a journey — and each resolves into the one existing discovery system. "My Living World" gathers where you are, what you want, what you need, what you can offer, your availability and interests, relevant nearby activity and where you're going, in one quiet place — no feed, no likes, no followers, no ranking. You can build a real journey (Bristol → Birmingham → Manchester, London → Bristol → Herefordshire, or one through Ireland) and see what genuinely lies along it. "What's within about thirty minutes?" works and says plainly whether that is a travel time or a straight-line estimate. The signature moment works end to end: "I have Saturday free and I'm interested in photography" returns explainable possibilities across place, time, interest, people, activities, communities, opportunities and needs.

**Existing architecture reused.** One discovery path with named intents — no second search engine; the persisted journey records and their overlap rules; the pure journey arranger; the same possibility engine and explanations; existing cards, sheets and map.

**Files and components affected.** Home becomes the intent front door; a "My Living World" view assembled from existing data; the journey screen connected to the existing saved-journey functions, with stops, dates, times, visibility and opportunity opt-in; along-the-journey and nearby-in-time discovery added to the existing retrieval; a distance/travel-time helper that labels its own certainty; polish across every screen — dead controls, placeholder copy, broken links, loading, empty and error states, mobile and desktop layout, consistent wording, remaining Lisbon references; unique page information for locality pages that have something real to say.

**Database changes.** Minimal — indexes for journey-stop and time discovery if needed. No new entity model.

**Data changes.** Journey stops drawn from the real place hierarchy. Travel time only if a routing source is genuinely available; otherwise clearly-labelled approximate distance.

**UI changes.** Intent front door, My Living World, journey builder and along-route results, 30-minute view with its honesty label, final polish pass.

**Real versus demonstration data.** Every journey and weekend result traces back to a real record or a labelled trial record. Nothing is invented to fill a gap; empty is shown as empty.

**Security implications.** Journeys stay private unless the owner chooses public and opts into opportunities; a journey never implies availability, employment intent, live location or willingness to meet. If routing is ever enabled, calls stay server-side, behind sign-in, bounded and cached against runaway metered cost.

**Tests.** Each intent resolves to real results or an honest quiet state. Saturday-photography flow in Birmingham, Bristol and Herefordshire. Journey visibility matrix. Along-the-route correctness. Distance-versus-travel-time labelling. Full walkthrough of every screen on phone and desktop for dead ends, broken links and placeholder text. The 23-step investor sequence run start to finish.

**Dependencies.** Slices 1 and 2.

**Complexity.** Medium. Any routing or map provider is optional, is the only metered cost, and is confirmed with you before use.

**Unlocks.** The complete investor walkthrough.

**Not touched.** Matching logic, privacy model, payments, booking, ratings, followers, feeds, realtime, machine learning, external provider ingestion, separate graph database.

---

## Open questions (flagging, not blocking)

- An interactive map and real travel time need a paid mapping service. Slices 1 and 2 need neither; confirm before Slice 3 whether to enable one.
- Demonstration people for the hotspots: real invitees, or clearly-labelled demonstration records until real people sign up?
- Who reviews safety reports during the trial?

## Note

Slices are built one at a time, each approved deliberately. The project task list will be updated with these three slices as soon as building begins (it cannot be edited from plan mode).
