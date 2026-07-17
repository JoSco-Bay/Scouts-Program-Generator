"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SECTION_COLOURS, NAVY } from "@/lib/colours";
import type { GroupConfig } from "@/lib/types";
import { loadGroupRecord, saveGroupConfig } from "@/lib/db";

const SECTIONS = Object.entries(SECTION_COLOURS).map(([id, v]) => ({ id, ...v }));
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ── Tooltip component (replaces dangerouslySetInnerHTML) ──────────────────────
function InfoBtn({ title, body, tip }: { title: string; body: string; tip?: string }) {
  return (
    <span className="info-btn">
      i
      <div className="tt">
        <div className="tt-title">{title}</div>
        <div className="tt-body">{body}</div>
        {tip && <div className="tt-tip">{tip}</div>}
      </div>
    </span>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const [groupId, setGroupId]       = useState<string | null>(null);
  const [dbLoading, setDbLoading]   = useState(true);
  const [groupName, setGroupName]   = useState('');
  const [section, setSection]       = useState<keyof typeof SECTION_COLOURS>('Joeys');
  const [meetingDay, setMeetingDay] = useState('Wednesday');
  const [meetingTime, setMeetingTime] = useState('18:00');
  const [leaders, setLeaders]       = useState(['']);
  const [members, setMembers]       = useState(['']);

  // ── Tooltip click handler ──────────────────────────────────────────────────
  useEffect(() => {
    function closeAll() {
      document.querySelectorAll('.tt').forEach(t => t.classList.remove('show'));
      document.querySelectorAll('.info-btn').forEach(b => b.classList.remove('open'));
    }
    function handleClick(e: MouseEvent) {
      const btn = (e.target as Element).closest('.info-btn');
      if (!btn) { closeAll(); return; }
      const tt = btn.querySelector('.tt');
      const wasOpen = tt && tt.classList.contains('show');
      closeAll();
      if (tt && !wasOpen) { tt.classList.add('show'); btn.classList.add('open'); }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ── Load group from Supabase (by groupId in localStorage) ─────────────────
  useEffect(() => {
    async function load() {
      const record = await loadGroupRecord('');
      if (record) {
        setGroupId(record.id);
        const c = record.config;
        setGroupName(c.groupName || '');
        setSection((c.section as keyof typeof SECTION_COLOURS) || 'Joeys');
        setMeetingDay(c.meetingDay || 'Wednesday');
        setMeetingTime(c.meetingTime || '18:00');
        setLeaders(c.leaders?.length ? c.leaders : ['']);
        setMembers(c.members?.length ? c.members : ['']);
      } else {
        // Fall back to localStorage cache
        const cached = localStorage.getItem('groupConfig');
        if (cached) {
          try {
            const c: GroupConfig = JSON.parse(cached);
            setGroupName(c.groupName || '');
            setSection((c.section as keyof typeof SECTION_COLOURS) || 'Joeys');
            setMeetingDay(c.meetingDay || 'Wednesday');
            setMeetingTime(c.meetingTime || '18:00');
            setLeaders(c.leaders?.length ? c.leaders : ['']);
            setMembers(c.members?.length ? c.members : ['']);
          } catch {}
        }
      }
      setDbLoading(false);
    }
    load();
  }, []);

  const acc     = SECTION_COLOURS[section]?.accent || '#C17F24';
  const accText = SECTION_COLOURS[section]?.text   || '#fff';

  const save = async () => {
    try {
      const config: GroupConfig = {
        groupName,
        section,
        meetingDay,
        meetingTime,
        leaders: leaders.filter(Boolean),
        members: members.filter(Boolean),
      };
      const newGroupId = await saveGroupConfig('', groupId, config);
      setGroupId(newGroupId);
      localStorage.setItem('groupConfig', JSON.stringify(config));
      router.push('/term');
    } catch (err) {
      console.error('saveGroupConfig failed:', err);
    }
  };

  if (dbLoading) return null;

  return (
    <>
      <style key={acc}>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
        .nav{background:${NAVY};height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
        .back{color:rgba(255,255,255,0.65);font-size:13px;text-decoration:none;display:flex;align-items:center;gap:5px;}
        .back:hover{color:#fff;}
        .nav-r{display:flex;align-items:center;gap:8px;}
        .nav-dot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;}
        .nav-label{color:#fff;font-size:14px;font-weight:500;}
        .nav-help{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);padding:5px 11px;border-radius:6px;font-size:12px;text-decoration:none;}
        .ph{background:#fff;border-bottom:1px solid #e5e7eb;padding:28px 24px 24px;text-align:center;}
        .ph-step{font-size:11px;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;}
        .ph-title{font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.02em;margin-bottom:4px;line-height:1.1;}
        .ph-title em{font-style:italic;font-weight:400;}
        .ph-sub{font-size:13px;color:#9ca3af;}
        .body{max-width:580px;margin:0 auto;padding:24px 24px 60px;}
        .card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:14px;}
        .card-head{padding:13px 18px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#111827;display:flex;align-items:center;gap:9px;}
        .cn{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0;}
        .card-opt{font-size:11px;color:#9ca3af;font-weight:400;margin-left:2px;}
        .cb{padding:16px 18px;}
        .field{margin-bottom:14px;}
        .field:last-child{margin-bottom:0;}
        .lbl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;margin-bottom:5px;}
        input,select{width:100%;border:1px solid #d1d5db;border-radius:6px;padding:8px 10px;font-size:13px;color:#111827;font-family:inherit;outline:none;background:#fff;transition:border-color 0.15s;}
        input:focus,select:focus{border-color:${acc};box-shadow:0 0 0 3px ${acc}18;}
        .seg{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:4px;}
        .sb{padding:10px 4px;border-radius:6px;border:2px solid transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;background:transparent;color:#6b7280;transition:all 0.15s;text-align:center;line-height:1.3;}
        .sb.on{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.1);}
        .sb-age{font-size:10px;color:#9ca3af;font-weight:400;margin-top:2px;}
        .sb.on .sb-age{color:#6b7280;}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .lrow{display:flex;gap:7px;margin-bottom:8px;align-items:center;}
        .lrow input{flex:1;margin:0;}
        .rm{width:32px;height:32px;flex-shrink:0;border:1px solid #e5e7eb;border-radius:6px;background:#fff;cursor:pointer;color:#9ca3af;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
        .rm:hover{border-color:#ef4444;color:#ef4444;background:#fef2f2;}
        .add-link{font-size:12px;cursor:pointer;background:none;border:none;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;font-weight:500;}
        .info-btn{width:16px;height:16px;border-radius:50%;border:1.5px solid #d1d5db;background:#f9fafb;color:#9ca3af;font-size:10px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;position:relative;font-style:italic;font-family:Georgia,serif;vertical-align:middle;line-height:1;}
        .info-btn:hover,.info-btn.open{border-color:#C17F24;background:rgba(193,127,36,0.08);color:#C17F24;}
        .tt{position:absolute;top:calc(100% + 7px);right:-4px;width:220px;background:#fff;border:0.5px solid #e5e7eb;border-radius:8px;padding:10px 12px;box-shadow:0 4px 14px rgba(0,0,0,0.1);z-index:100;text-align:left;display:none;pointer-events:none;}
        .tt.show{display:block;}
        .tt::before{content:'';position:absolute;top:-5px;right:8px;width:8px;height:8px;background:#fff;border-top:0.5px solid #e5e7eb;border-left:0.5px solid #e5e7eb;transform:rotate(45deg);}
        .tt-title{font-size:12px;font-weight:600;color:#111827;margin-bottom:4px;}
        .tt-body{font-size:11.5px;color:#6b7280;line-height:1.55;}
        .tt-tip{font-size:11px;color:#C17F24;margin-top:6px;display:flex;align-items:baseline;gap:4px;}
        .tt-tip::before{content:'→';flex-shrink:0;}
        .save{width:100%;padding:14px;border-radius:8px;border:none;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity 0.2s;letter-spacing:-0.01em;}
        .save:hover{opacity:0.9;}
      `}</style>

      <nav className="nav">
        <a href="/" className="back">← Scout Program Builder</a>
        <div className="nav-r" style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <a href="/help" className="nav-help">? Help</a>
          <div className="nav-dot" style={{background:acc}}>⚜</div>
          <span className="nav-label">Group setup</span>
        </div>
      </nav>

      <div className="ph">
        <div className="ph-step">Step 1 of 3 · Group setup</div>
        <div className="ph-title">Set up your <em style={{color:acc}}>group</em></div>
        <div className="ph-sub">Saved to your account — update any time</div>
      </div>

      <div className="body">
        <div className="card">
          <div className="card-head">
            <div className="cn" style={{background:acc}}>1</div>
            Group details
            <InfoBtn
              title="Group details"
              body="Your group name appears on every term plan and run sheet. The section sets the colour theme throughout the app."
            />
          </div>
          <div className="cb">
            <div className="field">
              <div className="lbl">Group name</div>
              <input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="e.g. 1st Bayview Sea Scouts"/>
            </div>
            <div className="field">
              <div className="lbl">Scout section</div>
              <div className="seg">
                {SECTIONS.map(s=>(
                  <button key={s.id} className={`sb${section===s.id?' on':''}`}
                    style={section===s.id?{borderColor:s.accent,color:'#111827'}:{}}
                    onClick={()=>setSection(s.id as keyof typeof SECTION_COLOURS)}>
                    {s.id}<div className="sb-age">{s.age}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="cn" style={{background:acc}}>2</div>
            Meeting schedule
            <InfoBtn
              title="Meeting schedule"
              body="Your usual meeting day and time. The term planner uses this to auto-generate all your session dates when you enter term start and end dates."
              tip="You can override the time for individual sessions in the term plan"
            />
          </div>
          <div className="cb">
            <div className="two">
              <div className="field">
                <div className="lbl">Day</div>
                <select value={meetingDay} onChange={e=>setMeetingDay(e.target.value)}>
                  {DAYS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <div className="lbl">Start time</div>
                <input type="time" value={meetingTime} onChange={e=>setMeetingTime(e.target.value)}/>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="cn" style={{background:acc}}>3</div>
            Leaders
            <InfoBtn
              title="Leaders"
              body="Add all leaders who run sessions. The first leader is set as default on each term plan row — you can change who leads each night individually."
              tip="Co-leaders can be assigned per session in the term plan"
            />
          </div>
          <div className="cb">
            {leaders.map((l,i)=>(
              <div key={i} className="lrow">
                <input value={l} onChange={e=>setLeaders(ls=>ls.map((x,j)=>j===i?e.target.value:x))} placeholder={i===0?'Leader name (e.g. Wade)':'Co-leader name'}/>
                {leaders.length>1&&<button className="rm" onClick={()=>setLeaders(ls=>ls.filter((_,j)=>j!==i))}>×</button>}
              </div>
            ))}
            <button className="add-link" style={{color:acc}} onClick={()=>setLeaders(ls=>[...ls,''])}>+ Add another leader</button>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="cn" style={{background:acc}}>4</div>
            Members <span className="card-opt">optional</span>
            <InfoBtn
              title="Members list"
              body="Add your member names here — they'll appear in the leader and patrol dropdowns in the term plan. To track attendance, OAS progress, and milestones, add members properly in the Members tab."
              tip="Members tab is where full tracking happens"
            />
          </div>
          <div className="cb">
            {members.map((m,i)=>(
              <div key={i} className="lrow">
                <input value={m} onChange={e=>setMembers(ms=>ms.map((x,j)=>j===i?e.target.value:x))} placeholder="Member name"/>
                {members.length>1&&<button className="rm" onClick={()=>setMembers(ms=>ms.filter((_,j)=>j!==i))}>×</button>}
              </div>
            ))}
            <button className="add-link" style={{color:acc}} onClick={()=>setMembers(ms=>[...ms,''])}>+ Add member</button>
          </div>
        </div>

        <button className="save" style={{background:acc,color:accText}} onClick={save}>
          Save and start planning →
        </button>
      </div>

    </>
  );
}
