# Scout Program Builder — Claude Context File

Paste this file at the start of every Claude chat session to provide full project context.

---

## Project overview

A Next.js web app for Scout leaders to plan term programs, generate AI run sheets, and track member progression. Built by Wade for 1st Bayview Sea Scouts (Joeys section). Intended to eventually be used by other Scout groups across Australia as a better alternative to the official "Terrain" platform.

**Live site:** https://scouts-program-creator.vercel.app
**GitHub:** https://github.com/JoSco-Bay/Scouts-Program-Generator
**Deployed via:** Vercel (auto-deploys on push to main)
**Local repo:** `C:\Users\wades\scouts-program-generator`

---

## Tech stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Inline `<style key={acc}>` blocks — no Tailwind, no CSS modules
- **AI:** OpenAI GPT-4o via `/app/api/` routes
- **Storage:** localStorage (Supabase planned Phase 4)
- **Deployment:** Vercel

---

## Project structure

```
app/
  page.tsx                     ← Home/landing page
  setup/page.tsx               ← Group setup (name, section, meeting day/time, leaders, members)
  term/page.tsx                ← Term planner (date generation, session rows, AI themes)
  runsheet/page.tsx            ← Run sheet generator and editor (PLAN/DO/REVIEW)
  members/page.tsx             ← Members tab (attendance grid, OAS, SIA, milestones)
  api/
    generate-term/route.ts     ← AI term theme suggestions
    generate-runsheet/route.ts ← AI run sheet generation
    generate-activity/route.ts ← AI activity generator
lib/
  colours.ts                   ← SECTION_COLOURS, NAVY, Section type
  types.ts                     ← Shared TypeScript interfaces
CLAUDE.md                      ← This file
.env.local                     ← OPENAI_API_KEY (never commit)
```

---

## localStorage keys

| Key | Contents |
|---|---|
| `groupConfig` | GroupConfig object |
| `programRows` | TermRow[] for current term |
| `runSheetSource` | Current run sheet session row + config |
| `members` | Member[] — full member objects |

**Critical:** Use `groupConfig` and `programRows` — NOT `scoutGroupConfig` or `termRows` (old keys).

---

## Section colours

```typescript
const SECTION_COLOURS = {
  Joeys:     { accent: '#C17F24', pale: 'rgba(193,127,36,0.07)', text: '#fff',    age: '5-8 yrs'   },
  Cubs:      { accent: '#E8B800', pale: 'rgba(232,184,0,0.08)',  text: '#3d2800', age: '8-11 yrs'  },
  Scouts:    { accent: '#6BBF5A', pale: 'rgba(107,191,90,0.08)', text: '#fff',    age: '11-15 yrs' },
  Venturers: { accent: '#B5485E', pale: 'rgba(181,72,94,0.07)',  text: '#fff',    age: '15-18 yrs' },
}
const NAVY = '#2C3E6B'; // nav bar only
```

Navy is ONLY used in the top nav bar. All style blocks must have `key={acc}` to force re-render on section colour change.

---

## TypeScript interfaces

### GroupConfig
```typescript
interface GroupConfig {
  groupName: string;
  section: Section;
  meetingDay: string;
  meetingTime: string;
  leaders: string[];
  members: string[];
}
```

### TermRow
```typescript
interface TermRow {
  id: string;
  date: string;
  time: string;
  topic: string;
  location: string;
  oasFocus: string;
  sessionNotes: string;
  bring: string;
  leader: string;
  assistantPatrol: string;
  consentRequired: boolean;
  rowType: 'session' | 'extra';
}
```

### ActivityRow
```typescript
interface ActivityRow {
  id: string;
  time: string;
  name: string;
  detail: string;
  optional?: boolean;
  oasTag?: string | null;
  hasRecipe?: boolean;
}
```

### RunSheetData
```typescript
interface RunSheetData {
  tagline?: string;
  challengeAreas?: string[];
  plan?: string[];
  activities: ActivityRow[];
  review?: string[];
  participate?: string[];
  assist?: string[];
  lead?: string[];
  itemsRequired?: string[];
}
```

### Member
```typescript
interface Member {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  yearJoined: number;
  attendance: Record<string, boolean>;
  oas: Record<string, number>;
  sia: SIAEntry[];
  milestoneActivities: MilestoneActivity[];
  milestonesAwarded: string[];
  peakAwarded: boolean;
}

interface MilestoneActivity {
  sessionId: string;
  sessionDate: string;
  challengeArea: 'Community' | 'Outdoor' | 'Creative' | 'Personal';
  type: 'assist' | 'lead'; // NOT 'participate' - auto-counted from attendance
  milestone: 'm1' | 'm2' | 'm3';
}

interface SIAEntry {
  category: string;
  projectName: string;
  status: 'planning' | 'in-progress' | 'complete';
  notes: string;
  dateCompleted?: string;
}
```

---

## Scouts Australia program framework

### OAS streams (11, Stages 1-5)
Bushcraft, Bushwalking, Camping, Aquatics, Cycling, Paddling, Vertical, Alpine, Community, Creative, Personal Growth

### Milestones — official Scouts Australia definition (Dec 2020 v2.1)

**Participate** = attendance and involvement. Auto-counted from attendance grid. NOT manually logged.
- M1 target: ~6 sessions | M2 target: ~5 sessions | M3 target: ~4 sessions

**Assist** = help with a game or small activity (M3 includes planning or reviewing)
**Lead** = take a leading role (M3 includes helping plan and review)
All can be completed with adult assistance.

### Challenge areas (4)
Community, Outdoor, Creative, Personal

### SIA categories (6)
Adventure & Sport, Arts & Literature, Creating a Better World, Environment, Growth & Development, Innovation & STEM

### Peak awards
- Joeys: Joey Scout Challenge
- Cubs: Grey Wolf Award
- Scouts: Australian Scout Medal
- Venturers: Queen's Scout Award

### Joey Scout Challenge requirements
1. Milestone 3 complete
2. OAS Stage 1 in Bushcraft, Bushwalking, Camping
3. 6 SIA projects complete
4. Adventurous Journey (3 hours)
5. Personal Reflection

---

## Run sheet format (PLAN/DO/REVIEW)
1. Challenge areas
2. PLAN — leader prep checklist
3. DO — timed activities (Opening Parade first, Closing Parade last)
4. REVIEW — reflection questions
5. PARTICIPATE / ASSIST / LEAD — three columns
6. ITEMS REQUIRED — equipment checklist

---

## Save/load
- Term plans: `type: 'scout-program-builder-term-plan'` (includes config, rows, members)
- Run sheets: `type: 'scout-program-builder-run-sheet'`

---

## Coding conventions
- All components are "use client"
- Import from `@/lib/colours` and `@/lib/types` — NEVER re-declare locally
- `genId()` = `Math.random().toString(36).slice(2,9)`
- `<style key={acc}>` always
- No Tailwind, no CSS modules, no external UI libraries

---

## What has been built

- [x] Home/landing page
- [x] Group setup (seeds member names into full Member objects on save, no duplicates)
- [x] Term planner (date generation, AI themes, column picker, save/load JSON)
- [x] Run sheet page (AI PLAN/DO/REVIEW, editable, print/PDF, save JSON)
- [x] Members page — list, attendance grid, OAS tracker, SIA log, milestone tracker
- [x] Member dropdowns in term plan edit form (leader + asst patrol from members list)
- [x] Participate auto-counted from attendance (not manually logged)
- [x] Milestone activities scoped per milestone (milestone field on each MilestoneActivity)
- [x] Fixed save/load type string mismatch
- [x] Fixed runsheet localStorage key bug
- [x] sessionNotes added to TermRow in shared types

---

## Known issues / not yet built

- [ ] Milestone progress bars — Participate bar should show attendance count not manual log
- [ ] Members Run sheets sub-tab is placeholder
- [ ] Adventurous Journey and Personal Reflection — manual checkboxes only
- [ ] Recipe database (opens Google search for now)
- [ ] No login/accounts

---

## Planned phases

| Phase | What | Status |
|---|---|---|
| 1 | Term planner, run sheets, members tab, save/load | Done |
| 2 | OAS knowledge base baked into AI prompts | Next |
| 3 | SIA improvements, award progress dashboard | Planned |
| 4 | Supabase — replace localStorage | Planned |
| 5 | Auth — email login, multiple leaders | Planned |
| 6 | File storage per member | Planned |
| 7 | Multi-group support | Planned |
| 8 | AI aware of member progress, suggests program gaps | Planned |

---

## Deployment

```bash
cd scouts-program-generator
git add .
git commit -m "description"
git push
```

Vercel environment variables needed: `OPENAI_API_KEY`
