"use client";

import { useState } from "react";
import { SECTION_COLOURS } from "@/lib/colours";
import type { GroupConfig } from "@/lib/types";

const MEETING_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function SetupPage() {
  const [groupName, setGroupName]     = useState("");
  const [section, setSection]         = useState<keyof typeof SECTION_COLOURS>("Scouts");
  const [meetingDay, setMeetingDay]   = useState("Monday");
  const [meetingTime, setMeetingTime] = useState("18:30");
  const [leaders, setLeaders]         = useState<string[]>(["", ""]);
  const [members, setMembers]         = useState<string[]>([""]);

  const col = SECTION_COLOURS[section];

  const addLeader    = () => setLeaders(p => [...p, ""]);
  const removeLeader = (i: number) => setLeaders(p => p.filter((_, idx) => idx !== i));
  const updateLeader = (i: number, v: string) => setLeaders(p => p.map((s, idx) => idx === i ? v : s));

  const addMember    = () => setMembers(p => [...p, ""]);
  const removeMember = (i: number) => setMembers(p => p.filter((_, idx) => idx !== i));
  const updateMember = (i: number, v: string) => setMembers(p => p.map((s, idx) => idx === i ? v : s));

  const handleSave = () => {
    const config: GroupConfig = {
      groupName,
      section,
      meetingDay,
      meetingTime,
      leaders: leaders.filter(Boolean),
      members: members.filter(Boolean),
    };
    localStorage.setItem("groupConfig", JSON.stringify(config));
    window.location.href = "/term";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .su-root {
          min-height: 100vh; background-color: #1a1208;
          background-image: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(101,62,11,0.5) 0%, transparent 70%);
          padding: 48px 20px 80px; font-family: 'Source Serif 4', Georgia, serif;
        }
        .top-badge { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:36px; opacity:0.55; }
        .top-badge-line { height:1px; width:60px; }
        .top-badge span { font-family:'Teko',sans-serif; font-size:13px; letter-spacing:0.25em; text-transform:uppercase; color:#a16207; }
        .back-link { display:block; text-align:center; margin-bottom:16px; font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(161,98,7,0.6); text-decoration:none; }
        .back-link:hover { color:#a16207; }

        .card { max-width:680px; margin:0 auto; background:#fdf6e3; border-radius:3px; overflow:hidden;
          box-shadow:0 0 0 1px rgba(101,62,11,0.2),0 4px 6px rgba(0,0,0,0.3),0 20px 60px rgba(0,0,0,0.5); }
        .card-header { padding:32px 40px 28px; border-bottom:1px solid rgba(101,62,11,0.15);
          background:linear-gradient(to bottom,rgba(254,243,199,0.8),transparent); }
        .step-pill { display:inline-flex; align-items:center; gap:6px; padding:3px 10px;
          border-radius:2px; font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.15em;
          text-transform:uppercase; margin-bottom:14px; border:1px solid; }
        .card-title { font-family:'Teko',sans-serif; font-size:clamp(32px,6vw,48px); font-weight:600;
          color:#1c0f00; line-height:0.95; letter-spacing:-0.01em; }
        .card-title em { font-style:italic; font-weight:300; color:#78350f; }
        .card-subtitle { margin-top:8px; font-size:13px; color:#78350f; font-style:italic; }

        .card-body { padding:32px 40px 40px; }
        .form-section { padding:20px 0; border-bottom:1px dashed rgba(101,62,11,0.2); }
        .form-section:last-of-type { border-bottom:none; }
        .form-section-label { font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.22em;
          text-transform:uppercase; color:#a16207; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
        .form-section-label::after { content:''; flex:1; height:1px; background:rgba(161,98,7,0.2); }

        .segment-control { display:grid; grid-template-columns:repeat(4,1fr); gap:4px;
          background:rgba(101,62,11,0.1); border:1px solid rgba(101,62,11,0.2); border-radius:3px; padding:4px; }
        .seg-btn { display:flex; flex-direction:column; align-items:center; gap:2px; padding:10px 4px;
          border-radius:2px; border:none; background:transparent; cursor:pointer; transition:all 0.2s; }
        .seg-btn .seg-name { font-family:'Teko',sans-serif; font-size:14px; letter-spacing:0.05em; font-weight:500; color:#78350f; }
        .seg-btn .seg-age { font-size:10px; color:#a16207; font-style:italic; }
        .seg-btn.active { background:white; box-shadow:0 1px 3px rgba(0,0,0,0.15); }
        .seg-btn.active .seg-name { color:#1c0f00; }

        .field-row { display:grid; gap:16px; }
        .field-row.two-col { grid-template-columns:1fr 1fr; }
        .field-group { display:flex; flex-direction:column; gap:5px; }
        .field-label { font-size:12px; font-weight:600; color:#44260a; letter-spacing:0.04em; text-transform:uppercase; }
        .field-hint { font-size:11px; color:#92400e; font-style:italic; }

        input, select { font-family:'Source Serif 4',serif; font-size:14px; color:#1c0f00;
          background:rgba(255,255,255,0.6); border:1px solid rgba(101,62,11,0.25); border-radius:2px;
          padding:9px 12px; width:100%; transition:border-color 0.2s,background 0.2s,box-shadow 0.2s; outline:none; }
        input:focus, select:focus { border-color:#92400e; background:rgba(255,255,255,0.9); box-shadow:0 0 0 3px rgba(146,64,14,0.1); }
        input::placeholder { color:#b59060; font-style:italic; }
        select { cursor:pointer; appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2392400e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 12px center; padding-right:36px; }

        .list-row { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
        .list-row input { flex:1; }
        .rm-btn { width:32px; height:32px; display:flex; align-items:center; justify-content:center;
          border:1px solid rgba(101,62,11,0.2); border-radius:2px; background:rgba(255,255,255,0.4);
          cursor:pointer; font-size:13px; color:#78350f; flex-shrink:0; transition:all 0.15s; }
        .rm-btn:hover { background:rgba(220,38,38,0.08); border-color:rgba(220,38,38,0.3); color:#dc2626; }
        .add-btn { margin-top:6px; display:inline-flex; align-items:center; gap:6px;
          font-family:'Teko',sans-serif; font-size:13px; letter-spacing:0.1em; text-transform:uppercase;
          color:#a16207; background:none; border:1px dashed rgba(101,62,11,0.3); border-radius:2px;
          padding:6px 14px; cursor:pointer; transition:all 0.15s; }
        .add-btn:hover { border-color:#a16207; background:rgba(161,98,7,0.05); }

        .save-btn { margin-top:28px; width:100%; padding:16px 24px;
          background:#1c0f00; border:none; cursor:pointer; border-radius:2px;
          position:relative; overflow:hidden; transition:transform 0.15s; }
        .save-btn:hover { transform:translateY(-1px); }
        .save-btn::before { content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,#92400e 0%,#451a03 50%,#1c0f00 100%); opacity:0; transition:opacity 0.3s; }
        .save-btn:hover::before { opacity:1; }
        .save-btn-inner { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:10px; }
        .save-btn-text { font-family:'Teko',sans-serif; font-size:20px; letter-spacing:0.15em; text-transform:uppercase; color:#fde68a; }
        .save-btn-icon { font-size:18px; transition:transform 0.3s; }
        .save-btn:hover .save-btn-icon { transform:translateX(4px); }

        @media (max-width:520px) {
          .card-header,.card-body { padding-left:24px; padding-right:24px; }
          .field-row.two-col { grid-template-columns:1fr; }
          .segment-control { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      <div className="su-root">
        <a href="/" className="back-link">← Scout Program Builder</a>
        <div className="top-badge">
          <div className="top-badge-line" style={{ background: "linear-gradient(to right,transparent,#a16207)" }} />
          <span>⚜ Step 1 of 3 · Group Setup</span>
          <div className="top-badge-line" style={{ background: "linear-gradient(to left,transparent,#a16207)" }} />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="step-pill" style={{ backgroundColor: `${col.accent}18`, borderColor: `${col.accent}40`, color: col.accent }}>
              <span>⚜</span><span>{col.label} · {col.age}</span>
            </div>
            <h1 className="card-title">Set Up Your<br /><em>Group</em></h1>
            <p className="card-subtitle">Your details are saved locally — you can change them any time</p>
          </div>

          <div className="card-body">

            {/* Group Details */}
            <div className="form-section">
              <div className="form-section-label">Group Details</div>
              <div className="field-group">
                <label className="field-label">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. 1st Mosman Scout Group"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                />
              </div>
            </div>

            {/* Section */}
            <div className="form-section">
              <div className="form-section-label">Scout Section</div>
              <div className="segment-control">
                {(Object.keys(SECTION_COLOURS) as Array<keyof typeof SECTION_COLOURS>).map(s => (
                  <button
                    key={s} type="button"
                    className={`seg-btn ${section === s ? "active" : ""}`}
                    onClick={() => setSection(s)}
                  >
                    <span className="seg-name">{SECTION_COLOURS[s].label}</span>
                    <span className="seg-age">{SECTION_COLOURS[s].age}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting Schedule */}
            <div className="form-section">
              <div className="form-section-label">Meeting Schedule</div>
              <div className="field-row two-col">
                <div className="field-group">
                  <label className="field-label">Meeting Day</label>
                  <select value={meetingDay} onChange={e => setMeetingDay(e.target.value)}>
                    {MEETING_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Start Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={e => setMeetingTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Leaders */}
            <div className="form-section">
              <div className="form-section-label">Leaders</div>
              {leaders.map((leader, i) => (
                <div key={i} className="list-row">
                  <input
                    type="text"
                    placeholder={`Leader ${i + 1} name`}
                    value={leader}
                    onChange={e => updateLeader(i, e.target.value)}
                  />
                  {leaders.length > 1 && (
                    <button type="button" className="rm-btn" onClick={() => removeLeader(i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addLeader}>+ Add Leader</button>
            </div>

            {/* Members (optional) */}
            <div className="form-section">
              <div className="form-section-label">
                Youth Members
                <span style={{ fontWeight: 300, textTransform: "none", fontSize: "10px", letterSpacing: 0, marginLeft: 6 }}>optional</span>
              </div>
              <span className="field-hint" style={{ display: "block", marginBottom: 12 }}>
                Add member names to use on run sheets and patrol assignments
              </span>
              {members.map((member, i) => (
                <div key={i} className="list-row">
                  <input
                    type="text"
                    placeholder={`Member ${i + 1} name`}
                    value={member}
                    onChange={e => updateMember(i, e.target.value)}
                  />
                  {members.length > 1 && (
                    <button type="button" className="rm-btn" onClick={() => removeMember(i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addMember}>+ Add Member</button>
            </div>

            <button className="save-btn" type="button" onClick={handleSave}>
              <div className="save-btn-inner">
                <span className="save-btn-text">Save & Plan Your Term</span>
                <span className="save-btn-icon">→</span>
              </div>
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
