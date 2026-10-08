# Connection Audit — The Living World / Real World Atlas

Read-only. Nothing was edited, deployed, migrated, or written to the database.

## 1. Is this project connected to GitHub?

**Partly — and the important half cannot be confirmed from inside the project.**

Two different GitHub things exist and they are often confused:

```text
A. Git sync (two-way code mirror)   -> lives in editor Git settings, not visible to me
B. GitHub API connector             -> a service account that reads/writes repos on demand
```

**B is real and linked.** A connection called **Matt's GitHub API** (GitHub API connector, one-click authorisation, routed through the connector gateway) is linked to this project. Its credentials are present as project secrets: `GITHUB_API_KEY` and `LOVABLE_API_KEY`.

**But it is currently unusable by you here.** The connection reports *has access: no* for the current user, and a harmless test read (asking for one repository's details) came back with: *"The current user does not have access to this connection."* So no repository can be listed, read or written through it from this session.

**Exact repository owner/name: NOT VERIFIED.** I could not list repositories, so I cannot confirm which repository is the live one. Earlier messages in this thread named `mattleask373-rgb/life-lived-network`, then `mattleask373-rgb/mattleask373-rgb-life-lived-network`, then reversed that call. Treat both as unconfirmed until the access fix below is done and one read succeeds.

**Sync direction: NOT VERIFIED.** The project's own code-storage addresses point only at Lovable's internal git store and an internal backup bucket — there is no GitHub address wired into the project's git configuration. That is normal for Lovable's internal storage and does **not** by itself prove Git sync is off; the sync switch sits in the editor and is simply not readable from here.

**What is genuinely in the code:** a GitHub Actions workflow (`.github/workflows/verify.yml`) that installs dependencies, then runs lint, tests and build on every push and pull request. Its presence proves the *recipe* is ready; it does not prove the repository exists or that the workflow has ever run.

## 2. Is the database enabled, and what can be verified about it?

**Yes — enabled, managed by Lovable Cloud, healthy, and reachable.**

Verified by direct checks, not assumptions:

| Check | Result |
| --- | --- |
| Backend lifecycle | Up, not paused, managed by Lovable Cloud, instance size "Tiny" |
| Sign-in service | Reachable (about 0.2s) |
| Database | Reachable (about 0.4s) |
| Sign-in service to database | Reachable (about 0.5s) |
| Read-only query through the backend | Succeeded |
| Backend data API, public key | Answered normally |
| Published site | Loads (HTTP 200) |
| Preview link | 401 — expected, previews require a session |
| One instance for preview and published app | Confirmed — same backend identity |

Resource headroom, all comfortable: memory 54% used, data disk 14%, database size 12.5 MB, 6 of 60 connections in use, 0 restarts, no resource alerts in the past 48 hours. The write-ahead log (the database's own journalling file) sits at 80 MB — normal, nothing to act on.

**What is actually in there right now:**

| Contents | Rows |
| --- | --- |
| Places (the geography list) | 221 |
| Registered data sources | 2 |
| Accounts | 0 |
| Profiles | 0 |
| Role assignments | 0 |
| Listings | 0 |
| Needs | 0 |
| Hour offers | 0 |
| Connection requests | 0 |
| Reported content | 0 |

The backend is healthy and wired correctly. It is **empty of human content**. Everything visible in the preview comes from development fixtures, which are switched off in production, so the published site honestly shows an empty world.

## 3. Visible warnings and missing setup

| Finding | Why it matters |
| --- | --- |
| **GitHub connector access denied** | Blocks this session and any agent using it from reading the real repository. This is Gate 0 of your own plan. |
| **Repository owner/name unconfirmed** | Agents could be pointed at the wrong (empty) repository and build there. |
| **Git sync status not readable from here** | Direction and freshness of the code mirror cannot be stated as fact. |
| **`.env` is tracked in the code** | The file is listed in `.gitignore` (line 34) but was committed before that rule, so it still ships. It holds the backend address and the *public* key — the publishable key is designed to be public, but the file should still be removed from the repository. |
| **No Ticketmaster key configured** | Only three secrets exist (`GITHUB_API_KEY`, `LOVABLE_API_KEY`, `LOVABLE_CRON_SECRET`). The event-refresh code expects `TICKETMASTER_API_KEY`, so live event imports stay disabled. |
| **Zero accounts** | Sign-in provider settings (for example Google) cannot be confirmed end to end until a first real account exists. |
| **No route, transport or booking provider** | Known and deliberate; nothing to fix now. |

## 4. Exact manual steps for the owner

I cannot perform any of these — they need your account-level authorisation.

**Step 1 — Give the connection to you (fixes "has access: no").**
Open the **Connectors** entry at the root level of the editor sidebar → **GitHub API** → **Matt's GitHub API** → the **permissions** section → add the workspace member who runs this chat. Reconnecting does **not** grant access to other members; only the permissions section does.

**Step 2 — If the credentials themselves are stale, re-authorise.**
Open: https://lovable.dev/dashboard?connectors=&connector=github&workspace=3c1b28012bb975267304
Until you have done this, treat the credentials as unchanged. To create a brand-new connection instead: https://lovable.dev/connectors/github/connect?workspace=3c1b28012bb975267304

**Step 3 — Confirm or start the code mirror.**
In the chat composer click the **+** icon (bottom left) → **GitHub** → **Connect project**, or open **Project settings → Git**. This is where the repository is chosen and where sync direction is shown. This is the only place the owner/name question can be settled definitively.

**Step 4 — Let your outside agents reach the repository.**
On GitHub: **Settings** → **Applications** → find **Grok** or **xAI** → **Configure** → under **Repository access** choose **Only select repositories** and pick the repository confirmed in Step 3 (or **All repositories**) → make sure **Contents** and **Pull Requests** are read and write → **Save**.

**Step 5 — When you have a Ticketmaster key.**
Add it as `TICKETMASTER_API_KEY` in **Project Settings → Secrets**. Never paste it into chat.

**Step 6 — Housekeeping I can do later on request.**
Removing the tracked `.env` from the repository is a code change, so it sits outside this audit. Say the word and I will plan it.

## 5. Verified facts versus assumptions

**Verified by direct tool reads in this session:** backend enabled, healthy, unpaused, one shared live instance; sign-in, database and cross-plane reachability; row counts above; resource headroom figures; no exhaustion alerts; published site responds; preview returns 401; a GitHub API connection exists and is linked to this project; its secrets are present; that connection refuses the current user; only three project secrets exist; `.env` is tracked in git while also listed in `.gitignore`; the verify workflow file exists in the code.

**Assumptions or unknowns, stated as such:** which GitHub repository is authoritative; whether two-way Git sync is on, and in which direction; whether the workflow has ever run; whether the Google sign-in provider is fully configured; whether the connection's underlying token is valid or expired (it was never tested successfully, only denied).

## 6. What becomes possible once Step 1 to Step 3 are done

A single successful repository read settles the owner/name and sync direction, lets outside agents read the real code instead of guessing, and clears the gate so the first real operation can be **audit, reconcile, then plan** rather than building on an assumed architecture. Until then, the database remains the one part of the connection story that is fully verified — healthy, reachable, and waiting for its first real account.
