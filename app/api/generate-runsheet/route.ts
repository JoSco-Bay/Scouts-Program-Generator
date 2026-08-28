import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "OPENAI_API_KEY is not set on the server" }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });

    const { row, config, multiDayInfo, instructions } = await req.json();
    if (!row || !config) {
      return Response.json({ error: "Missing session or group info" }, { status: 400 });
    }
    const sessionNotes = row.sessionNotes ? '\nLeader notes: ' + row.sessionNotes : '';
    const regenInstructions = instructions ? `\n\nIMPORTANT — the leader has requested these specific changes, incorporate them into the plan: ${instructions}` : '';

    const isMultiDay = !!multiDayInfo;
    const dayNumber = multiDayInfo?.dayNumber;
    const totalDays = multiDayInfo?.totalDays;
    const eventName = multiDayInfo?.eventName;
    const eventLocation = multiDayInfo?.location || row.location;

    let dayPhase = '';
    if (isMultiDay) {
      if (dayNumber === 1) {
        dayPhase = 'This is the ARRIVAL day of the event — focus on arrival logistics, settling in (pitching tents/unpacking), orientation and camp rules, an ice-breaker activity, dinner, and an evening program (e.g. campfire or night activity). There is no morning routine to plan for.';
      } else if (dayNumber === totalDays) {
        dayPhase = 'This is the FINAL/DEPARTURE day of the event — focus on a morning routine (wake-up, flag, breakfast), pack-down and clean-up, a shorter closing activity or ceremony, and departure logistics. There is no evening program on a departure day.';
      } else {
        dayPhase = 'This is a FULL DAY at the event (not arrival or departure) — include a morning routine (wake-up, flag/parade, breakfast), daytime activities, all relevant meals, and an evening program.';
      }
    }

    const introLine = isMultiDay
      ? `Write a complete day plan for Day ${dayNumber} of ${totalDays} of "${eventName}", a multi-day Scout camp/event — this is a full CAMP DAY plan, not a standard weekly meeting format.`
      : `Write a complete session plan for this Scout meeting, in the traditional PLAN/DO/REVIEW format.`;

    const staffingLines = [
      `Leader: ${row.leader || 'Leader'}`,
      row.coLeaders ? `Co-leaders: ${row.coLeaders}` : '',
      row.guestLeaders ? `Guest/Region leaders: ${row.guestLeaders}` : '',
      row.helperParents ? `Helper parents: ${row.helperParents}` : '',
      `Assistant Patrol Leader: ${row.assistantPatrol || 'None'}`,
    ].filter(Boolean).join('\n');

    const multiDayGuidelines = `GUIDELINES — this is a camp/multi-day event day, NOT a standard weekly meeting:
- ${dayPhase}
- Structure activities across the full day in clear time blocks, using only the sections relevant to this day's phase: Morning routine, Meals (breakfast/lunch/dinner as relevant), Daytime activities, Evening program.
- Include realistic timings spanning the whole day (e.g. roughly 7:00am to 9:00pm for a full day, later start on arrival day, earlier finish on departure day) — NOT a 60-minute session.
- activities: 8-14 items covering the full day, each with a clear time, a short name (e.g. "BREAKFAST", "MORNING ACTIVITY: Bushcraft skills", "CAMPFIRE"), and detail written the way a volunteer leader would explain it to helper parents — practical, conversational, age-appropriate for ${config.section}.
- Make at least one activity tie to the OAS focus "${row.oasFocus || 'General'}" if provided — set its oasTag to a short reference like "Camping S2" and include the specific skill/step in the detail.
- Set hasRecipe:true for any meal/cooking activity.
- One activity can be optional:true (e.g. a free-time or backup wet-weather activity).
- plan: 2-4 short prep items specific to camp-day logistics (equipment, food, transport, briefing helpers)
- review: 2-4 short reflection prompts suited to a camp day
- participate/assist/lead: 2-3 short phrases each, age-appropriate, describing how a member could engage at each level for THIS day specifically
- itemsRequired: 4-10 concrete camp-specific items needed for this day (tents, cooking gear, first aid, torches, etc. as relevant)`;

    const standardGuidelines = `GUIDELINES — follow the real Scout session format closely:
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
- itemsRequired: 4-8 concrete physical items needed for tonight's activities`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: isMultiDay
            ? `You are an expert Scout leader writing a single day's plan within a multi-day camp/event for Scouts Australia. Return only valid JSON, no markdown fences, no explanation.`
            : `You are an expert Scout leader writing a session plan in the official Joey/Cub/Scout PLAN-DO-REVIEW format used by Scouts Australia. Return only valid JSON, no markdown fences, no explanation.`,
        },
        {
          role: "user",
          content: `${introLine}

Section: ${config.section}
Group: ${config.groupName}
${isMultiDay ? `Event: ${eventName} (Day ${dayNumber} of ${totalDays})` : `Topic: ${row.topic || 'General meeting'}`}
Date: ${row.date || 'TBC'}
${isMultiDay ? '' : `Start time: ${row.time || '6:00pm'}\n`}Location: ${eventLocation || 'Hall'}
OAS Focus: ${row.oasFocus || 'General'}${sessionNotes}
${staffingLines}

Return ONLY this JSON structure:
{
  "tagline": "One sentence describing ${isMultiDay ? "this day's plan" : "tonight's session"} (e.g. 'Learn to tie knots and set up fishing tackle')",
  "challengeAreas": ["Outdoor","Creative"],
  "plan": [
    "Item leaders need to prepare/bring before ${isMultiDay ? 'this day' : 'the session'}, as a short phrase",
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
    "Reflection question or review prompt for ${isMultiDay ? 'this day' : "tonight's session"}",
    "Another review prompt"
  ],
  "participate": ["What a Joey/Cub/Scout does when participating in this day's activities"],
  "assist": ["What a more experienced member could do to assist others"],
  "lead": ["What a Patrol Leader / older member could lead"],
  "itemsRequired": ["Equipment item 1","Equipment item 2"]
}

${isMultiDay ? multiDayGuidelines : standardGuidelines}

Write in the same plain, practical, slightly informal tone real Scout leaders use — short sentences, equipment lists, step-by-step instructions a parent helper could follow without prior knowledge.${regenInstructions}`,
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

    return Response.json({
      tagline:        data.tagline        || '',
      challengeAreas: data.challengeAreas || [],
      plan:           data.plan           || [],
      activities:     data.activities     || [],
      review:         data.review         || [],
      participate:    data.participate    || [],
      assist:         data.assist         || [],
      lead:           data.lead           || [],
      itemsRequired:  data.itemsRequired  || [],
    });
  } catch (err: any) {
    console.error("generate-runsheet error:", err);
    return Response.json({ error: err.message || "Failed to generate run sheet" }, { status: 500 });
  }
}
