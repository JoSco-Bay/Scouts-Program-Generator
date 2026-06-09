import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { activityName, activityContext, section, oasContext } = body;

  if (!activityName) {
    return Response.json({ error: "No activity name provided" }, { status: 400 });
  }

  const prompt = `Generate a complete Scout activity resource for: ${activityName}
Scout Section: ${section ?? "Scouts"}
Context: ${activityContext ?? ""}
OAS: ${oasContext ?? ""}

Return ONLY valid JSON with this structure:
{
  "title": "${activityName}",
  "tagline": "one sentence description",
  "oasLink": "OAS stream and stage or empty string",
  "duration": "e.g. 20 minutes",
  "groupSize": "e.g. 6-24 Scouts",
  "difficulty": "Easy",
  "instructions": {
    "overview": "2-3 sentence overview",
    "setup": ["step 1", "step 2"],
    "runSheet": [
      {"time": "0:00", "action": "Opening", "leaderNotes": "note"},
      {"time": "0:05", "action": "Main activity", "leaderNotes": "note"},
      {"time": "0:20", "action": "Debrief", "leaderNotes": "note"}
    ],
    "equipment": {
      "fromShed": ["item 1"],
      "toBring": ["item 1"],
      "consumables": ["item 1"]
    },
    "safety": ["hazard 1", "hazard 2"],
    "variations": {
      "easier": "simplification for younger scouts",
      "harder": "how to make more challenging"
    }
  },
  "leaderScript": {
    "intro": "word for word intro script",
    "instructions": "word for word instructions script",
    "debrief": "word for word debrief script",
    "reflectionQuestions": ["Question 1?", "Question 2?", "Question 3?"]
  },
  "printable": {
    "needed": false,
    "reason": "explanation of why printable is or isnt needed",
    "type": null,
    "title": null,
    "content": null
  }
}

Only set printable.needed true if activity needs something that cannot come from a scout shed such as a nature photo puzzle, coded message, orienteering map, or first aid scenario card. Rope, flags, compasses do NOT need printables.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert Scouts Australia activity planner. Return valid JSON only." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const activity = JSON.parse(raw);
    return Response.json({ activity });
  } catch (err) {
    console.error("generate-activity error:", err);
    return Response.json({ error: "Failed to generate activity" }, { status: 500 });
  }
}
