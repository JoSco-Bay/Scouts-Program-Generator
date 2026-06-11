"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SECTIONS = [
  { id:'Joeys',     age:'5–8 yrs',   accent:'#C17F24', text:'#fff'    },
  { id:'Cubs',      age:'8–11 yrs',  accent:'#E8B800', text:'#3d2800' },
  { id:'Scouts',    age:'11–15 yrs', accent:'#6BBF5A', text:'#fff'    },
  { id:'Venturers', age:'15–18 yrs', accent:'#B5485E', text:'#fff'    },
];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function SetupPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [section, setSection] = useState('Joeys');
  const [meetingDay, setMeetingDay] = useState('Wednesday');
  const [meetingTime, setMeetingTime] = useState('18:00');
  const [leaders, setLeaders] = useState(['']);
  const [members, setMembers] = useState(['']);

  useEffect(()=>{
    const saved = localStorage.getItem('scoutGroupConfig');
    if(saved){ const c=JSON.parse(saved); setGroupName(c.groupName||''); setSection(c.section||'Joeys'); setMeetingDay(c.meetingDay||'Wednesday'); setMeetingTime(c.meetingTime||'18:00'); setLeaders(c.leaders?.length?c.leaders:['']); setMembers(c.members?.length?c.members:['']); }
  },[]);

  const acc = SECTIONS.find(s=>s.id===section)?.accent||'#C17F24';
  const accText = SECTIONS.find(s=>s.id===section)?.text||'#fff';

  const save=()=>{ localStorage.setItem('scoutGroupConfig',JSON.stringify({groupName,section,meetingDay,meetingTime,leaders:leaders.filter(Boolean),members:members.filter(Boolean)})); router.push('/term'); };

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
        .nav{background:#2C3E6B;height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
        .back{color:rgba(255,255,255,0.65);font-size:13px;text-decoration:none;display:flex;align-items:center;gap:5px;}
        .back:hover{color:#fff;}
        .nav-r{display:flex;align-items:center;gap:8px;}
        .nav-dot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;}
        .nav-label{color:#fff;font-size:14px;font-weight:500;}
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
        .add-link{font-size:12px;cursor:pointer;background:none;border:none;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;font-weight:500;text-decoration:none;}
        .save{width:100%;padding:14px;border-radius:8px;border:none;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity 0.2s;letter-spacing:-0.01em;}
        .save:hover{opacity:0.9;}
      `}</style>

      <nav className="nav">
        <a href="/" className="back">← Scout Program Builder</a>
        <div className="nav-r">
          <div className="nav-dot" style={{background:acc}}>⚜</div>
          <span className="nav-label">Group setup</span>
        </div>
      </nav>

      <div className="ph">
        <div className="ph-step">Step 1 of 3 · Group setup</div>
        <div className="ph-title">Set up your <em style={{color:acc}}>group</em></div>
        <div className="ph-sub">Saved locally — you can update this any time</div>
      </div>

      <div className="body">
        <div className="card">
          <div className="card-head"><div className="cn" style={{background:acc}}>1</div> Group details</div>
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
                    onClick={()=>setSection(s.id)}>
                    {s.id}<div className="sb-age">{s.age}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="cn" style={{background:acc}}>2</div> Meeting schedule</div>
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
          <div className="card-head"><div className="cn" style={{background:acc}}>3</div> Leaders</div>
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
          <div className="card-head"><div className="cn" style={{background:acc}}>4</div> Members<span className="card-opt">optional — for patrol leader tracking</span></div>
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
