import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();

  // body contains:
  //   termNumber   - which term to generate (1–4)
  //   termTheme    - the theme for this term from the year overview
  //   yearOverview - the full year overview text already generated
  //   context      - the original builder form values (section, duration, oasGoals, etc.)

  const { termNumber, termTheme, yearOverview, context } = body;
  const oasGoals: string[] = context.oasGoals ?? [];
  const oasSection = oasGoals.length > 0
    ? `OAS Badge Goals for the year:\n${oasGoals.map((g: string) => `- ${g}`).join("\n")}`
    : "";

  const prompt = `
You are continuing a year program plan. The year overview has already been generated (shown below).
Now generate the COMPLETE detailed plan for Term ${termNumber} only.

YEAR CONTEXT:
${yearOverview}

PROGRAM DETAILS:
Section: ${context.section}
School Year: ${context.schoolYear}
Term: Term ${termNumber}${termTheme ? ` — ${termTheme}` : ""}
Sessions this term: ${context.sessionsPerTerm}
Session Length: ${context.duration} minutes
Group Size: ${context.groupSize}
${oasSection}

Previously covered (do not repeat):
${context.previousSessions ?? ""}

Generate the full Term ${termNumber} plan using EXACTLY this structure:

# Term ${termNumber}${termTheme ? ` — ${termTheme}` : ""}

## Term Overview
Paragraph on this term's theme, OAS focus, and how it builds on previous terms.

## OAS Focus This Term
Table: OAS Stream | Stage | Sessions Targeted | Requirements to Demonstrate

## Term Schedule
Table: Week | Session Title | Key Activity | OAS Link | Equipment Flag

## Session Plans

For EVERY session from Week 1 to Week ${context.sessionsPerTerm}, write the COMPLETE plan:

### Week [N] — [Session Title]

**OAS Focus:** [stream and stage]

**Session Objectives:**
- [objective 1]
- [objective 2]
- [objective 3]

**Timed Run Sheet:**
| Time | Duration | Activity | Leader Notes |
|------|----------|----------|--------------|
[Complete every row for the full ${context.duration} minute session]

**Opening Parade**
Full script: flag break, Scout Promise/Law recitation, uniform inspection checklist, leader announcements template.

**Coming-In Activity**
Name: [activity name]
Duration: 10–15 minutes
Instructions: Step-by-step instructions a leader can follow immediately.
Equipment: What's needed.

**Main Activities**
For each activity:
- **[Activity Name]** ([duration])
  - OAS Requirement: [specific stage requirement being met]
  - Instructions: Full step-by-step
  - Equipment: Complete list
  - Safety: Specific hazards and controls
  - Leadership Opportunity: How Scouts can lead this

**Closing Parade**
Full script: reflection question, achievement/progress recognition, upcoming notices, Scout sign-off.

**Equipment List**
- Leader Equipment:
- Scout Equipment:
- Consumables:

**Safety Considerations**
All hazards specific to this session with mitigation steps.

**Leader Preparation Notes**
- Before session:
- During session:
- After session:

---

[Repeat the full structure above for every session Week 1 through Week ${context.sessionsPerTerm}]
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 8000,
    messages: [
      {
        role: "system",
        content: `You are an expert Scouts Australia program planner. You have deep knowledge of the OAS framework. Write complete, detailed, practical session plans that volunteer leaders can pick up and run immediately with no prior knowledge. Always include full timed run sheets as tables. Always include complete opening AND closing parade scripts. Always include full coming-in activity instructions. Never abbreviate or skip sessions — write every single session in full.`,
      },
      { role: "user", content: prompt },
    ],
  });

  return Response.json({
    result: completion.choices[0].message.content ?? "",
    termNumber,
  });
}