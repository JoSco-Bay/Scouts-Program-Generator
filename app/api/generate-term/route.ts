import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "OPENAI_API_KEY is not set on the server" }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });

    const body = await req.json();
    const { section, termName, rowCount, oasStreams, notes } = body;

    if (!rowCount || rowCount < 1) {
      return Response.json({ error: "No sessions to generate themes for. Generate dates first." }, { status: 400 });
    }

    const oasLine = (oasStreams && oasStreams.length > 0)
      ? `Focus on these OAS streams across the term: ${oasStreams.join(', ')}.`
      : `Spread across a good variety of OAS streams: Bushcraft, Bushwalking, Camping, Aquatics, Cycling, Paddling, Vertical, Alpine, Community, Creative, Personal Growth.`;

    const notesLine = notes ? `Additional context from the leader: ${notes}` : '';

    const prompt = `Generate ${rowCount} weekly session ideas for a ${section} Scout group, for ${termName}.

${oasLine}
${notesLine}

For each of the ${rowCount} sessions, provide:
- topic: a short, engaging session title (under 8 words)
- oasFocus: short OAS reference (e.g. "Bushcraft S1", "Community") or empty string if general
- location: usually "Hall" unless the topic suggests somewhere else (e.g. "Park", "Beach")
- bring: any items members should bring, or empty string if nothing special

Return ONLY valid JSON with this exact structure, no markdown, no explanation:
{
  "suggestions": [
    { "topic": "...", "oasFocus": "...", "location": "...", "bring": "...", "notes": "One sentence of specific context for this session, e.g. what skills to focus on or what to prepare" }
  ]
}

The "suggestions" array must have exactly ${rowCount} items. The "notes" field should give one sentence of specific helpful context a leader could use to prep for that session, in a sensible progressive order (build skills week to week where relevant).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert Scouts Australia program planner. Always return valid JSON only, no markdown fences, no explanation text." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return Response.json({ error: "AI returned invalid JSON. Please try again." }, { status: 500 });
    }

    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      return Response.json({ error: "AI response did not include suggestions." }, { status: 500 });
    }

    return Response.json(data);
  } catch (err: any) {
    console.error("generate-term error:", err);
    return Response.json({ error: err.message || "Failed to generate themes" }, { status: 500 });
  }
}
