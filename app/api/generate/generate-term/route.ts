import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { activityName, activityContext, section, oasContext } = body;

  // ── Step 1: Generate instructions + leader script + decide on printable ──

  const mainPrompt = `
You are generating a complete activity resource for a Scout leader.

Activity: ${activityName}
Scout Section: ${section ?? "Scouts"}
Context from session plan: ${activityContext ?? ""}
OAS relevance: ${oasContext ?? ""}

Generate a JSON response with EXACTLY this structure (no markdown, pure JSON):

{
  "title": "Activity title",
  "tagline": "One sentence describing what this activity is",
  "oasLink": "Which OAS stream and stage this supports, or empty string",
  "duration": "Suggested duration e.g. 20 minutes",
  "groupSize": "e.g. 6–24 Scouts",
  "difficulty": "Easy / Moderate / Challenging",

  "instructions": {
    "overview": "2–3 sentence overview of the activity",
    "setup": ["step 1", "step 2", "..."],
    "runSheet": [
      { "time": "0:00", "action": "...", "leaderNotes": "..." }
    ],
    "equipment": {
      "fromShed": ["item 1", "item 2"],
      "toBring": ["item 1", "item 2"],
      "consumables": ["item 1"]
    },
    "safety": ["hazard and mitigation 1", "hazard 2"],
    "variations": {
      "easier": "How to make it easier for younger/less experienced Scouts",
      "harder": "How to make it more challenging"
    }
  },

  "leaderScript": {
    "intro": "Word-for-word script for how to introduce this activity to Scouts",
    "instructions": "Script for explaining the rules/objectives",
    "debrief": "Script for the debrief/reflection at the end",
    "reflectionQuestions": ["question 1", "question 2", "question 3"]
  },

  "printable": {
    "needed": true or false,
    "reason": "Why a printable is or isn't needed — e.g. 'Scouts need a nature photo grid to cut up' or 'All equipment available from shed'",
    "type": one of: "nature_puzzle" | "orienteering_sheet" | "first_aid_scenario" | "cipher_sheet" | "kims_game_sheet" | "scenario_card" | "worksheet" | null,
    "title": "Title for the printable sheet or null",
    "content": {
      // For nature_puzzle: { "items": ["Banksia", "Grevillea", "...12 nature items"], "instructions": "Cut along the lines..." }
      // For orienteering_sheet: { "controls": [{"id":"A","clue":"Near the big gum tree"},{"id":"B","clue":"..."}], "bearings": [{"from":"Start","to":"A","bearing":"045"},{"from":"A","to":"B","bearing":"..."}], "instructions": "..." }
      // For first_aid_scenario: { "scenario": "...", "patientCondition": ["..."], "actions": ["step 1", "step 2"], "debrief": "..." }
      // For cipher_sheet: { "cipherType": "Caesar / Morse / ...", "key": {...}, "messages": ["encoded message 1", "..."], "instructions": "..." }
      // For kims_game_sheet: { "items": ["compass", "bandage", "...20 items"], "instructions": "..." }
      // For scenario_card: { "scenario": "...", "roles": ["Scout 1: ...", "Scout 2: ..."], "objectives": ["..."] }
      // For worksheet: { "title": "...", "sections": [{"heading": "...", "lines": 5}] }
      // If needed is false: null
    }
  }
}

Return ONLY the JSON. No markdown fences, no explanation.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 3000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are an expert Scouts Australia activity planner. You produce complete, practical activity resources for volunteer leaders. A printable is only needed when the activity requires something that cannot be sourced from a standard Scout hall — e.g. a nature photo puzzle, a coded message, a scenario description, an orienteering course map. Rope, flags, compasses, and general equipment do NOT need printables. Always return valid JSON.",
      },
      { role: "user", content: mainPrompt },
    ],
  });

  let activityData: Record<string, unknown>;
  try {
    const raw = completion.choices[0].message.content ?? "{}";
    activityData = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Failed to parse activity data" }, { status: 500 });
  }

  return Response.json({ activity: activityData });
}
