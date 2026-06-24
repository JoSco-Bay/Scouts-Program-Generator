import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "OPENAI_API_KEY is not set on the server" }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });

    const { row, config } = await req.json();
    if (!row || !config) {
      return Response.json({ error: "Missing session or group info" }, { status: 400 });
    }
    const sessionNotes = row.sessionNotes ? '\nLeader notes: ' + row.sessionNotes : '';

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert Scouts Australia program planner. Generate complete, practical run sheets for volunteer leaders following the PLAN/DO/REVIEW method and Scouts Australia's Participate/Assist/Lead framework. Return only valid JSON, no markdown fences.",
        },
        {
          role: "user",
          content: `Generate a complete run sheet for this Scout session:

Section: ${config.section}
Group: ${config.groupName}
Topic: ${row.topic || 'General meeting'}
Date: ${row.date || 'TBC'}
Time: ${row.time || '6:00pm'}
Location: ${row.location || 'Hall'}
OAS Focus: ${row.oasFocus || 'General'}${sessionNotes}
Leader: ${row.leader || 'Leader'}
Assistant Patrol Leader: ${row.assistantPatrol || 'None'}

Return JSON matching this exact structure:

{
  "tagline": "One inspiring sentence describing the session theme",

  "challengeAreas": ["Community", "Outdoor"],

  "plan": [
    "Preparation checklist item — what the leader must prepare or bring beforehand",
    "Another preparation item"
  ],

  "activities": [
    {
      "id": "a1",
      "time": "5:50pm",
      "name": "Activity name",
      "detail": "Full step-by-step instructions. Include what leaders do, what Scouts do, safety reminders, and any setup needed. Be specific and practical.",
      "optional": false,
      "oasTag": "Camping S1 — cook a camp meal",
      "hasRecipe": false
    }
  ],

  "review": [
    "Reflection question to ask Scouts at closing parade",
    "Another discussion prompt"
  ],

  "participate": [
    "What a Scout does to meet the Participate requirement for this session",
    "Another participate descriptor"
  ],

  "assist": [
    "What a Scout does to meet the Assist requirement — helping another Scout with an activity",
    "Another assist descriptor"
  ],

  "lead": [
    "What a Scout does to meet the Lead requirement — leading a group or activity",
    "Another lead descriptor"
  ],

  "itemsRequired": [
    "Specific item or material needed",
    "Another item"
  ]
}

Rules:
- challengeAreas: only use values from this list: Community, Outdoor, Creative, Personal. Include all that apply.
- plan: 4–8 actionable preparation items the leader should complete before the session.
- activities: include in order with realistic timing starting from ${row.time || '6:00pm'}:
    1. Coming-in activity (optional: true, 10 min before opening)
    2. Opening parade (flag, Scout Promise, introduce theme)
    3. Safety talk (if relevant to activities)
    4. Main activity 1 (full detail, most of session time)
    5. Main activity 2 (if time allows)
    6. Eat / reflect / clean up (if cooking involved)
    7. Optional game (optional: true)
    8. Closing parade (reflection question, announcements, Scout sign-off)
  Set hasRecipe: true only if the activity involves cooking food.
  Set oasTag to the relevant OAS requirement string if applicable, otherwise null.
- review: 3–5 short reflection questions suitable for the closing parade.
- participate: 2–4 descriptions of what a Scout does by simply taking part in today's session activities.
- assist: 2–3 descriptions of how a Scout assists another Scout or leader during the session.
- lead: 2–3 descriptions of how a Scout leads part of the session — planning, running, or teaching an activity.
- itemsRequired: complete list of all physical items needed across all activities.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return Response.json({ error: "AI returned invalid JSON. Please try again." }, { status: 500 });
    }

    return Response.json({
      tagline:        data.tagline        || '',
      challengeAreas: data.challengeAreas || [],
      plan:           data.plan           || [],
      activities:     data.activities     || [],
      review:         data.review         || [],
      participate:    data.participate    || [],
      assist:         data.assist         || [],
      lead:           data.lead           || [],
      itemsRequired:  data.itemsRequired  || [],
    });
  } catch (err: any) {
    console.error("generate-runsheet error:", err);
    return Response.json({ error: err.message || "Failed to generate run sheet" }, { status: 500 });
  }
}
