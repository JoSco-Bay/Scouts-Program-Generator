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
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert Scouts Australia program planner. Generate complete, practical run sheets for volunteer leaders. Return only valid JSON, no markdown fences.",
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
OAS Focus: ${row.oasFocus || 'General'}
Leader: ${row.leader || 'Leader'}
Assistant Patrol Leader: ${row.assistantPatrol || 'None'}

Return JSON with this structure:
{
  "activities": [
    {
      "id": "unique string",
      "time": "5:50pm",
      "name": "Coming-in activity",
      "detail": "Full description with all sub-steps, safety reminders, and leader notes. Be specific and practical.",
      "optional": true,
      "oasTag": null,
      "hasRecipe": false
    }
  ]
}

Include these activities in order, with realistic timing starting from ${row.time || '6:00pm'}:
1. Coming-in activity (optional:true, before opening parade)
2. Opening parade (flag, Scout Promise, introduce theme)
3. Safety talk (if relevant)
4. Main activity 1 (full detail)
5. Main activity 2 (if time allows)
6. Eat/reflect/clean up (if cooking involved)
7. Optional game (optional:true)
8. Closing parade (reflection question, announcements)

For each activity include ALL necessary detail in "detail" — sub-steps, safety reminders, what leaders prepare, what Scouts do step by step.
Set hasRecipe:true only if the activity involves cooking food.
Set oasTag to the relevant OAS requirement if applicable (e.g. "Camping S1 — cook a snack"), otherwise null.
Give each activity a unique "id" string like "a1","a2" etc.`,
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
