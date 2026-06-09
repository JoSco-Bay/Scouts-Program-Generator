import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const mode: string = body.mode ?? "session";
  const oasGoals: string[] = body.oasGoals ?? [];
  const oasSection = oasGoals.length > 0
    ? `\nOAS Badge Goals:\n${oasGoals.map((g: string) => `- ${g}`).join("\n")}\n`
    : "";

  let prompt = "";
  let maxTokens = 4000;

  // ── SINGLE SESSION ───────────────────────────────────────────────────────
  if (mode === "session") {
    maxTokens = 4000;
    prompt = `
Create a complete Scout meeting plan. Include ALL sections below — do not skip any.

Section: ${body.section}
Duration: ${body.duration} minutes
Theme: ${body.theme}
Group Size: ${body.groupSize}
${oasSection}
Session Goal: ${body.goal}

Previously covered (do not repeat):
${body.previousSessions}

## Session Overview
2–3 sentence summary of what this session covers.

## Session Objectives
3–5 measurable outcomes Scouts will achieve.

## OAS Badge Progress
For each OAS goal: which stage requirements are covered and what Scouts must demonstrate.

## Equipment List
Group as: Leader Equipment / Scout Equipment / Consumables

## Safety Considerations
All hazards and mitigations for every activity.

## Timed Run Sheet
Full ${body.duration}-minute schedule as a table:
| Time | Duration | Activity | Leader Notes |

## Opening Parade
Full script: flag ceremony, Scout Promise/Law, uniform inspection, announcements.

## Coming-In Activity
Full step-by-step instructions for the arrival activity (10–15 min).

## Main Activities
For each activity: full instructions, equipment, safety notes, leadership opportunity, time.

## Closing Parade
Full script: reflection, achievement recognition, notices, closing ceremony.

## Reflection Questions
5–7 debrief questions for leaders to use with Scouts.

## Leader Notes
Preparation tasks and follow-up actions.
`;

  // ── TERM PLAN ────────────────────────────────────────────────────────────
  } else if (mode === "term") {
    maxTokens = 8000;
    prompt = `
Create a complete Scouts term program plan. Include ALL sections — do not skip any.

Section: ${body.section}
School Year: ${body.schoolYear}
Term: Term ${body.startTerm}
Sessions: ${body.sessionsPerTerm}
Session Length: ${body.duration} minutes
Group Size: ${body.groupSize}
Theme: ${body.theme}
${oasSection}
Program Goal: ${body.goal}

Previously covered (do not repeat):
${body.previousSessions}

## Term Overview
Paragraph on this term's focus, OAS integration, and skill progression arc.

## OAS Badge Roadmap
Table: OAS Stream | Stage | Sessions | Requirements to Cover

## Term Schedule
Table: Week | Session Title | Theme | Key Activities | OAS Focus | Equipment Notes

## Session Plans
For EVERY session Week 1 through Week ${body.sessionsPerTerm}:

### Week [N] — [Title]
**OAS Focus:** ...
**Session Objectives:** bullet points

**Timed Run Sheet:**
| Time | Duration | Activity | Leader Notes |

**Opening Parade:** Full procedure.
**Coming-In Activity:** Full instructions.
**Main Activities:** Full step-by-step for each activity, equipment, safety, leadership opportunity.
**Closing Parade:** Full procedure with reflection prompt.
**Equipment List:** Leader Equipment / Scout Equipment / Consumables
**Safety Notes:** Specific hazards for this session.
**Leader Preparation Notes:** What to do before/after.

---
`;

  // ── YEAR PLAN — overview only ─────────────────────────────────────────────
  } else if (mode === "year") {
    maxTokens = 3000;
    // Store the full body context so the results page can pass it to generate-term
    prompt = `
Create a year-level overview ONLY for a Scouts program. Do NOT generate individual session details — those will be generated separately per term.

Section: ${body.section}
School Year: ${body.schoolYear}
Starting Term: Term ${body.startTerm}
Number of Terms: ${body.numTerms ?? 4}
Sessions per Term: ${body.sessionsPerTerm}
Session Length: ${body.duration} minutes
Group Size: ${body.groupSize}
Theme: ${body.theme}
${oasSection}
Program Goal: ${body.goal}

Previously covered:
${body.previousSessions}

Produce exactly these sections:

## Year Overview
Paragraph describing the full year arc — how skills build term by term and what Scouts will achieve.

## OAS Progression Roadmap
Table showing how each OAS goal is distributed:
| OAS Stream | Stage | Term 1 | Term 2 | Term 3 | Term 4 | Sign-off Target |

## Annual Schedule Summary
Table: Term | Theme | OAS Focus | Key Milestone | Special Requirements

## Term Plans
For EACH term from Term ${body.startTerm} to Term ${Math.min(4, Number(body.startTerm ?? 1) + Number(body.numTerms ?? 4) - 1)}, provide:

### Term [N] — [Theme]
**OAS Focus:** list the OAS streams/stages targeted this term
**Theme:** one sentence describing the term's theme
**Key Sessions:** list 3–4 session titles that will be run this term
**Milestone:** any camp, excursion, or special event planned
**Skills Focus:** 2–3 bullet points on what Scouts will learn

Do NOT write full session plans here — just the term summaries above.
`;

  // ── MULTI-YEAR ────────────────────────────────────────────────────────────
  } else if (mode === "multiyear") {
    maxTokens = 4000;
    prompt = `
Create a multi-year overview ONLY for a Scouts program. Do NOT generate individual session details.

Section: ${body.section}
Starting Year: ${body.schoolYear}
Starting Term: Term ${body.startTerm}
Number of Years: ${body.numTerms}
Sessions per Term: ${body.sessionsPerTerm}
Session Length: ${body.duration} minutes
Group Size: ${body.groupSize}
Theme: ${body.theme}
${oasSection}
Program Goal: ${body.goal}

Previously covered:
${body.previousSessions}

## Multi-Year Overview
Describe the full arc across all ${body.numTerms} year(s).

## OAS Progression Pathway
Table: OAS Stream | Start Stage | Year 1 Target | Year 2 Target | Year 3 Target | Final Achievement

## Multi-Year Calendar
Table: Year | Term | Theme | OAS Focus | Key Milestone

## Year Summaries
For each year, provide:

### Year [N] ([school year]) — [Theme]
**OAS Targets:** which stages to achieve this year
**Term Themes:** one line per term
**Key Milestones:** camps, excursions, achievements
**Skills Arc:** how this year builds on previous / sets up next
`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: maxTokens,
    messages: [
      {
        role: "system",
        content: `You are an expert Scouts Australia program planner. You have deep knowledge of the OAS framework (3 Core Areas: Bushcraft, Bushwalking, Camping; 6 Specialist Areas: Alpine, Aquatics, Boating, Cycling, Paddling, Vertical — each with 9 stages). Write complete, practical programs that volunteer leaders can run immediately. Always use proper markdown tables with pipe syntax. Never skip a requested section.`,
      },
      { role: "user", content: prompt },
    ],
  });

  // For year/multiyear plans, embed the original request context into the
  // response payload so the results page can pass it to /api/generate-term
  const result = completion.choices[0].message.content ?? "";

  if (mode === "year" || mode === "multiyear") {
    return Response.json({ result, context: body });
  }

  return Response.json({ result });
}
