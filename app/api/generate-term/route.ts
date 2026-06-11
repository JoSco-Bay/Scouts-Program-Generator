import OpenAI from "openai";
import type { GroupConfig } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { groupConfig, dates } = body as { groupConfig: GroupConfig; dates: string[] };

  const prompt = `You are an expert Scouts Australia program planner for ${groupConfig.section} (${groupConfig.section === "Joeys" ? "5–8" : groupConfig.section === "Cubs" ? "8–11" : groupConfig.section === "Scouts" ? "11–15" : "15–18"} yrs).

Generate a term program for:
Group: ${groupConfig.groupName}
Section: ${groupConfig.section}
Meeting: ${groupConfig.meetingDay}s at ${groupConfig.meetingTime}
Leaders: ${groupConfig.leaders.join(", ")}

Generate a topic, OAS focus area, location, and items to bring for each of the following ${dates.length} meetings. Progress skills week-by-week — don't repeat the same topic twice.

Meeting dates:
${dates.map((d, i) => `Week ${i + 1}: ${d}`).join("\n")}

Return a JSON object: { "suggestions": [ ...array of ${dates.length} objects... ] }

Each object must have exactly these fields:
- week: number (1-based index)
- topic: string (specific engaging topic, e.g. "Bushcraft — Firestarting & Camp Cooking")
- oasFocus: string (e.g. "Bushcraft Stage 2" or "" if not applicable)
- location: string (e.g. "Scout Hall" or "Local Park — bring wet weather gear")
- bring: string (comma-separated items)`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are an expert Scouts Australia program planner. Return valid JSON only." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0].message.content ?? "{}";
  let suggestions: unknown[] = [];
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const arr = parsed.suggestions ?? parsed.weeks ?? parsed.sessions ?? parsed.meetings ?? [];
    suggestions = Array.isArray(arr) ? arr : [];
  } catch {
    suggestions = [];
  }

  return Response.json({ suggestions });
}
