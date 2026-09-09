# Scout Program Builder — CLAUDE.md

## Project overview

A Next.js app (App Router, TypeScript, no external UI library) for Scout leaders to plan terms, generate AI run sheets, and track member progress. Public-facing as **YouthPath** (youthpath.app) via the landing page at `/`; internal code/branding elsewhere still says "Scout Program Builder." All data is stored in **Supabase**. Login is live via Supabase Auth (email/password + magic link) with auth guards on the core app pages — but data is still scoped by a `groupId` stored in the browser's localStorage, not by the logged-in user's `auth.uid()`, and RLS remains disabled. See "Auth approach" below — this half-migrated state is the biggest source of subtle bugs in the app right now.

## Key pages and routes

| Path | File | Purpose |
|------|------|---------|
| `/` | `app/page.tsx` | Public YouthPath landing page — hero, showcase cards, CTA (see "Landing page" below). Public, no auth guard |
| `/auth` | `app/auth/page.tsx` | Login / signup (Supabase Auth) |
| `/auth/check-email` | `app/auth/check-email/page.tsx` | "Check your email" confirmation after requesting a magic link — a real route, not inline state on `/auth`. Public (no session yet at this point) |
| `/auth/set-password` | `app/auth/set-password/page.tsx` | Set/change password — magic-link sign-in redirects here (`?mode` absent, "Welcome!" copy); `UserMenu`'s "Change password" links here with `?mode=change` (different copy, stays on page with a success message instead of redirecting to `/term`). Requires a logged-in session (`updateUser` needs one); redirects to `/auth` if none |
| `/setup` | `app/setup/page.tsx` | Group config (name, section, day, time, leaders, members) |
| `/term` | `app/term/page.tsx` | Term planner — date grid, per-row edit form, AI theme generation |
| `/runsheet` | `app/runsheet/page.tsx` | AI-generated run sheet for a single session |
| `/runsheets` | `app/runsheets/page.tsx` | List of all saved run sheets |
| `/members` | `app/members/page.tsx` | Member list, attendance grid, OAS tracker, SIA log, milestones |

### API routes

| Route | Purpose |
|-------|---------|
| `app/api/generate-term/route.ts` | AI topic suggestions for the term plan |
| `app/api/generate-runsheet/route.ts` | AI run sheet generation (GPT-4o, 4000 tokens) |
| `app/api/generate-activity/route.ts` | AI individual activity generation |

## Landing page (`/`, `app/page.tsx`)

Public marketing page for **YouthPath** — hero ("Plan. Track. Develop your youth group."), three showcase cards built as faithful mini-replicas of the real UI (exact colours/classes pulled from `/term`, `/runsheet`, `/members`, not approximations — e.g. the term-planner card's gold header/table and tan rows match the real app exactly), a "How it works" section, a "Who it's for" section (Joeys/Cubs/Scouts/Venturers, colours local to this component — see below), and a sign-up CTA. Nav and hero CTAs swap between "Sign up free / Login" and "Go to dashboard" + `UserMenu` based on `useAuth()`.

- The "Who it's for" card colours are a **local `WHO_COLOURS` map inside `app/page.tsx`**, not `SECTION_COLOURS` from `lib/colours.ts` — they're intentionally more vibrant than the app-wide palette (e.g. Venturers `#AA2A33` here vs `#B5485E` in `lib/colours.ts`). Changing one does not affect the other; don't assume they're the same source.
- `app/auth/page.tsx` reads `?mode=signup` from the URL (via `window.location.search`, not `useSearchParams`, to avoid a Suspense-boundary requirement) to pre-select the signup tab when linked from the landing page's CTAs.
- Legal pages (`app/privacy/page.tsx`, `app/terms/page.tsx`, `app/childsafety/page.tsx`) all list a real contact address, `youthpathapp@gmail.com` — `app/terms/page.tsx` had no contact section before this and one was added to match the other two.
- `components/Footer.tsx` (rendered on every page via `layout.tsx`) and the site `<title>`/description in `layout.tsx` say "YouthPath," but page-internal branding elsewhere (nav bar titles on `/setup`, `/term`, etc.) still says "Scout Program Builder" — this is a deliberate partial rebrand, not an inconsistency to "fix" without being asked.

## Shared library files

| File | Purpose |
|------|---------|
| `lib/types.ts` | All shared TypeScript interfaces |
| `lib/colours.ts` | Section colour palette (`SECTION_COLOURS`, `NAVY`) |
| `lib/supabase.ts` | Singleton Supabase client — `createBrowserClient` from `@supabase/ssr` (not plain `createClient`), so the session JWT is attached to every request |
| `lib/db.ts` | All Supabase query functions (groups, term_rows, terms, members, run_sheets) |
| `lib/auth-context.tsx` | `AuthProvider` + `useAuth()` hook — wraps app in `layout.tsx`; exposes `signIn`, `signUp`, `sendMagicLink`, `signOut` |
| `lib/runsheetGen.ts` | `generateRunSheet()` — shared AI call used by both the `/term` "Create" button and `/runsheet`'s "Regenerate" (with optional free-text `instructions`) |
| `components/UserMenu.tsx` | Nav-bar auth widget — a single dropdown trigger (email text above 640px, avatar circle below) opening a menu with "Change password" (→ `/auth/set-password?mode=change`) and "Log out" |

## Shared types (`lib/types.ts`)

- **`GroupConfig`** — groupName, section, meetingDay, meetingTime, leaders `string[]`, members `string[]`
- **`TermRow`** — id, date, time, topic, location, oasFocus, sessionNotes, bring, leader, assistantPatrol, consentRequired, rowType
- **`ActivityRow`** — id, time, name, detail, oasTag, hasRecipe, optional
- **`Member`** — id, firstName, lastName, age, yearJoined, attendance, oas, sia, milestoneActivities, milestonesAwarded, peakAwarded
- **`RunSheetData`** — tagline, challengeAreas, plan, activities, review, participate, assist, lead, itemsRequired
- **`SavedRunSheet`** — `{ data: RunSheetData; row: TermRow; config: GroupConfig }`

## Supabase schema

| Table | Key columns | Notes |
|-------|------------|-------|
| `groups` | id, user_id, group_name, section, meeting_day, meeting_time, leaders[], members[] | One row per user |
| `terms` | id, group_id, term_name, start_date, end_date, is_active, created_at | No FK on `group_id` (unlike the tables below); at most one row per group should have `is_active = true`, enforced only in application code, not a DB constraint |
| `term_rows` | id, user_id, group_id, term_id, date, time, topic, location, oas_focus, session_notes, bring, leader, assistant_patrol, consent_required, row_type, sort_order | FK → groups; FK `term_id` → terms. Every row belongs to exactly one term — this is how multiple term plans coexist without one overwriting another |
| `members` | id, user_id, group_id, first_name, last_name, age, year_joined, attendance (jsonb), oas (jsonb), sia (jsonb), milestone_activities (jsonb), milestones_awarded[], peak_awarded | FK → groups |
| `run_sheets` | id, user_id, group_id, term_row_id (nullable), data (jsonb) | FK → groups; term_row_id nullable for quick-create sheets. No direct `term_id` — a run sheet's term is derived transitively via `term_row_id → term_rows.term_id` |
| `saved_plans` | id, group_id, term_name, saved_at, plan_json (jsonb) | **Unused / superseded** by the `terms` table above. Was a short-lived JSON-blob approach to multiple terms; nothing reads or writes it anymore. Safe to drop, not yet done |

Nominally RLS should be `auth.uid() = user_id` on SELECT/INSERT/UPDATE/DELETE for every table — see "Supabase schema — current state" below for what's actually configured today (RLS is disabled).

## `lib/db.ts` — query function reference

```
// Groups
loadGroupRecord(userId)               → GroupRecord | null
saveGroupConfig(userId, groupId, cfg) → string (groupId)

// Term rows (all scoped to a specific term — see Terms below)
loadTermRows(userId, termId)                          → TermRow[]
upsertTermRows(userId, groupId, termId, rows)         → void   (upsert by id)
replaceTermRows(userId, groupId, termId, rows)        → void   (delete this term's rows + insert; queued per group+term to avoid interleaving)
deleteTermRow(userId, rowId)                          → void

// Terms — multiple term plans per group, exactly one active at a time
getActiveTerm(groupId)                                → TermEntry | null
loadTerms(groupId)                                    → TermEntry[]   (newest first)
createTerm(groupId, termName, startDate, endDate)     → string | null (new term id; deactivates all others for the group first)
setActiveTerm(groupId, termId)                        → void          (flips is_active; does not touch any term_rows)
updateTermMeta(termId, termName, startDate, endDate)  → void          (keeps a term's label in sync — see Data flow rules)

// Members
loadMembers(userId)                           → Member[]
upsertMembers(userId, groupId, members)       → void
deleteMemberById(userId, memberId)            → void

// Run sheets
loadRunSheets(userId)                         → RunSheetEntry[]
loadRunSheetByTermRowId(userId, termRowId)    → { dbId, entry } | null
loadRunSheetById(dbId)                        → SavedRunSheet | null
saveRunSheet(userId, groupId, termRowId, sheet, existingDbId?) → string (dbId)
```

## localStorage — current keys in use

| Key | Type | Written by | Notes |
|-----|------|-----------|-------|
| `runSheetSource` | `{ row, config, isTermRow?, runSheetDbId? }` JSON | `/term` "Create" button; `/runsheets` "View" button | Navigation state only |
| `groupId` | `string` (UUID) | `lib/db.ts saveGroupConfig` on first insert | Supabase `groups.id` — used by all db queries instead of `user_id` |
| `programRows` | `TermRow[]` JSON | `/term` `handleUpload` | Backup written on JSON file upload; read as fallback if Supabase returns nothing |
| `groupConfig` | `GroupConfig` JSON | `/term` `handleUpload` | Same backup/fallback pattern as `programRows` |
| `termName` | `string` | `/term` `handleUpload` | Supabase doesn't store termName; localStorage is the only store |
| `members` | `Member[]` JSON | `lib/db.ts` `loadMembers`/`upsertMembers`/`deleteMemberById` | Read-through cache of the `members` table; written on every successful Supabase read/write, read as fallback when Supabase errors |
| `runsheets` | `Record<rowId, RunSheetEntry>` JSON | `lib/db.ts` `saveRunSheet`/`loadRunSheets` | **Primary store for run sheets** (temporary, until Supabase auth/save is confirmed reliable in production). Keyed by `SavedRunSheet.row.id`. `saveRunSheet` always writes here even if the Supabase write fails/throws, and never rejects — the Supabase `dbId` is used as the cache's `dbId` when the write succeeds, otherwise `sheet.row.id` is used as a local-only id. `loadRunSheets` returns the cache and only adds Supabase rows for sessions not already cached locally (cache wins on conflict). `/runsheet` checks this cache (via `getCachedRunSheetByRowId`) before falling back to a Supabase lookup. |

## Supabase schema — current state (as of 2026-09-08)

- Tables: `groups`, `term_rows`, `terms`, `members`, `run_sheets`, `saved_plans` (unused, see schema table above)
- **RLS is still disabled** on every table (`ALTER TABLE x DISABLE ROW LEVEL SECURITY`) — auth login now exists (see below) but RLS re-enabling hasn't happened yet
- **`user_id` is nullable** on the tables that have it (`ALTER COLUMN user_id DROP NOT NULL`) — `lib/db.ts` still doesn't write it; all filtering is by `group_id` (and now also `term_id` for term_rows)
- Grant `ALL` on all tables to `anon, authenticated` roles has been applied, including `terms`

## Auth approach — current (login is live; group identity is not yet tied to it)

Two things that sound like they should be the same are currently separate, and that gap is the app's main known weak point:

- **Login/session — done.** Supabase Auth is live: email/password sign in/up and a magic-link option, via `lib/auth-context.tsx` (`signIn`, `signUp`, `sendMagicLink`, `updatePassword`, `signOut`). `lib/supabase.ts` uses `createBrowserClient` from `@supabase/ssr`, so the session JWT is sent with every request. Auth guards (redirect to `/auth` if `!user`) are wired on `/setup`, `/term`, `/members`, `/runsheet`, `/runsheets`, `/events/[id]`, `/auth/set-password`. `/`, `/help`, `/privacy`, `/terms`, and `/childsafety` are intentionally public — do not add a guard to those.
- **Requesting a magic link navigates to `/auth/check-email`** (a distinct route, not an inline "sent" state on `/auth`) — this way pressing Back from there returns wherever the user came from rather than sitting on a URL that could look like a logged-in state. `sendMagicLink`'s `emailRedirectTo` points at `/auth/set-password`, so clicking the emailed link lands there directly.
- **Server-side session re-verification — `proxy.ts`** (project root; Next 16 renamed the `middleware.ts` convention to `proxy.ts`, exporting a `proxy()` function instead of `middleware()`). Runs on every request to a protected path (mirrors the list above) and calls `supabase.auth.getUser()` — which revalidates the JWT against the Supabase Auth server, unlike the client-side `useAuth()` `user` object, which is only a locally cached value updated by `onAuthStateChange`. This is what actually re-checks the session on each navigation, not just at a page's initial mount; the client-side guards in each page.tsx remain as a second layer (and the only thing gating the UI when Supabase env vars are absent, since `proxy.ts` no-ops in that case). Depends on `createBrowserClient` always persisting the session in cookies (not localStorage) — do not swap `lib/supabase.ts` to a plain `createClient` or a custom `auth.storage`, or `proxy.ts` loses visibility into the session entirely.
- **Data identity — NOT done.** `lib/db.ts` still scopes every query by `localStorage.getItem('groupId')`, never by `auth.uid()`. Being logged in only gates *access to the pages*; it does not scope *which group's data* you see — that's still whatever group the browser's localStorage happens to point at. If localStorage gets cleared (e.g. the user clears cookies/site data), the app silently creates a brand-new empty group on next Setup save instead of finding the real one — this has already caused real confusion once (a duplicate "1st Bayview Sea Scouts" group). This is the next-session priority — see the Phase 5 checklist.
- Do NOT assume `auth.uid()`-based scoping works anywhere in `lib/db.ts` yet — it doesn't. Migrating this is exactly the unchecked work in Phase 5 below.

## Supabase failure handling (all `lib/db.ts` functions)

- Every exported function in `lib/db.ts` wraps its Supabase calls in try/catch — if the client is unreachable (or `supabase` itself is `null`, e.g. missing `NEXT_PUBLIC_SUPABASE_*` env vars), reads return a safe empty default (`null`/`[]`) instead of throwing, and writes log the error instead of throwing (except `saveGroupConfig`, which still throws a clean `Error` since its callers already catch it and need to know the save failed).
- This matters because several pages (`/term`, `/members`, `/runsheets`) call multiple `lib/db.ts` loaders via `Promise.all` in their initial-load `useEffect`, with no try/catch of their own and `setDbLoading(false)` only reached after the `Promise.all` resolves. An unguarded throw from any one of those calls leaves `dbLoading` stuck `true` forever — the page renders `null` forever (a white screen), not a visible error. Any new `lib/db.ts` function follows this same guard pattern so it's safe to add to those `Promise.all` calls.
- `members` and `runsheets` also have a real localStorage cache (see the localStorage table above) that these guards fall back to; `groups`/`term_rows` currently just fall back to an empty result — `/term` and `/setup` separately maintain their own `groupConfig`/`programRows` localStorage backups and read them when the Supabase result comes back empty.

## Auth pattern — protected pages

Guarded pages (`/setup`, `/term`, `/members`, `/runsheet`, `/runsheets`, `/events/[id]`) follow this pattern. Note the `lib/db.ts` calls take an empty string, not `user.id` — see "Auth approach" above for why: the `userId` param exists for a future migration but is currently ignored, and scoping is by `localStorage.groupId`.

```typescript
const { user, loading: authLoading } = useAuth();

useEffect(() => {
  if (authLoading) return;
  if (!user) { router.push('/auth'); return; }
  async function load() {
    const grp = await loadGroupRecord('');
    // ... load other data ...
    setDbLoading(false);
  }
  load();
}, [user, authLoading, router]);

if (authLoading || dbLoading) return null;
```

## Term switching (multiple term plans)

A group can have any number of terms (`terms` table), exactly one of which is `is_active`. `/term`'s initial load resolves the active term for the group via `getActiveTerm(groupId)` — auto-creating one via `createTerm` if none exists yet (e.g. a brand-new group) — then loads that term's rows with `loadTermRows('', activeTerm.id)`. Every subsequent read/write on that page (`saveRows`, `buildDates`, the JSON-upload handler) is scoped to `activeTermId`.

- **"+ New term"** (toolbar) prompts for a name, calls `createTerm` (which deactivates every other term for the group first, then inserts the new one active), and resets the page's local state (rows, dates, name) to blank. It does **not** touch the previous term's rows — they simply stop being the active one.
- **"My terms" dropdown** (toolbar) lists `loadTerms(groupId)` with a "Current" badge on whichever matches `activeTermId`. Clicking a different one calls `setActiveTerm` then re-loads that term's rows — no data is copied, deleted, or archived; it's purely a change of which `term_id` the page is reading/writing.
- **Term name/dates staying in sync**: renaming the term (the Term name field), changing its dates, `buildDates`, and the JSON upload path all call `updateTermMeta(activeTermId, ...)` on blur/save so the `terms` table row (and therefore the "My terms" label) reflects what's actually on the page. **This is easy to forget when adding a new way to change the term name or dates — without this call, the change is local-only and the term reverts to its old label the next time anyone looks at "My terms."**
- **Run sheets are scoped to the active term transitively**, not via a direct column: `/runsheets` resolves the active term's row ids and only shows a `run_sheets` row if its `term_row_id` is in that set. A run sheet with a `null` term_row_id (from the old quick-create flow) is **excluded**, not shown-everywhere — it belongs to no term, so it belongs to no term's list either.
- `replaceTermRows` is now queued per `${groupId}:${termId}` (not just `groupId`), and its "detach linked run sheets before delete" step only touches run sheets whose `term_row_id` belongs to rows in *that* term — replacing one term's rows never nulls out another term's run sheet links (this was a real bug during development: the old group-wide detach was breaking run sheet links on every term switch).
- The old `saved_plans`-based "New term" (save current as a JSON blob, wipe `term_rows`, restore later) is fully superseded and no longer used — see the `saved_plans` schema-table note.

## Data flow rules (important)

- **`config.members`** (plain `string[]`) = names entered on the setup page. Used for dropdowns in the term plan.
- **`members` table** (full `Member[]` objects) = members added through the Members tab. Has attendance, OAS, SIA, milestones.
- These are two separate stores. The term plan edit form merges both for dropdowns: `config.leaders + config.members + memberNames` (deduped, trimmed).
- **Member seeding on setup save**: `app/setup/page.tsx` `save()` seeds `config.members` names into the members table. For each name, split on the first space (`firstName` = text before, `lastName` = remainder, or `''` if no space) and skip it if a member with that exact trimmed full name already exists (case-sensitive). New members get empty `attendance`/`oas`/`sia`/`milestoneActivities`/`milestonesAwarded`, `peakAwarded: false`, `age: 0`, `yearJoined` = current year. This does not overwrite or delete existing members — it only adds ones not already present.
- **Delete vs upsert**: `upsertMembers` cannot handle deletions. `deleteMember` calls `deleteMemberById` directly then updates state — does NOT go through `saveMembers`.
- **`replaceTermRows`** (delete the active term's rows + insert) is used by `buildDates` to handle regenerating dates cleanly. `upsertTermRows` is used for incremental saves. Both are scoped to `(groupId, termId)`, never the whole group.
- **`term_row_id` nullability**: run sheets get `term_row_id = source.row.id`. The old "quick-create" path (a run sheet with no term row at all, `term_row_id = null`) was removed when run sheet generation moved onto the `/term` "Create" button (see Run sheet flow below) — every run sheet is now tied to a real session. Older `null` rows from before that change can still exist; they're excluded from `/runsheets`' per-term list (see "Term switching" above), not shown under every term.

## Term plan edit form — leader fields

- **Leader** dropdown: deduped union of `config.leaders`, `config.members`, `memberNames` (from Members tab).
- **Asst. patrol leader**: multi-select checkbox list using the same deduped list. Stores selected names as a comma-separated string in `row.assistantPatrol`. Uses `e.target.checked` in onChange and `setEditDraft(d => ...)` updater to avoid stale closure bugs.
- Deduplication: all names are `.trim()`-ed before passing to `new Set()` to handle trailing spaces from `firstName + ' ' + lastName` construction.

## Members tab — inline edit

Each member row has an "✏ Edit" button (next to View/Delete) that opens an inline form directly below the row — First name, Last name, Age, Year joined — styled with the same `.add-form`/`.add-grid`/`.af-*` classes as the "Add member" form. Explicit Save/Cancel buttons only, no blur-autosave: combining both was tried and is broken (clicking Cancel blurs the focused input first, auto-saving before the Cancel handler runs, so the "cancelled" edit silently persists anyway). This is separate from OAS/SIA/milestone tracking, which remain in the full profile view.

## Members tab — milestone tracking

- **Participate** is auto-counted from the attendance grid (sessions attended). It is NOT a manual log type.
- The "Log Activity" form only has **Assist** and **Lead** as type options.
- `calcMilestoneProgress()` reads attendance for the participate count, and `milestoneActivities[]` for assist/lead counts.

## Members tab — SIA entries

- SIA entries are fully editable: each item has an **Edit** button that opens an inline form (same fields as "Add project" — category, project name, status, notes, date completed) pre-filled from the entry, saved in place via `saveEditSIA`.
- `dateCompleted` is a manual `<input type="date">` on both the add and edit forms — it is never auto-set when status is changed to `complete`. Stored as `YYYY-MM-DD`; `formatSIADate()` renders it as `en-AU` for display and falls back to the raw string for older entries stored as locale-formatted text.
- Delete button on an SIA entry is labelled "Delete" (plain text, not an emoji — emoji glyphs render unreliably as tofu/"II" in some environments).

## Run sheet flow

`/runsheet` **never shows a "generate" screen** — it only ever displays an existing run sheet, or a "No run sheet found" fallback linking back to `/term`. All generation now happens on `/term`'s "Create" button:

1. `createRunSheet(row)` in `app/term/page.tsx` first checks `getCachedRunSheetByRowId` (localStorage), then `loadRunSheetByTermRowId` (Supabase) — if either finds an existing sheet, it navigates straight to `/runsheet`, no AI call.
2. Otherwise it calls `generateRunSheet` (`lib/runsheetGen.ts`, shared with Regenerate), shows "⏳ Generating…" on that row's button, saves the result via `saveRunSheet`, then navigates.
3. On failure, a small inline error shows under that row's button; nothing navigates.

On `/runsheet`, the toolbar's "↺ Regenerate" opens a small panel with an optional free-text instructions box (e.g. "make it more water-based, shorten to 45 minutes") before calling `generateRunSheet` again — blank input regenerates from scratch.

## Run sheet API (`generate-runsheet/route.ts`)

- Model: `gpt-4o`, `max_tokens: 4000`, `response_format: json_object`
- `sessionNotes` from the term row is injected into the prompt as `\nLeader notes: <text>` after the OAS Focus line (omitted when empty).
- Optional `instructions` (string, from the Regenerate panel above) is appended to the prompt as an "IMPORTANT — the leader has requested these specific changes" instruction when present.
- Return shape always includes fallback empty values for all fields: `tagline` (`''`), `challengeAreas`, `plan`, `activities`, `review`, `participate`, `assist`, `lead`, `itemsRequired` (all `[]`).

## Known bugs — open (as of 2026-09-08)

- **Group identity is still `localStorage.groupId`, not `user_id`.** Login gates page access but doesn't scope data to the logged-in user — the app operates on whatever group the browser's localStorage happens to point at. A cleared/reset localStorage silently creates a fresh empty group on next Setup save instead of finding the user's real one (already caused a real duplicate-group incident). **Next session priority** — see Phase 5 below.
- **Run sheets save to localStorage first, Supabase second, and never surface a failure.** `saveRunSheet` always writes to localStorage even if the Supabase write throws, and doesn't reject either way (see the `runsheets` row in the localStorage table). If the Supabase write silently fails and localStorage is later cleared, that run sheet is gone with no error ever having been shown. **Next session priority** — make Supabase the authoritative write, localStorage a true cache.

## Known bugs fixed (2026-06-27)

- **Script tag React error** — `app/setup/page.tsx` and `app/term/page.tsx` both had `<script dangerouslySetInnerHTML>` blocks for tooltip click handling. React rejects `<script>` tags in JSX. Fixed by replacing both with a `useEffect` that attaches a `click` listener on `document` and cleans it up on unmount.
- **Fragment key warning** — `app/term/page.tsx` `.map()` used `<>` shorthand, which can't take a `key` prop. Fixed by importing `Fragment` from `"react"` and using `<Fragment key={row.id}>`.

---

## Roadmap

### ✅ Phase 1 — Local MVP (complete)

- [x] Group setup page (section, leaders, members, meeting schedule)
- [x] Term planner with date generation, per-row editing, column toggles
- [x] AI theme/topic suggestions for the term
- [x] Run sheet generation with GPT-4o (activities, OAS tags, recipes)
- [x] Leader notes (`sessionNotes`) passed to run sheet AI prompt
- [x] Members tab — attendance grid, OAS tracker (11 streams × 5 stages), SIA log, milestone tracker
- [x] Milestone tracking: participate auto-counted from attendance; manual log only for Assist and Lead
- [x] Leader dropdown in term edit form (config.leaders + config.members + memberNames)
- [x] Asst. patrol leader multi-select checkbox list (comma-separated, deduped, trimmed)
- [x] No member seeding from setup page — Members tab is the source of truth
- [x] Save/load term plan as JSON file (includes members snapshot)

### ✅ Phase 2 — Supabase database (complete)

- [x] Supabase project setup and environment variables (`.env.local`)
- [x] DB schema: `groups`, `term_rows`, `members`, `run_sheets` tables with RLS
- [x] `lib/supabase.ts` — singleton client
- [x] `lib/db.ts` — full query layer (load/save/delete for all tables)
- [x] `lib/auth-context.tsx` — `AuthProvider` + `useAuth()` hook
- [x] `app/auth/page.tsx` — login/signup page
- [x] `app/layout.tsx` — wrapped with `AuthProvider`
- [x] Migrate `app/setup/page.tsx` → Supabase
- [x] Migrate `app/term/page.tsx` → Supabase
- [x] Migrate `app/members/page.tsx` → Supabase
- [x] Migrate `app/runsheet/page.tsx` → Supabase (debounced auto-save)
- [x] Migrate `app/runsheets/page.tsx` → Supabase

### Phase 3 — Sharing and multi-device

- [ ] Share term plan via link
- [ ] Multiple leaders per group
- [ ] Parent-facing view (read-only session info)

### ✅ Phase 4 — Landing page, login, and multiple term plans (complete, 2026-09-08)

- [x] YouthPath public landing page at `/` — hero, three showcase cards matching the real UI, "Who it's for," sign-up CTA
- [x] Supabase Auth login (email/password + magic link) via `createBrowserClient` and `lib/auth-context.tsx`
- [x] Auth guards on `/setup`, `/term`, `/members`, `/runsheet`, `/runsheets`, `/events/[id]` — `/`, `/help`, and the legal pages stay public
- [x] `UserMenu` nav widget, responsive (avatar + dropdown below 640px)
- [x] Contact email (`youthpathapp@gmail.com`) on `/privacy`, `/terms`, `/childsafety`
- [x] Inline member-details edit (First/Last/Age/Year joined) on `/members`
- [x] Multiple term plans — `terms` table, `term_id` on `term_rows`, "+ New term" / "My terms" switcher, run sheets scoped to the active term
- [x] Run sheet generation moved onto `/term`'s "Create" button (immediate, with a per-row spinner); `/runsheet` no longer has a "generate" screen; Regenerate supports optional free-text instructions

### Phase 5 — Auth (deferred from Phase 2; partially done — see "Auth approach" and "Known bugs — open" above)

- [x] Re-enable Supabase Auth with `@supabase/ssr` and `createBrowserClient`
- [ ] Re-enable RLS on all tables with proper `auth.uid() = user_id` policies
- [ ] Migrate `group_id` identity from localStorage to `user_id` per-user scoping — **next session priority**
- [ ] Add `WITH CHECK` INSERT policy on `groups` table
- [ ] Make run sheet saves Supabase-authoritative instead of localStorage-first (see "Known bugs — open") — **next session priority**
