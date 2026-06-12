import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { section, termName, rowCount } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert Scouts Australia program planner. Return only valid JSON.`,
      },
      {
        role: "user",
        content: `Generate ${rowCount} weekly session suggestions for a ${section} Scout group for ${termName}.
For each session provide a topic and OAS focus.
Return JSON: { "suggestions": [{ "topic": "...", "oasFocus": "..." }] }
Make topics engaging, age-appropriate for ${section}, and spread OAS streams across the term.
OAS streams: Bushcraft, Bushwalking, Camping, Aquatics, Cycling, Paddling, Vertical, Alpine, Community, Creative, Personal Growth.
Keep topics short (under 8 words). Keep OAS focus short (e.g. "Bushcraft S1", "Community").`,
      },
    ],
  });

  const data = JSON.parse(completion.choices[0].message.content || "{}");
  return Response.json(data);
}
