# Real World Atlas — Product Vision and Experience Audit

Read-only. Nothing edited, deployed or migrated. The earlier backend-switch and executor plan is still valid and will be restored as its own plan after this one.

**Evidence limits:** I read route files, the menu, fonts and tokens. I did **not** view the running app, take screenshots, or test signed-in states. Anything about how a page looks or feels on a phone is a guess until a screenshot pass (step 1 of the first slice).

## 1. Executive readout
1. **The product calls itself two different names.** The site title in `src/routes/__root.tsx` says "The Living World — a real-life network"; the constitution says Real World Atlas. People can't trust a product that can't decide its own name.
2. **The core works and is honest.** `findSupply()` in `src/lib/supply-engine.ts` is the only discovery engine. Provenance, freshness, fixtures being off in production, and honest empty states are built in at the code level.
3. **The world is empty.** Last check: 221 places, 0 people, 0 listings, 0 needs. Every first visit is a "quiet locality". So the empty state *is* the first impression, and it should be the most polished screen we have.
4. **The menu follows how the system is built, not what people want to do.** The "Find" door holds give, help, earn and conversations: four different intentions plus a messages inbox. Profile, place pages, Sources and Moderation aren't in the menu.
5. **The biggest opportunity:** be the place where a quiet neighbourhood becomes useful because people add real things to it. Contributing is the product, not a fallback.

## 2. Constitution in eight lines
1. Real or nothing. Unknown is an answer.
2. Place first: every possibility belongs to somewhere.
3. One path to discovery, explained in plain words.
4. Show where it came from, how fresh it is, and who vouches for it.
5. Success means going out and doing something, not more time scrolling.
6. Being able to do something doesn't mean you're willing or free to.
7. AI suggests and explains; people decide.
8. Quiet is respectable. A sparse place still gives you a next step.

## 3. Route inventory (from code)
| Route | Purpose | In menu | Status |
|---|---|---|---|
| `/` (339 lines) | Map + what's around you | Explore | Shipped. Has empty/loading states |
| `/$country/$place` | Locality page (SEO) | No | Shipped. Generic fallback title "Somewhere" |
| `/make` | Add a listing | Explore | Shipped. Its title is an empty string (bug) |
| `/life-list` | Saved items | Explore | Shipped, small |
| `/need`, `/need/$id` | Post and view needs | Find | Shipped |
| `/give` | "I have an hour" | Find | Shipped |
| `/help` | Your capabilities | Find | Shipped. Label "What you can do" overlaps `/give` |
| `/earn` | Paid needs + skill gaps | Find | Partial. Training, business and housing marked coming soon |
| `/conversations` | Connection requests | Find | Shipped. This is an inbox, not a "find" action |
| `/road-trip`, `/journey` | Routes and longer stays | Journey | Partial. No route or transport provider |
| `/profile` | Profile, photo, preferences | No (header) | Shipped |
| `/auth` | Sign in, resend confirmation | Header | Shipped |
| `/sources` | Data provenance | No | Shipped. Supports trust |
| `/moderation` | Review reports | No | Reviewers only (correct) |

No agent or AI-control screen is exposed to users. That's right; keep it that way.

## 4. Thesis and audience
**Thesis:** *A map of what you can actually do here, with the people who can do it with you.*
**Why it exists:** feeds show you what other people did; Atlas helps you do something yourself, nearby, this week.
**Beachhead (my assumption):** one UK town or city district. Start with people who have time and skills to offer and neighbours with small practical needs. The `/give` "I have an hour" and `/need` paths already serve this.
**How it differs:** maps show places, not people. Marketplaces show transactions, not reciprocity. Social apps reward attention. Atlas rewards things that actually happened.
**Value loop:**
```text
intention -> grounded possibility (or honest none + contribute) -> connect
-> do it -> mark it happened -> place gets denser -> next person finds more
```
**Do not build:** infinite feeds, follower counts, likes, streaks, AI-generated listings, "people near you" without consent, or estimated earnings.

## 5. Proposed navigation
```text
Primary (bottom bar on mobile, top bar on desktop):
  Explore (map)   Ask or offer   Messages   You
Contextual: Add something real (on the map and in empty states), Save
Under "Ask or offer": I need help / I have an hour / Paid work / What I can do
Under You: profile, life list, capabilities, availability, settings
Footer: Where our data comes from (/sources), How trust works
Secondary entry: Plan a trip (road trip + longer stay)
Hidden: moderation (reviewers only)
```
This moves Conversations out of "Find", and combines `/help` and `/give` under one heading so people stop wondering which one is theirs.

## 6. Key journeys (smallest fix, success measure)
1. **First visit:** see your place, an honest count of what's verified, and one action. Fix: first-visit band on `/`. Measure: time to first real possibility, or to a contribute action.
2. **Set your intent:** one question at a time, nothing saved until you consent. Measure: completion without abandonment.
3. **Search with no results:** explain why, suggest nearby places, offer "post this as a need". Measure: share of zero-result searches that end in a next step.
4. **Connect:** show the trust chip (source, freshness, verified or not) before the request button. Measure: connections that get accepted and aren't reported.
5. **Offer, ask or earn:** one form per intention, and the result appears on the map. Measure: posts that get a response.
6. **After the real thing happens:** a "Did it happen?" prompt in Messages, with private notes only. Measure: follow-through rate.
7. **AI help:** a "Why am I seeing this?" panel on every suggestion, plus "not for me". Measure: correction rate, and trust reported in surveys.

## 7. Visual direction
**Metaphor:** a well-loved field notebook laid over an ordnance map. Warm paper, ink, and pins that mean something.
- Keep the fonts: Fraunces for headings, Karla for body text. They're already distinctive.
- Colour has jobs: `--surface-paper`, `--ink`, `--ink-muted`; layer colours (already in `layer-colour.ts`) are used only on pins and chips; trust has its own states (`--trust-verified`, `--trust-community`, `--trust-suggested`, `--trust-unknown`), each shown with an icon and a word, never colour alone.
- Feeling alive without fake data: show real freshness ("checked 2 days ago"), a slow pulse on the "you are here" pin, and hand-drawn empty-state illustrations of the place.
- Map: low-contrast base. A quiet place shows a large "be the first" card; a busy place groups pins into clusters by band.
- Primitives to build or keep: TrustChip, PlaceHeader, PossibilityCard (reuse `entry-card`), EmptyPlace (extend `data-state`), WhyPanel, BottomNav. Keep the shadcn components; no second design system.
- Accessibility: tap targets of 44px or more, visible focus rings, `prefers-reduced-motion`, a list alternative to the map, and screen-reader labels on pins.

## 8. Page-by-page
- `/` **Redesign the first view only.** Place header, honest counts, map, list toggle, contribute card.
- `/$country/$place` **Keep.** Share the same header and empty-place pattern as `/`.
- `/make` **Keep.** Fix the empty title; open it from empty states.
- `/need`, `/give`, `/help`, `/earn` **Merge under "Ask or offer"** with four clear tabs. Keep the routes.
- `/conversations` **Move** into Messages and add a "did it happen" step.
- `/road-trip`, `/journey` **Simplify** into one "Plan a trip" entry; label partial parts honestly.
- `/life-list` **Move** under You.
- `/profile` **Keep**; add a trust summary and show what is visible to whom.
- `/sources` **Keep**; link it from every TrustChip.
- `/moderation` **Keep hidden.**

## 9. AI model
- AI can rephrase your intention, explain why `findSupply()` returned something, and draft a need or offer for you to edit.
- AI cannot invent supply, rank results on its own, guess your skills, or contact anyone for you.
- Every suggestion carries a label (Suggested), its sources, and buttons to edit or dismiss. Nothing is saved without your tap.
- Agents behind the scenes (ingestion, moderation triage) show up only as provenance, never as a control panel.

## 10. Roadmap
- **Now:** pick one name; first-visit and empty-place experience; fix the `/make` and place-page titles; TrustChip; mobile bottom navigation.
- **Next:** "Ask or offer" hub; Messages with a follow-through step; a "Why this" panel without AI (plain rule explanations).
- **Later:** AI drafting; launching locality by locality with invited local hosts; training and housing pathways once there are real providers.
- **Not now:** feeds, followers, vector search, autonomous agents, payments.

## 11. First slice: first visit on `/`
**Changes:** a place header (place name, honest counts per layer by verification state, freshness), a single main action that changes with how busy the place is (quiet: "Add something real" or "Post a need"; busy: "See what's on"), a list/map toggle, and TrustChip on cards.
**Stays the same:** `findSupply()`, locality contracts, pin placement, fixture policy, data.
**Files:** `src/routes/index.tsx`, `src/components/whats-here.tsx`, `src/components/data-state.tsx`, `src/components/entry-card.tsx`, new `src/components/trust-chip.tsx`, tokens in `src/styles.css`.
**Done when:** zero, few and many results each render correctly; no fake counts; on a 375px screen the main action is visible without scrolling; keyboard users can reach the list toggle; trust is announced as text.
**Tests:** a unit test that the TrustChip state comes from provenance; density mode switching; screenshot pass at 375px and 1280px before and after.
On approval, I'll add this audit and the slice to roadmap.md.

## 12. Decisions needed
1. **Name:** Real World Atlas or The Living World? (I'd go with Real World Atlas.)
2. **Beachhead locality:** which town or district? (I'll assume Birmingham, from earlier work.)
3. **Approve first slice** as described, or choose the "Ask or offer" hub instead.
