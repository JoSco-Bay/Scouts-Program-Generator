import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { row, config } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert Scouts Australia program planner. Generate complete, practical run sheets for volunteer leaders. Return only valid JSON.`,
      },
      {
        role: "user",
        content: `Generate a complete run sheet for this Scout session:

Section: ${config.section}
Group: ${config.groupName}
Topic: ${row.topic}
Date: ${row.date}
Time: ${row.time}
Location: ${row.location}
OAS Focus: ${row.oasFocus || 'General'}
Leader: ${row.leader}
Assistant Patrol Leader: ${row.assistantPatrol || 'None'}

Return JSON with this structure:
{
  "activities": [
    {
      "id": "unique string",
      "time": "5:50pm",
      "name": "Coming-in activity",
      "detail": "Full description with all sub-steps, safety reminders, and leader notes. Include wash hands reminders where relevant. Be specific and practical.",
      "optional": true,
      "oasTag": null,
      "hasRecipe": false
    }
  ]
}

Include these activities in order:
1. Coming-in activity (optional, before opening parade, 5:50pm if meeting at 6pm)
2. Opening parade (flag, Scout Promise, introduce theme)
3. Safety talk (if relevant to activities)
4. Main activity 1 (with full detail)
5. Main activity 2 (if time allows)
6. Eat/reflect/clean up (if cooking involved)
7. Optional game (marked optional:true)
8. Closing parade (reflection question, announcements)

For each activity include ALL necessary detail in the detail field — sub-steps, safety reminders (wash hands, no touching hot surfaces etc), what leaders need to prepare, what Scouts do step by step.
Set hasRecipe:true if activity involves cooking.
Set oasTag to the relevant OAS requirement if applicable (e.g. "Camping S1 — cook a snack").
Use realistic times based on ${row.time} start.`,
      },
    ],
  });

  const data = JSON.parse(completion.choices[0].message.content || "{}");
  return Response.json(data);
}
