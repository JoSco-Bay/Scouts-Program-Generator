# Scout Program Builder — CLAUDE.md

## Project overview

A Next.js app (App Router, TypeScript, no external UI library) for Scout leaders to plan terms, generate AI run sheets, and track member progress. All data is stored in `localStorage` (Phase 1). Phase 2 will migrate to Supabase.

## Key pages and routes

| Path | File | Purpose |
|------|------|---------|
| `/` | `app/page.tsx` | Landing / home |
| `/setup` | `app/setup/page.tsx` | Group config (name, section, day, time, leaders, members) |
| `/term` | `app/term/page.tsx` | Term planner — date grid, per-row edit form, AI theme generation |
| `/runsheet` | `app/runsheet/page.tsx` | AI-generated run sheet for a single session |
| `/members` | `app/members/page.tsx` | Member list, attendance grid, OAS tracker, SIA log, milestones |

### API routes

| Route | Purpose |
|-------|---------|
| `app/api/generate-term/route.ts` | AI topic suggestions for the term plan |
| `app/api/generate-runsheet/route.ts` | AI run sheet generation (GPT-4o, 4000 tokens) |
| `app/api/generate-activity/route.ts` | AI individual activity generation |

## Shared types (`lib/types.ts`)

- **`GroupConfig`** — groupName, section, meetingDay, meetingTime, leaders `string[]`, members `string[]`
- **`TermRow`** — id, date, time, topic, location, oasFocus, sessionNotes, bring, leader, assistantPatrol, consentRequired, rowType
- **`ActivityRow`** — id, time, name, detail, oasTag, hasRecipe, optional

## localStorage keys

| Key | Type | Written by |
|-----|------|-----------|
| `groupConfig` | `GroupConfig` JSON | `/setup` save |
| `programRows` | `TermRow[]` JSON | `/term` on every change |
| `members` | `Member[]` JSON | `/members` on every change |
| `runSheetSource` | `{ row, config }` JSON | `/term` when "Create" is clicked |

## Data flow rules (important)

- **`config.members`** (plain `string[]`) = names entered on the setup page. Used for dropdowns in the term plan.
- **`localStorage.members`** (full `Member[]` objects) = members added through the Members tab. Has attendance, OAS, SIA, milestones.
- These are two separate stores. The term plan edit form merges both for dropdowns: `config.leaders + config.members + memberNames` (deduped, trimmed).
- **No member seeding**: setup save does NOT auto-create Member objects in `localStorage.members`. Members must be added manually in the Members tab.

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

### 🔜 Phase 2 — Supabase database

- [ ] Supabase project setup and environment variables
- [ ] Migrate `groupConfig` → Supabase `groups` table
- [ ] Migrate `programRows` → Supabase `term_rows` table
- [ ] Migrate `members` → Supabase `members` table
- [ ] Auth (leader login, group ownership)
- [ ] Replace all `localStorage` reads/writes with Supabase queries

### Phase 3 — Sharing and multi-device

- [ ] Share term plan via link
- [ ] Multiple leaders per group
- [ ] Parent-facing view (read-only session info)
