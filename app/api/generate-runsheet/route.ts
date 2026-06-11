import OpenAI from "openai";
import type { GroupConfig, TermRow } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { groupConfig, row } = body as { groupConfig: GroupConfig; row: TermRow };

  const [hourStr, minuteStr] = row.time.replace(/[^0-9:]/g, "").split(":");
  const startHour = parseInt(hourStr ?? "18", 10);
  const startMinute = parseInt(minuteStr ?? "30", 10);

  const prompt = `Create a detailed run sheet for this Scout meeting.

Group: ${groupConfig.groupName} (${groupConfig.section})
Date: ${row.date}
Start Time: ${row.time}
Topic: ${row.topic || "General program"}
Location: ${row.location || "Scout Hall"}
OAS Focus: ${row.oasFocus || "General skills"}
Lead Leader: ${row.leader || groupConfig.leaders[0] || "Leader"}
Items to bring: ${row.bring || "Uniform"}

Generate 6–8 activities as a JSON run sheet. Calculate each start time from ${row.time}. Include:
1. Opening Parade (5–10 min) — flag break, promise, uniform check
2. Coming-In Activity (10–15 min) — low-key arrival game
3. Main Activity 1 (20–30 min) — core activity linked to topic/OAS
4. Main Activity 2 (15–20 min) — second activity building on the theme
5. (Optional) Skill Drill or Game (10–15 min) — reinforces skills
6. Closing Parade (5–10 min) — reflection, notices, flag down

Return a JSON object: { "activities": [ ...array... ] }

Each activity object must have exactly:
- id: string (e.g. "act-1", "act-2")
- time: string (formatted as ${startHour < 12 ? startHour : startHour - 12}:${String(startMinute).padStart(2,"0")} ${startHour < 12 ? "AM" : "PM"} style)
- name: string (activity name)
- detail: string (2–3 sentences: what Scouts do and the leader's role)
- oasTag: string (OAS requirement covered, or "")
- hasRecipe: boolean (true only if cooking/recipe involved)
- optional: boolean (true for optional activities)`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are an expert Scouts Australia program planner. Write practical, detailed activities that a volunteer leader can run immediately. Return valid JSON only." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0].message.content ?? '{"activities":[]}';
  let activities: unknown[] = [];
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const arr = parsed.activities ?? parsed.runSheet ?? parsed.items ?? [];
    activities = Array.isArray(arr) ? arr : [];
  } catch {
    activities = [];
  }

  return Response.json({ activities });
}
