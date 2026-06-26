"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SECTION_COLOURS, NAVY } from "@/lib/colours";
import type { GroupConfig } from "@/lib/types";

export default function HelpPage() {
  const router = useRouter();
  const [config, setConfig] = useState<GroupConfig|null>(null);

  useEffect(()=>{
    const c = localStorage.getItem('groupConfig');
    if (c) setConfig(JSON.parse(c));
  },[]);

  const acc  = config ? SECTION_COLOURS[config.section]?.accent||'#C17F24' : '#C17F24';
  const pale = config ? SECTION_COLOURS[config.section]?.pale||'rgba(193,127,36,0.07)' : 'rgba(193,127,36,0.07)';

  return (
    <>
      <style key={acc}>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
        .nav{background:${NAVY};height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
        .nav-l{display:flex;align-items:center;gap:10px;}
        .nav-dot{width:28px;height:28px;border-radius:50%;background:${acc};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;}
        .nav-title{color:#fff;font-size:15px;font-weight:500;}
        .nav-tag{font-size:11px;font-weight:500;padding:2px 9px;border-radius:4px;background:${acc};color:#fff;}
        .nav-group{color:rgba(255,255,255,0.5);font-size:12px;}
        .nav-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);padding:5px 11px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;}
        .nav-btn:hover{background:rgba(255,255,255,0.18);}
        .ph{background:#fff;border-bottom:1px solid #e5e7eb;padding:28px 24px 24px;}
        .bc{font-size:11px;color:#9ca3af;margin-bottom:7px;}
        .ph-title{color:#111827;font-size:22px;font-weight:700;letter-spacing:-0.02em;margin-bottom:4px;}
        .ph-sub{color:#6b7280;font-size:13px;}
        .body{max-width:760px;margin:0 auto;padding:28px 24px 72px;}

        /* Quick start steps */
        .qs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:32px;}
        .qs-step{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:18px 16px;position:relative;}
        .qs-step::before{content:attr(data-n);position:absolute;top:14px;right:14px;font-size:28px;font-weight:700;color:${acc};opacity:0.15;line-height:1;}
        .qs-icon{font-size:22px;margin-bottom:8px;}
        .qs-title{font-size:13px;font-weight:700;color:#111827;margin-bottom:4px;}
        .qs-desc{font-size:12px;color:#6b7280;line-height:1.55;}
        .qs-link{display:inline-block;margin-top:8px;font-size:11px;font-weight:600;color:${acc};cursor:pointer;background:none;border:none;font-family:inherit;padding:0;}
        .qs-link:hover{text-decoration:underline;}

        /* Help sections */
        .help-section{background:#fff;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:16px;overflow:hidden;}
        .hs-head{padding:16px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:10px;border-left:4px solid ${acc};}
        .hs-icon{font-size:18px;flex-shrink:0;}
        .hs-title{font-size:15px;font-weight:700;color:#111827;}
        .hs-body{padding:16px 20px 20px;display:flex;flex-direction:column;gap:14px;}
        .hs-para{font-size:13px;color:#374151;line-height:1.7;}
        .hs-list{display:flex;flex-direction:column;gap:8px;padding-left:2px;}
        .hs-item{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#374151;line-height:1.6;}
        .hs-bullet{width:5px;height:5px;border-radius:50%;background:${acc};flex-shrink:0;margin-top:7px;}
        .hs-sub{font-size:12px;color:#6b7280;line-height:1.55;margin-top:2px;padding-left:13px;}

        /* Note / warning box */
        .note{background:${pale};border:1px solid ${acc}40;border-radius:8px;padding:12px 14px;font-size:12.5px;color:#374151;line-height:1.6;}
        .note strong{color:#111827;}
        .warn{background:#fef9ec;border:1px solid #f0cf80;border-radius:8px;padding:12px 14px;font-size:12.5px;color:#374151;line-height:1.6;}
        .warn strong{color:#92600a;}

        /* Tips */
        .tip-list{display:flex;flex-direction:column;gap:10px;}
        .tip{background:${pale};border-radius:8px;padding:13px 15px;font-size:13px;color:#374151;line-height:1.65;}
        .tip strong{color:#111827;}

        @media(max-width:600px){
          .qs-grid{grid-template-columns:1fr 1fr;}
        }
      `}</style>

      <nav className="nav">
        <div className="nav-l">
          <div className="nav-dot">⚜</div>
          <span className="nav-title">Scout Program Builder</span>
        </div>
        <div className="nav-l" style={{gap:'8px'}}>
          {config && <span className="nav-tag">{config.section}</span>}
          {config && <span className="nav-group">{config.groupName}</span>}
        </div>
        <button className="nav-btn" onClick={()=>router.push('/term')}>← Term plan</button>
      </nav>

      <div className="ph">
        <div className="bc">Home › Help</div>
        <div className="ph-title">Getting Started</div>
        <div className="ph-sub">A quick guide for volunteer leaders — no technical knowledge needed.</div>
      </div>

      <div className="body">

        {/* Quick start */}
        <div className="qs-grid">
          <div className="qs-step" data-n="1">
            <div className="qs-icon">⚙️</div>
            <div className="qs-title">Set up your group</div>
            <div className="qs-desc">Enter your section, meeting day, leaders, and members. Only needed once.</div>
            <button className="qs-link" onClick={()=>router.push('/setup')}>Go to Setup →</button>
          </div>
          <div className="qs-step" data-n="2">
            <div className="qs-icon">📅</div>
            <div className="qs-title">Build your term plan</div>
            <div className="qs-desc">Set term dates to generate all your meeting rows, then fill in topics.</div>
            <button className="qs-link" onClick={()=>router.push('/term')}>Go to Term plan →</button>
          </div>
          <div className="qs-step" data-n="3">
            <div className="qs-icon">📋</div>
            <div className="qs-title">Generate run sheets</div>
            <div className="qs-desc">Click Create on any session — AI builds a full timed meeting plan for you.</div>
            <button className="qs-link" onClick={()=>router.push('/term')}>Go to Term plan →</button>
          </div>
          <div className="qs-step" data-n="4">
            <div className="qs-icon">👥</div>
            <div className="qs-title">Track members</div>
            <div className="qs-desc">Add your Scouts, mark attendance, track OAS stages and milestone progress.</div>
            <button className="qs-link" onClick={()=>router.push('/members')}>Go to Members →</button>
          </div>
        </div>

        {/* Term planner */}
        <div className="help-section">
          <div className="hs-head">
            <span className="hs-icon">📅</span>
            <span className="hs-title">Term Planner</span>
          </div>
          <div className="hs-body">
            <p className="hs-para">The term plan is your home base — it holds every meeting and special event for the term, and is where you kick off AI run sheet generation.</p>
            <div className="hs-list">
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Generate dates</strong> — enter a term start and end date, click Generate dates, and the app creates one row for every meeting day automatically.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Edit a session</strong> — click Edit on any row to set the topic, location, OAS focus, leader, assistant patrol leader, and session notes.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Session notes</strong> — this field is sent to the AI when you generate a run sheet. The more specific you are, the better the output. "Include reef knot and bowline — they're beginners" works much better than just "knots".</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>AI suggest themes</strong> — click this to open a panel where you pick OAS streams and add notes, then AI fills in topics for the whole term at once. You can still edit each row after.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Save plan / Load plan</strong> — download your term plan as a file to back it up, and load it back any time. Also useful for moving your plan to a different device.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Special events</strong> — use the + Special event button to add camps, excursions, or other non-regular events. These sort into the right date order automatically.</div></div>
            </div>
          </div>
        </div>

        {/* Run sheets */}
        <div className="help-section">
          <div className="hs-head">
            <span className="hs-icon">📋</span>
            <span className="hs-title">Run Sheets</span>
          </div>
          <div className="hs-body">
            <p className="hs-para">A run sheet is a complete, timed meeting plan for a single session — everything a leader needs to run the meeting from start to finish.</p>
            <div className="hs-list">
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Create a run sheet</strong> — click the Create button next to any session in the term plan. The AI generates a full session plan in about 10–15 seconds.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>PLAN</strong> — things to prepare and set up before Scouts arrive: materials to gather, room layout, pre-meeting tasks.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>DO — Run Sheet</strong> — the heart of the document: timed activities with full instructions, equipment needed, and safety notes. Opening and Closing Parade steps are included automatically.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>REVIEW</strong> — reflection questions to close the session and check in with Scouts on what they learned.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Participate / Assist / Lead</strong> — suggested activities that link to Scout milestone requirements. Use these to decide who's leading what.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Editing</strong> — click Edit on any activity to change the name, time, or instructions. Add new activities or optional games at the bottom. All edits are saved automatically.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Regenerate</strong> — not happy with the output? Click Regenerate in the top bar for a fresh AI response. Note: this overwrites your manual edits, so finalize edits after you're happy with the structure.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Print / PDF</strong> — click Print in the top bar. Editing controls are hidden automatically so the printed sheet looks clean for leaders to carry.</div></div>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="help-section">
          <div className="hs-head">
            <span className="hs-icon">👥</span>
            <span className="hs-title">Members</span>
          </div>
          <div className="hs-body">
            <p className="hs-para">The Members tab lets you track every Scout in your group — attendance, OAS badge progress, milestone activities, and SIA projects.</p>
            <div className="hs-list">
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Adding members</strong> — click Add member and enter first name, last name, age, and year joined. Members appear in the list immediately.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Attendance</strong> — switch to the Attendance tab and click any cell to mark a Scout present or absent for that session. The percentage updates automatically.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>OAS tracker</strong> — open a member's profile and click a stage number to mark it earned. Click again to un-earn it. Stages fill in left to right as Scouts progress.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Milestone activities</strong> — use Log activity on a member's profile to record Assist and Lead sessions. Choose the session, challenge area, and which milestone it counts toward.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Milestone progress</strong> — the app calculates progress automatically. Participate is counted from attendance; Assist and Lead come from your logged activities. When all targets are met, the milestone is ready to award.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>SIA projects</strong> — log Special Interest Area projects for each member, track status from Planning through to Complete, and add notes as they go.</div></div>
            </div>
          </div>
        </div>

        {/* Saving data */}
        <div className="help-section">
          <div className="hs-head">
            <span className="hs-icon">💾</span>
            <span className="hs-title">Saving Your Data</span>
          </div>
          <div className="hs-body">
            <p className="hs-para">It's important to understand how your data is stored right now — and what to do to keep it safe.</p>
            <div className="hs-list">
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Where it's saved</strong> — all your data lives in your browser's local storage. It stays between visits as long as you use the same browser on the same device.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Backing up</strong> — use the Save plan button on the Term plan page to download a backup file. Save it to your computer or cloud drive. Do this regularly.</div></div>
              <div className="hs-item"><div className="hs-bullet"/><div><strong>Restoring</strong> — use Load plan to restore from a backup file. This also lets you move your term plan to a different computer or share it with another leader.</div></div>
            </div>
            <div className="warn">
              <strong>⚠ Important:</strong> Clearing your browser's site data, cookies, or cached files will permanently erase all your saved data — including members, attendance, and run sheets. Back up your term plan file regularly so you never lose your work.
            </div>
            <div className="note">
              A proper cloud database (Supabase) is planned for a future update. Once that's in place, your data will sync across devices and be stored safely online — no more browser-only limitations.
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="help-section">
          <div className="hs-head">
            <span className="hs-icon">💡</span>
            <span className="hs-title">Tips</span>
          </div>
          <div className="hs-body">
            <div className="tip-list">
              <div className="tip"><strong>Session notes drive the AI.</strong> Whatever you write in the Session notes field on a term plan row gets sent directly to the AI when you generate a run sheet. Be specific — "camp cooking, damper and billy tea, focus on fire safety" gives much richer results than "cooking".</div>
              <div className="tip"><strong>OAS focus flows through to activities.</strong> The OAS focus tag you set on a session row appears on activities in the run sheet — making it easy to mark off badge progress after the meeting.</div>
              <div className="tip"><strong>Finalize edits after regenerating.</strong> Clicking Regenerate creates a fresh AI response and overwrites any manual edits. Get the structure right first with AI, then make your manual tweaks.</div>
              <div className="tip"><strong>Print hides the clutter.</strong> The Print button (or ⌘P / Ctrl+P) hides all editing buttons and controls automatically — the printed sheet looks clean and professional for leaders to use at meetings.</div>
              <div className="tip"><strong>Run sheets are saved automatically.</strong> As soon as a run sheet is generated — and whenever you edit it — it's saved. Come back to it any time from the Run Sheets tab without needing to regenerate.</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
