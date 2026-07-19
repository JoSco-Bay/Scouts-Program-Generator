# Scout Program Builder — CLAUDE.md

## Project overview

A Next.js app (App Router, TypeScript, no external UI library) for Scout leaders to plan terms, generate AI run sheets, and track member progress. All data is stored in **Supabase** (Phase 2 complete). Auth is email/password via Supabase Auth with Row Level Security on every table.

## Key pages and routes

| Path | File | Purpose |
|------|------|---------|
| `/` | `app/page.tsx` | Landing / home |
| `/auth` | `app/auth/page.tsx` | Login / signup (Supabase Auth) |
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

## Shared library files

| File | Purpose |
|------|---------|
| `lib/types.ts` | All shared TypeScript interfaces |
| `lib/colours.ts` | Section colour palette (`SECTION_COLOURS`, `NAVY`) |
| `lib/supabase.ts` | Singleton Supabase client (uses `NEXT_PUBLIC_` env vars) |
| `lib/db.ts` | All Supabase query functions (groups, term_rows, members, run_sheets) |
| `lib/auth-context.tsx` | `AuthProvider` + `useAuth()` hook — wraps app in `layout.tsx` |

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
| `term_rows` | id, user_id, group_id, date, time, topic, location, oas_focus, session_notes, bring, leader, assistant_patrol, consent_required, row_type, sort_order | FK → groups |
| `members` | id, user_id, group_id, first_name, last_name, age, year_joined, attendance (jsonb), oas (jsonb), sia (jsonb), milestone_activities (jsonb), milestones_awarded[], peak_awarded | FK → groups |
| `run_sheets` | id, user_id, group_id, term_row_id (nullable), data (jsonb) | FK → groups; term_row_id nullable for quick-create sheets |

All tables have RLS enabled: `auth.uid() = user_id` on SELECT/INSERT/UPDATE/DELETE.

## `lib/db.ts` — query function reference

```
// Groups
loadGroupRecord(userId)               → GroupRecord | null
saveGroupConfig(userId, groupId, cfg) → string (groupId)

// Term rows
loadTermRows(userId)                          → TermRow[]
upsertTermRows(userId, groupId, rows)         → void   (upsert by id)
replaceTermRows(userId, groupId, rows)        → void   (delete all + insert)
deleteTermRow(userId, rowId)                  → void

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

## Supabase schema — current state (as of 2026-06-27)

- All four tables exist: `groups`, `term_rows`, `members`, `run_sheets`
- **RLS is disabled** on all four tables (`ALTER TABLE x DISABLE ROW LEVEL SECURITY`) — intentional while auth is deferred to Phase 5
- **`user_id` is nullable** on all tables (`ALTER COLUMN user_id DROP NOT NULL`) — `lib/db.ts` no longer writes `user_id`; all filtering is by `group_id`
- Grant `ALL` on all tables to `anon, authenticated` roles has been applied

## Auth approach — current (no auth, group_id identity)

Auth is deferred to Phase 5. Current approach:
- No Supabase Auth is used. `useAuth()` / `user` is still present in pages but the db layer ignores `user_id` entirely.
- `lib/db.ts` uses `localStorage.getItem('groupId')` to scope all queries. On first `saveGroupConfig` insert, the returned Supabase `groups.id` is written to `localStorage.groupId`.
- `lib/supabase.ts` uses plain `createClient` from `@supabase/supabase-js` — no `@supabase/ssr`, no auth options.
- Do NOT re-introduce `supabase.auth.getUser()` calls in `lib/db.ts` until Phase 5.

## Supabase failure handling (all `lib/db.ts` functions)

- Every exported function in `lib/db.ts` wraps its Supabase calls in try/catch — if the client is unreachable (or `supabase` itself is `null`, e.g. missing `NEXT_PUBLIC_SUPABASE_*` env vars), reads return a safe empty default (`null`/`[]`) instead of throwing, and writes log the error instead of throwing (except `saveGroupConfig`, which still throws a clean `Error` since its callers already catch it and need to know the save failed).
- This matters because several pages (`/term`, `/members`, `/runsheets`) call multiple `lib/db.ts` loaders via `Promise.all` in their initial-load `useEffect`, with no try/catch of their own and `setDbLoading(false)` only reached after the `Promise.all` resolves. An unguarded throw from any one of those calls leaves `dbLoading` stuck `true` forever — the page renders `null` forever (a white screen), not a visible error. Any new `lib/db.ts` function follows this same guard pattern so it's safe to add to those `Promise.all` calls.
- `members` and `runsheets` also have a real localStorage cache (see the localStorage table above) that these guards fall back to; `groups`/`term_rows` currently just fall back to an empty result — `/term` and `/setup` separately maintain their own `groupConfig`/`programRows` localStorage backups and read them when the Supabase result comes back empty.

## Auth pattern — every page

```typescript
const { user, loading: authLoading } = useAuth();

useEffect(() => {
  if (authLoading) return;
  if (!user) { router.push('/auth'); return; }
  async function load() {
    const grp = await loadGroupRecord(user!.id);
    // ... load other data ...
    setDbLoading(false);
  }
  load();
}, [user, authLoading, router]);

if (authLoading || dbLoading) return null;
```

## Data flow rules (important)

- **`config.members`** (plain `string[]`) = names entered on the setup page. Used for dropdowns in the term plan.
- **`members` table** (full `Member[]` objects) = members added through the Members tab. Has attendance, OAS, SIA, milestones.
- These are two separate stores. The term plan edit form merges both for dropdowns: `config.leaders + config.members + memberNames` (deduped, trimmed).
- **Member seeding on setup save**: `app/setup/page.tsx` `save()` seeds `config.members` names into the members table. For each name, split on the first space (`firstName` = text before, `lastName` = remainder, or `''` if no space) and skip it if a member with that exact trimmed full name already exists (case-sensitive). New members get empty `attendance`/`oas`/`sia`/`milestoneActivities`/`milestonesAwarded`, `peakAwarded: false`, `age: 0`, `yearJoined` = current year. This does not overwrite or delete existing members — it only adds ones not already present.
- **Delete vs upsert**: `upsertMembers` cannot handle deletions. `deleteMember` calls `deleteMemberById` directly then updates state — does NOT go through `saveMembers`.
- **`replaceTermRows`** (delete all + insert) is used by `buildDates` to handle regenerating dates cleanly. `upsertTermRows` is used for incremental saves.
- **`term_row_id` nullability**: run sheets created from the term plan get `term_row_id = source.row.id` (when `source.isTermRow === true`). Quick-create run sheets get `term_row_id = null`.

## Term plan edit form — leader fields

- **Leader** dropdown: deduped union of `config.leaders`, `config.members`, `memberNames` (from Members tab).
- **Asst. patrol leader**: multi-select checkbox list using the same deduped list. Stores selected names as a comma-separated string in `row.assistantPatrol`. Uses `e.target.checked` in onChange and `setEditDraft(d => ...)` updater to avoid stale closure bugs.
- Deduplication: all names are `.trim()`-ed before passing to `new Set()` to handle trailing spaces from `firstName + ' ' + lastName` construction.

## Members tab — milestone tracking

- **Participate** is auto-counted from the attendance grid (sessions attended). It is NOT a manual log type.
- The "Log Activity" form only has **Assist** and **Lead** as type options.
- `calcMilestoneProgress()` reads attendance for the participate count, and `milestoneActivities[]` for assist/lead counts.

## Members tab — SIA entries

- SIA entries are fully editable: each item has an **Edit** button that opens an inline form (same fields as "Add project" — category, project name, status, notes, date completed) pre-filled from the entry, saved in place via `saveEditSIA`.
- `dateCompleted` is a manual `<input type="date">` on both the add and edit forms — it is never auto-set when status is changed to `complete`. Stored as `YYYY-MM-DD`; `formatSIADate()` renders it as `en-AU` for display and falls back to the raw string for older entries stored as locale-formatted text.
- Delete button on an SIA entry is labelled "Delete" (plain text, not an emoji — emoji glyphs render unreliably as tofu/"II" in some environments).

## Run sheet API (`generate-runsheet/route.ts`)

- Model: `gpt-4o`, `max_tokens: 4000`, `response_format: json_object`
- `sessionNotes` from the term row is injected into the prompt as `\nLeader notes: <text>` after the OAS Focus line (omitted when empty).
- Return shape always includes fallback empty values for all fields: `tagline` (`''`), `challengeAreas`, `plan`, `activities`, `review`, `participate`, `assist`, `lead`, `itemsRequired` (all `[]`).

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

### Phase 5 — Auth (deferred from Phase 2)

- [ ] Re-enable Supabase Auth with `@supabase/ssr` and `createBrowserClient`
- [ ] Re-enable RLS on all tables with proper `auth.uid() = user_id` policies
- [ ] Migrate `group_id` identity from localStorage to `user_id` per-user scoping
- [ ] Add `WITH CHECK` INSERT policy on `groups` table
