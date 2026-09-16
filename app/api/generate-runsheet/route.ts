import OpenAI from "openai";

const SCOUTS_AUSTRALIA_KNOWLEDGE = `
You are an expert Scouts Australia program planner with deep knowledge of the Australian Scout program framework. Always generate content that aligns with official Scouts Australia guidelines.

THE SCOUT METHOD (8 elements - reflect all in every program):
1. Learning by Doing — practical hands-on activities, never classroom style. Scouting events and weekly nights should not be a classroom even though education is occurring.
2. Community Involvement — service to community, positive and visible community members
3. Nature and the Outdoors — Scouting believes outdoors is the primary and most effective setting for learning. Each section should spend significant time outdoors.
4. Promise and Law — Scout values underpin ALL activities and interactions. Reference at Opening and Closing Parade.
5. Patrol System — teamwork, responsibility, belonging. Most activities occur in patrols.
6. Personal Progression — individual challenge, each Scout at their own pace, striving for personal best
7. Symbolic Framework — Opening Parade, Closing Parade, Scout Promise, section-specific ceremonies
8. Youth Leading Adults Supporting — Scouting is a youth movement guided by adults. Participate/Assist/Lead structure embodies this.

SPICES DEVELOPMENT AREAS (outcomes every program should develop):
- Spiritual: beliefs, reflection, respect for others, thankfulness, sense of purpose
- Physical: health, fitness, adventure, being active outdoors
- Intellectual: planning, innovation, creativity, adaptability, acquiring new information
- Character: personal best, responsibility, respect, commitment, autonomy
- Emotional: emotional awareness, expressing feelings positively, supporting others
- Social: relationships, belonging, teamwork, diversity, inclusion, community

OAS STREAMS — 9 official Scouts Australia streams, Stages 1-9:
Core (expected for most Scouts): Bushcraft, Bushwalking, Camping
Specialist (optional, diverse choice): Alpine, Aquatics, Boating, Cycling, Paddling, Vertical
IMPORTANT: Community, Creative and Personal Growth are NOT OAS streams — they are Challenge Areas.

CHALLENGE AREAS — 4 areas for a balanced program:
Community, Creative, Outdoors, Personal Growth
A balanced term should include activities from ALL 4 Challenge Areas across the program cycle.

SECTION CHARACTERISTICS:
Joey Scouts (5-8 yrs): Discovering adventure, highly supportive environment, adults encourage trying new things, simple hands-on activities, fun and interactive, beginning the Scouting journey. Focus on exploring new skills and discovering what they enjoy. Activities must be age-appropriate for 5-8 year olds — simple instructions, short attention spans, movement-based, fun.
Cub Scouts (8-11 yrs): Greater variety of activities, beginning to take risks and make mistakes, input into program at planning and reviewing stages, new and challenging experiences, increased independence.
Scouts (11-15 yrs): Self-managing, taking initiative, identifying own interests and goals which drive the program, responsible risk taking, leading activities, diverse and inclusive program.
Venturer Scouts (15-18 yrs): Drivers of own learning and program, complete independence in planning, exploration and pushing personal boundaries.

PLAN>DO>REVIEW CYCLE — every session must follow this structure:
PLAN: Leader preparation checklist, safety checks, equipment setup, briefing
DO: The timed activities themselves, sequenced logically
REVIEW: Reflection questions linking to SPICES development — what did we learn, how did we grow, what would we do differently

PARTICIPATE/ASSIST/LEAD for milestone tracking:
Participate = attendance and involvement in the activity (auto-counted from attendance)
Assist:
  Milestone 1: Assist with a game
  Milestone 2: Assist with a game or small activity
  Milestone 3: Assist including helping with planning or reviewing
Lead:
  Milestone 1: Take a leading role in a game or small activity
  Milestone 2: Lead a game or small activity
  Milestone 3: Lead including helping to plan and review
All can be completed with adult assistance as required.

OAS STAGE 1 REQUIREMENTS (for generating accurate activities):

BUSHCRAFT STAGE 1:
PLAN: Know why it's important to stick to trails (minimise environmental impact, reduce getting lost), know the Buddy System (stay in pairs/threes, stay with leaders, know boundaries), know what to do when lost (stop and assess, retrace steps, stay where you are), know your address and location in an emergency, know 3 reasons for shelter (warmth, weather protection, comfort, storage, insects, environmental impact)
DO: Strike a match safely, collect sticks for a campfire (dry wood, different thicknesses, kindling thinner than a finger), be safe around a campfire (appropriate clothing, no flammable items, put out with water only), demonstrate stop/drop/roll, find emergency exit and muster point, participate in a navigation game using cardinal points, hang a clothesline with a clove hitch knot, pack ropes correctly (straight coil not elbow wrap), know dilly bag/mess kit contents and hygiene
REVIEW: Talk about what they enjoyed, learnt or improved from the navigational game

BUSHWALKING STAGE 1:
PLAN: Pack a day backpack (food, water, wet weather gear, warm clothing, sun protection, heaviest items to spine), dress appropriately for a day walk (boots, pants, hat, no cotton, no camouflage — hard to find if lost), list food to bring on a day bushwalk, know why to stick to trails, know why to stop when lost in the bush, know the buddy system, put together a personal first aid kit (roller bandage, triangular bandage, band aids, antiseptic swabs)
DO: Identify the four main cardinal points of the compass, identify the main parts of a compass (baseplate, bezel/capsule, needle), attend at least one bushwalk of at least one hour through parkland (not entirely along suburban streets), demonstrate safe behaviour while bushwalking (stay with group, minimise environmental impact, watch for risks, cooperate as a team member)
REVIEW: Talk about what they enjoyed or learnt from going on a bushwalk

CAMPING STAGE 1:
PLAN: Know the buddy system at camp, know the boundaries of where they may go at camp, know what to do when lost while camping (stop, stay where you are), know the basic elements needed to make a fire (combustion triangle — fuel/kindling/wood, heat/matches/lighter/flint, oxygen), know that they should follow directions from the leader
DO: Help pack a bag for camp (clothing, toiletries, bedding, activity gear, swimmers, rain jacket), strike a match, help prepare food for cooking at camp (hand washing, food handling, heating, cooling, knife safety), spend two nights at camps or Scout sleep-overs (not necessarily consecutive), set up in an existing campsite with minimal impact, set out their sleeping area (sleeping bag, roll mat, pillow, neat and tidy), care for their basic personal gear on an overnight camp
REVIEW: Talk about what they enjoyed, learnt or improved by participating in the camp or sleep-over
`;

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
    const regenInstructions = instructions ? `\n\nIMPORTANT — the leader has requested these specific changes: ${instructions}` : '';

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
- challengeAreas: choose 1-3 from exactly these: "Community","Creative","Outdoors","Personal Growth"
- activities MUST start with "OPENING PARADE" at ${row.time || '6:00pm'} with detail "To be led by ___________ – explain why we do open and closing parade." plus a short intro line relevant to tonight's topic.
- Then 3-5 main activities/games, each in the style: "GAME: [Name]" or "ACTIVITY: [Name]" or "ACTIVITY. [Name]:" followed by equipment list (if any) then clear numbered/step instructions written the way a volunteer leader would explain it to other parents helping out — practical, conversational, age-appropriate for ${config.section}.
- Include realistic timings starting from ${row.time || '6:00pm'}, roughly 5-15 min per activity, finishing by 7:00pm (60 min session) unless the topic suggests longer.
- Make at least one activity tie to the OAS focus "${row.oasFocus || 'General'}" if provided — set its oasTag to a short reference like "Bushcraft S1" and include the specific skill/step in the detail.
- The LAST activity MUST be "CLOSING PARADE" with detail "To be led by ___________." plus a brief reflection prompt.
- Set hasRecipe:true ONLY if an activity involves cooking/making food.
- One activity near the start or end can be optional:true (e.g. a coming-in game or backup activity).
- plan: 2-4 short prep items (equipment to gather, tables to set up, things to plan ahead) — phrased like "Bring X" or "Set up Y" or "Plan a route for Z"
- review: 2-4 short reflection prompts a leader could ask the group at the end, linked to SPICES development areas where relevant
- participate/assist/lead: 2-3 short phrases each, age-appropriate, describing how a member could engage at each level for THIS topic specifically (not generic)
- itemsRequired: 4-8 concrete physical items needed for tonight's activities`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${SCOUTS_AUSTRALIA_KNOWLEDGE}

${isMultiDay
            ? `You are writing a single day's plan within a multi-day camp/event for Scouts Australia. Return only valid JSON, no markdown fences, no explanation.`
            : `You are writing a session plan in the official Joey/Cub/Scout PLAN-DO-REVIEW format used by Scouts Australia. Return only valid JSON, no markdown fences, no explanation.`}`,
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
  "challengeAreas": ["Outdoors","Creative"],
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
