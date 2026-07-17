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
- **No member seeding**: setup save does NOT auto-create Member objects in the members table. Members must be added manually in the Members tab.
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
