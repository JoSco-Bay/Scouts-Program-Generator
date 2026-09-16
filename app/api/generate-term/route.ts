import OpenAI from "openai";

const SCOUTS_AUSTRALIA_KNOWLEDGE = `
You are an expert Scouts Australia program planner. Generate term programs that align with official Scouts Australia guidelines and the Scout Method.

THE SCOUT METHOD (reflect in term planning):
1. Learning by Doing — practical hands-on activities every week
2. Community Involvement — include community service activities
3. Nature and the Outdoors — significant outdoor component across the term
4. Promise and Law — referenced at every session
5. Patrol System — activities designed for small group teamwork
6. Personal Progression — build skills progressively across the term
7. Symbolic Framework — consistent Opening/Closing Parade each week
8. Youth Leading Adults Supporting — Participate/Assist/Lead opportunities each session

CHALLENGE AREAS — ensure a BALANCED term across all 4:
- Community: service to community, helping others, working together
- Creative: arts, crafts, music, performance, innovation, making things
- Outdoors: adventure, nature, outdoor skills, physical challenge
- Personal Growth: self-improvement, reflection, values, resilience

OAS STREAMS (9 official, Stages 1-9):
Core: Bushcraft, Bushwalking, Camping
Specialist: Alpine, Aquatics, Boating, Cycling, Paddling, Vertical

SECTION CHARACTERISTICS:
Joey Scouts (5-8 yrs): Simple, fun, hands-on, movement-based, short attention spans, discovering adventure, highly supportive, adults encourage
Cub Scouts (8-11 yrs): More variety, beginning to take risks, input into planning, new challenges, increasing independence
Scouts (11-15 yrs): Self-managing, leading activities, own interests drive program, responsible risk taking
Venturer Scouts (15-18 yrs): Completely self-directed, drive own program, push personal boundaries

TERM PLANNING PRINCIPLES:
- Build progression across the term — early sessions introduce skills, later sessions develop them
- Mix Challenge Areas each week — aim for variety not repetition
- Include at least one multi-day event or special event per term
- Balance indoor (Hall) and outdoor (Local Park, Reserve, Camp) sessions
- End of term should have a celebration or showcase session
- If building to a camp — last 2-3 weeks should include camp prep activities
`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "OPENAI_API_KEY is not set on the server" }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });

    const body = await req.json();
    const { section, termName, rowCount, oasStreams, challengeAreas, notes } = body;

    if (!rowCount || rowCount < 1) {
      return Response.json({ error: "No sessions to generate themes for. Generate dates first." }, { status: 400 });
    }

    const oasLine = (oasStreams && oasStreams.length > 0)
      ? `Focus on these OAS streams across the term: ${oasStreams.join(', ')}.`
      : `Spread across a good variety of OAS streams: Bushcraft, Bushwalking, Camping, Aquatics, Boating, Cycling, Paddling, Vertical, Alpine.`;

    const challengeLine = (challengeAreas && challengeAreas.length > 0)
      ? `Also aim for a balanced program across these Challenge Areas: ${challengeAreas.join(', ')}.`
      : `Ensure a balanced mix of all 4 Challenge Areas across the term: Community, Creative, Outdoors, Personal Growth.`;

    const notesLine = notes ? `Additional context from the leader: ${notes}` : '';

    const prompt = `Generate ${rowCount} weekly session ideas for a ${section} Scout group, for ${termName}.

${oasLine}
${challengeLine}
${notesLine}

For each of the ${rowCount} sessions, provide:
- topic: a short, engaging session title (under 8 words)
- oasFocus: short OAS reference (e.g. "Bushcraft S1", "Community") or empty string if general
- location: usually "Hall" unless the topic suggests somewhere else (e.g. "Park", "Beach")
- bring: any items members should bring, or empty string if nothing special

Return ONLY valid JSON with this exact structure, no markdown, no explanation:
{
  "suggestions": [
    { "topic": "...", "oasFocus": "...", "location": "...", "bring": "..." }
  ]
}

The "suggestions" array must have exactly ${rowCount} items, in a sensible progressive order (build skills week to week where relevant).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SCOUTS_AUSTRALIA_KNOWLEDGE },
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
