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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert Scout leader writing a session plan in the official Joey/Cub/Scout PLAN-DO-REVIEW format used by Scouts Australia. Return only valid JSON, no markdown fences, no explanation.`,
        },
        {
          role: "user",
          content: `Write a complete session plan for this Scout meeting, in the traditional PLAN/DO/REVIEW format.

Section: ${config.section}
Group: ${config.groupName}
Topic: ${row.topic || 'General meeting'}
Date: ${row.date || 'TBC'}
Start time: ${row.time || '6:00pm'}
Location: ${row.location || 'Hall'}
OAS Focus: ${row.oasFocus || 'General'}
Leader: ${row.leader || 'Leader'}
Assistant Patrol Leader: ${row.assistantPatrol || 'None'}

Return ONLY this JSON structure:
{
  "tagline": "One sentence describing tonight's session (e.g. 'Learn to tie knots and set up fishing tackle')",
  "challengeAreas": ["Outdoor","Creative"],
  "plan": [
    "Item leaders need to prepare/bring before the session, as a short phrase",
    "Another prep item"
  ],
  "activities": [
    {
      "id": "a1",
      "time": "6:00pm",
      "name": "OPENING PARADE",
      "detail": "To be led by ___________ – explain why we do open and closing parade.",
      "optional": false,
      "oasTag": null,
      "hasRecipe": false
    }
  ],
  "review": [
    "Reflection question or review prompt for tonight's session",
    "Another review prompt"
  ],
  "participate": ["What a Joey/Cub/Scout does when participating in tonight's activities"],
  "assist": ["What a more experienced member could do to assist others tonight"],
  "lead": ["What a Patrol Leader / older member could lead tonight"],
  "itemsRequired": ["Equipment item 1","Equipment item 2"]
}

GUIDELINES — follow the real Scout session format closely:
- challengeAreas: choose 1-3 from exactly these: "Community","Outdoor","Creative","Personal"
- activities MUST start with "OPENING PARADE" at ${row.time || '6:00pm'} with detail "To be led by ___________ – explain why we do open and closing parade." plus a short intro line relevant to tonight's topic.
- Then 3-5 main activities/games, each in the style: "GAME: [Name]" or "ACTIVITY: [Name]" or "ACTIVITY. [Name]:" followed by equipment list (if any) then clear numbered/step instructions written the way a volunteer leader would explain it to other parents helping out — practical, conversational, age-appropriate for ${config.section}.
- Include realistic timings starting from ${row.time || '6:00pm'}, roughly 5-15 min per activity, finishing by 7:00pm (60 min session) unless the topic suggests longer.
- Make at least one activity tie to the OAS focus "${row.oasFocus || 'General'}" if provided — set its oasTag to a short reference like "Bushcraft S1" and include the specific skill/step in the detail.
- The LAST activity MUST be "CLOSING PARADE" with detail "To be led by ___________." plus a brief reflection prompt.
- Set hasRecipe:true ONLY if an activity involves cooking/making food.
- One activity near the start or end can be optional:true (e.g. a coming-in game or backup activity).
- plan: 2-4 short prep items (equipment to gather, tables to set up, things to plan ahead) — phrased like "Bring X" or "Set up Y" or "Plan a route for Z"
- review: 2-4 short reflection prompts a leader could ask the group at the end
- participate/assist/lead: 2-3 short phrases each, age-appropriate, describing how a member could engage at each level for THIS topic specifically (not generic)
- itemsRequired: 4-8 concrete physical items needed for tonight's activities

Write in the same plain, practical, slightly informal tone real Scout leaders use — short sentences, equipment lists, step-by-step instructions a parent helper could follow without prior knowledge.`,
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

    if (!data.activities || !Array.isArray(data.activities)) {
      return Response.json({ error: "AI response did not include activities." }, { status: 500 });
    }

    return Response.json(data);
  } catch (err: any) {
    console.error("generate-runsheet error:", err);
    return Response.json({ error: err.message || "Failed to generate run sheet" }, { status: 500 });
  }
}
