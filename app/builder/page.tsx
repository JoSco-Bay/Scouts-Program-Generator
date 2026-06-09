"use client";

import { useState } from "react";

// ── OAS Data ────────────────────────────────────────────────────────────────

const OAS_STREAMS = {
  "Core Areas": {
    color: "#15803d",
    streams: {
      Bushcraft: {
        stages: 9,
        note: "Splits at Stage 4: Pioneering, Survival Skills",
      },
      Bushwalking: { stages: 9, note: "" },
      Camping:     { stages: 9, note: "" },
    },
  },
  "Specialist Areas": {
    color: "#1d4ed8",
    streams: {
      Alpine:   { stages: 9, note: "Splits at Stage 4: Cross Country Skiing, Snowshoeing & Camping, Downhill Skiing, Snowboarding" },
      Aquatics: { stages: 9, note: "Splits at Stage 4: Surf Lifesaving, Snorkeling, Surfing. Stage 7: SCUBA, Swift Water Rescue" },
      Boating:  { stages: 9, note: "Splits at Stage 4: Sailing, Windsurfing" },
      Cycling:  { stages: 9, note: "Splits at Stage 4: Cycle Touring, Mountain Biking" },
      Paddling: { stages: 9, note: "Splits at Stage 4: Canoeing, Kayaking, Sea Kayaking. Stage 7: White Water" },
      Vertical: { stages: 9, note: "Splits at Stage 4: Abseiling, Caving, Canyoning, Climbing" },
    },
  },
} as const;

type OASSelection = { stream: string; stage: number };
type PlanningMode = "session" | "term" | "year" | "multiyear";

const SECTION_DETAILS: Record<string, { age: string; color: string; icon: string }> = {
  Joeys:     { age: "5–8 yrs",   color: "#d97706", icon: "🐨" },
  Cubs:      { age: "8–11 yrs",  color: "#b45309", icon: "🐻" },
  Scouts:    { age: "11–15 yrs", color: "#15803d", icon: "⚜️" },
  Venturers: { age: "15–18 yrs", color: "#1d4ed8", icon: "🦅" },
};

export default function BuilderPage() {
  const [section, setSection]               = useState("Scouts");
  const [duration, setDuration]             = useState("90");
  const [groupSize, setGroupSize]           = useState("12");
  const [theme, setTheme]                   = useState("");
  const [goal, setGoal]                     = useState("");
  const [previousSessions, setPreviousSessions] = useState("");
  const [mode, setMode]                     = useState<PlanningMode>("session");
  const [schoolYear, setSchoolYear]         = useState(new Date().getFullYear().toString());
  const [startTerm, setStartTerm]           = useState("1");
  const [numTerms, setNumTerms]             = useState(1);
  const [sessionsPerTerm, setSessionsPerTerm] = useState("8");
  const [oasSelections, setOasSelections]   = useState<OASSelection[]>([]);
  const [customOas, setCustomOas]           = useState("");
  const [oasOpen, setOasOpen]               = useState<string | null>(null);
  const [isGenerating, setIsGenerating]     = useState(false);

  const current = SECTION_DETAILS[section] ?? SECTION_DETAILS["Scouts"];

  const toggleOas = (stream: string, stage: number) => {
    setOasSelections((prev) => {
      const exists = prev.find((s) => s.stream === stream && s.stage === stage);
      return exists
        ? prev.filter((s) => !(s.stream === stream && s.stage === stage))
        : [...prev, { stream, stage }];
    });
  };

  const isSelected = (stream: string, stage: number) =>
    oasSelections.some((s) => s.stream === stream && s.stage === stage);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const oasList = [
      ...oasSelections.map((s) => `${s.stream} Stage ${s.stage}`),
      ...customOas.split("\n").map((s) => s.trim()).filter(Boolean),
    ];
    const body: Record<string, unknown> = {
      section, duration, groupSize, theme, goal, previousSessions, mode, oasGoals: oasList,
    };
    if (mode !== "session") {
      Object.assign(body, { schoolYear, startTerm, numTerms, sessionsPerTerm });
    }
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    localStorage.setItem("generatedProgram", data.result);
    localStorage.setItem("planningMode", mode);
    window.location.href = "/result";
  };

  const modeLabels: Record<PlanningMode, { label: string; sub: string; icon: string }> = {
    session:   { label: "Single Session", sub: "One meeting",   icon: "📋" },
    term:      { label: "Term Plan",      sub: "8–10 weeks",    icon: "📅" },
    year:      { label: "Year Plan",      sub: "4 terms",       icon: "🗓️" },
    multiyear: { label: "Multi-Year",     sub: "Up to 3 years", icon: "🗺️" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .builder-root {
          min-height: 100vh; background-color: #1a1208;
          background-image: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(101,62,11,0.5) 0%, transparent 70%);
          padding: 48px 20px 80px; font-family: 'Source Serif 4', Georgia, serif;
        }
        .top-badge { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:36px; opacity:0.55; }
        .top-badge-line { height:1px; width:60px; background:linear-gradient(to right,transparent,#a16207); }
        .top-badge span { font-family:'Teko',sans-serif; font-size:13px; letter-spacing:0.25em; text-transform:uppercase; color:#a16207; }

        .card { max-width:680px; margin:0 auto; background:#fdf6e3; border-radius:3px; overflow:hidden;
          box-shadow:0 0 0 1px rgba(101,62,11,0.2),0 4px 6px rgba(0,0,0,0.3),0 20px 60px rgba(0,0,0,0.5); position:relative; }

        .card-header { padding:32px 40px 28px; border-bottom:1px solid rgba(101,62,11,0.15);
          background:linear-gradient(to bottom,rgba(254,243,199,0.8),transparent); position:relative; z-index:1; }
        .section-pill { display:inline-flex; align-items:center; gap:6px; padding:3px 10px 3px 8px;
          border-radius:2px; font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.15em;
          text-transform:uppercase; margin-bottom:14px; transition:all 0.3s; border:1px solid; }
        .card-title { font-family:'Teko',sans-serif; font-size:clamp(32px,6vw,48px); font-weight:600;
          color:#1c0f00; line-height:0.95; letter-spacing:-0.01em; }
        .card-title em { font-style:italic; font-weight:300; color:#78350f; }
        .card-subtitle { margin-top:8px; font-size:13px; color:#78350f; font-style:italic; }

        .corner-ornament { position:absolute; width:28px; height:28px; opacity:0.2; }
        .corner-ornament.tl { top:8px; left:8px; border-top:2px solid #78350f; border-left:2px solid #78350f; }
        .corner-ornament.tr { top:8px; right:8px; border-top:2px solid #78350f; border-right:2px solid #78350f; }
        .corner-ornament.bl { bottom:8px; left:8px; border-bottom:2px solid #78350f; border-left:2px solid #78350f; }
        .corner-ornament.br { bottom:8px; right:8px; border-bottom:2px solid #78350f; border-right:2px solid #78350f; }

        .card-body { padding:32px 40px 40px; position:relative; z-index:1; }
        .form-section { padding:20px 0; border-bottom:1px dashed rgba(101,62,11,0.2); }
        .form-section:last-of-type { border-bottom:none; }
        .form-section-label { font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.22em;
          text-transform:uppercase; color:#a16207; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
        .form-section-label::after { content:''; flex:1; height:1px; background:rgba(161,98,7,0.2); }

        .mode-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
        .mode-btn { display:flex; flex-direction:column; align-items:center; gap:3px; padding:10px 4px;
          border-radius:2px; border:1px solid rgba(101,62,11,0.2); background:rgba(255,255,255,0.3);
          cursor:pointer; transition:all 0.2s; font-family:'Source Serif 4',serif; }
        .mode-btn:hover { border-color:rgba(101,62,11,0.45); background:rgba(255,255,255,0.55); }
        .mode-btn.active { background:white; border-color:#92400e; box-shadow:0 1px 4px rgba(0,0,0,0.15); }
        .mode-icon { font-size:20px; line-height:1; }
        .mode-label { font-family:'Teko',sans-serif; font-size:13px; font-weight:500; color:#1c0f00; letter-spacing:0.04em; }
        .mode-sub { font-size:10px; color:#92400e; font-style:italic; }

        .segment-control { display:grid; grid-template-columns:repeat(4,1fr); gap:4px;
          background:rgba(101,62,11,0.1); border:1px solid rgba(101,62,11,0.2); border-radius:3px; padding:4px; }
        .segment-btn { display:flex; flex-direction:column; align-items:center; gap:2px; padding:8px 4px;
          border-radius:2px; border:none; background:transparent; cursor:pointer; transition:all 0.2s; }
        .segment-btn .seg-icon { font-size:18px; line-height:1; }
        .segment-btn .seg-name { font-family:'Teko',sans-serif; font-size:13px; letter-spacing:0.05em; font-weight:500; color:#78350f; }
        .segment-btn .seg-age { font-size:10px; color:#a16207; font-style:italic; }
        .segment-btn.active { background:white; box-shadow:0 1px 3px rgba(0,0,0,0.15); }
        .segment-btn.active .seg-name { color:#1c0f00; }

        .field-row { display:grid; gap:16px; }
        .field-row.two-col { grid-template-columns:1fr 1fr; }
        .field-group { display:flex; flex-direction:column; gap:5px; }
        .field-label { font-size:12px; font-weight:600; color:#44260a; letter-spacing:0.04em; text-transform:uppercase; }
        .field-hint { font-size:11px; color:#92400e; font-style:italic; margin-top:-2px; margin-bottom:4px; }

        input,select,textarea { font-family:'Source Serif 4',serif; font-size:14px; color:#1c0f00;
          background:rgba(255,255,255,0.6); border:1px solid rgba(101,62,11,0.25); border-radius:2px;
          padding:9px 12px; width:100%; transition:border-color 0.2s,background 0.2s,box-shadow 0.2s; outline:none; }
        input:focus,select:focus,textarea:focus { border-color:#92400e; background:rgba(255,255,255,0.9); box-shadow:0 0 0 3px rgba(146,64,14,0.1); }
        input::placeholder,textarea::placeholder { color:#b59060; font-style:italic; }
        select { cursor:pointer; appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2392400e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 12px center; padding-right:36px; }
        textarea { resize:vertical; }

        .number-input-wrap { display:flex; align-items:stretch; border:1px solid rgba(101,62,11,0.25);
          border-radius:2px; overflow:hidden; background:rgba(255,255,255,0.6); }
        .number-input-wrap input { border:none; border-radius:0; text-align:center; flex:1; background:transparent; }
        .number-input-wrap input:focus { box-shadow:none; }
        .step-btn { width:36px; display:flex; align-items:center; justify-content:center;
          background:rgba(101,62,11,0.08); border:none; cursor:pointer; font-size:16px; color:#78350f;
          transition:background 0.15s; flex-shrink:0; }
        .step-btn:hover { background:rgba(101,62,11,0.18); }

        .term-pills { display:flex; gap:6px; flex-wrap:wrap; }
        .term-pill { padding:4px 12px; border-radius:2px; border:1px solid rgba(101,62,11,0.25);
          background:rgba(255,255,255,0.4); cursor:pointer; font-family:'Teko',sans-serif;
          font-size:14px; letter-spacing:0.08em; color:#78350f; transition:all 0.2s; }
        .term-pill:hover { border-color:rgba(101,62,11,0.5); background:rgba(255,255,255,0.65); }
        .term-pill.active { background:white; border-color:#92400e; color:#1c0f00; box-shadow:0 1px 3px rgba(0,0,0,0.12); }

        .oas-category { margin-bottom:8px; }
        .oas-category-header { display:flex; align-items:center; justify-content:space-between;
          padding:8px 10px; border-radius:2px; cursor:pointer;
          border:1px solid rgba(101,62,11,0.18); background:rgba(255,255,255,0.35); transition:background 0.2s; }
        .oas-category-header:hover { background:rgba(255,255,255,0.55); }
        .oas-category-title { font-family:'Teko',sans-serif; font-size:15px; letter-spacing:0.1em; color:#1c0f00; }
        .oas-category-badge { font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.12em; padding:2px 7px; border-radius:2px; color:white; }
        .oas-chevron { color:#92400e; font-size:12px; transition:transform 0.2s; }
        .oas-chevron.open { transform:rotate(180deg); }

        .oas-streams { padding:12px 4px 6px; display:flex; flex-direction:column; gap:12px; }
        .oas-stream-row { display:flex; flex-direction:column; gap:4px; }
        .oas-stream-name { font-size:12px; font-weight:600; color:#44260a; letter-spacing:0.05em; text-transform:uppercase; }
        .oas-stream-note { font-size:10px; color:#92400e; font-style:italic; margin-bottom:2px; }
        .oas-stages { display:flex; gap:4px; flex-wrap:wrap; }
        .oas-stage-btn { width:30px; height:28px; display:flex; align-items:center; justify-content:center;
          border:1px solid rgba(101,62,11,0.22); border-radius:2px; background:rgba(255,255,255,0.4);
          cursor:pointer; font-family:'Teko',sans-serif; font-size:13px; color:#78350f; transition:all 0.15s; }
        .oas-stage-btn:hover { border-color:#92400e; background:rgba(255,255,255,0.7); }
        .oas-stage-btn.selected { background:#92400e; border-color:#92400e; color:white; }

        .oas-selected-summary { margin-top:10px; padding:8px 10px;
          background:rgba(21,128,61,0.07); border:1px solid rgba(21,128,61,0.2);
          border-radius:2px; display:flex; flex-wrap:wrap; gap:4px; }
        .oas-tag { background:rgba(21,128,61,0.12); border:1px solid rgba(21,128,61,0.25); border-radius:2px;
          padding:2px 7px; font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.06em;
          color:#14532d; display:flex; align-items:center; gap:4px; }
        .oas-tag-remove { cursor:pointer; opacity:0.6; font-size:11px; }
        .oas-tag-remove:hover { opacity:1; }

        .generate-btn { margin-top:28px; position:relative; width:100%; padding:16px 24px;
          background:#1c0f00; border:none; cursor:pointer; border-radius:2px; overflow:hidden; transition:transform 0.15s; }
        .generate-btn:hover { transform:translateY(-1px); }
        .generate-btn:active { transform:translateY(0); }
        .generate-btn::before { content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,#92400e 0%,#451a03 50%,#1c0f00 100%); opacity:0; transition:opacity 0.3s; }
        .generate-btn:hover::before { opacity:1; }
        .generate-btn-inner { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:10px; }
        .generate-btn-text { font-family:'Teko',sans-serif; font-size:20px; letter-spacing:0.15em; text-transform:uppercase; color:#fde68a; }
        .generate-btn-icon { font-size:18px; transition:transform 0.3s; }
        .generate-btn:hover .generate-btn-icon { transform:translateX(4px); }
        .loading-dots { display:flex; gap:4px; align-items:center; }
        .loading-dots span { width:5px; height:5px; background:#fde68a; border-radius:50%; animation:dot-pulse 1.2s ease-in-out infinite; }
        .loading-dots span:nth-child(2) { animation-delay:0.2s; }
        .loading-dots span:nth-child(3) { animation-delay:0.4s; }
        @keyframes dot-pulse { 0%,80%,100% { transform:scale(0.7); opacity:0.5; } 40% { transform:scale(1); opacity:1; } }

        @media (max-width:520px) {
          .card-header,.card-body { padding-left:24px; padding-right:24px; }
          .field-row.two-col { grid-template-columns:1fr; }
          .mode-grid { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      <div className="builder-root">
        <div className="top-badge">
          <div className="top-badge-line" />
          <span>Scouts Australia · Program Builder</span>
          <div className="top-badge-line" style={{ background: "linear-gradient(to left,transparent,#a16207)" }} />
        </div>

        <div className="card">
          <div className="corner-ornament tl" /><div className="corner-ornament tr" />
          <div className="corner-ornament bl" /><div className="corner-ornament br" />

          <div className="card-header">
            <div className="section-pill" style={{ backgroundColor: `${current.color}18`, borderColor: `${current.color}40`, color: current.color }}>
              <span>{current.icon}</span><span>{section} · {current.age}</span>
            </div>
            <h1 className="card-title">Plan Your<br /><em>Next Adventure</em></h1>
            <p className="card-subtitle">Build a session, term, or multi-year program with OAS badge goals</p>
          </div>

          <div className="card-body">

            {/* Planning Mode */}
            <div className="form-section">
              <div className="form-section-label">Planning Horizon</div>
              <div className="mode-grid">
                {(Object.entries(modeLabels) as [PlanningMode, typeof modeLabels[PlanningMode]][]).map(([key, val]) => (
                  <button key={key} type="button" className={`mode-btn ${mode === key ? "active" : ""}`} onClick={() => setMode(key)}>
                    <span className="mode-icon">{val.icon}</span>
                    <span className="mode-label">{val.label}</span>
                    <span className="mode-sub">{val.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section */}
            <div className="form-section">
              <div className="form-section-label">Scout Section</div>
              <div className="segment-control">
                {(["Joeys", "Cubs", "Scouts", "Venturers"] as const).map((s) => (
                  <button key={s} type="button" className={`segment-btn ${section === s ? "active" : ""}`} onClick={() => setSection(s)}>
                    <span className="seg-icon">{SECTION_DETAILS[s].icon}</span>
                    <span className="seg-name">{s}</span>
                    <span className="seg-age">{SECTION_DETAILS[s].age}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Term/Year schedule */}
            {mode !== "session" && (
              <div className="form-section">
                <div className="form-section-label">Schedule</div>
                <div className="field-row two-col" style={{ marginBottom: 14 }}>
                  <div className="field-group">
                    <label className="field-label">School Year</label>
                    <input type="number" value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} placeholder="2025" />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Sessions per Term</label>
                    <div className="number-input-wrap">
                      <button className="step-btn" type="button" onClick={() => setSessionsPerTerm(String(Math.max(4, Number(sessionsPerTerm) - 1)))}>−</button>
                      <input type="number" value={sessionsPerTerm} onChange={(e) => setSessionsPerTerm(e.target.value)} />
                      <button className="step-btn" type="button" onClick={() => setSessionsPerTerm(String(Number(sessionsPerTerm) + 1))}>+</button>
                    </div>
                  </div>
                </div>

                <div className="field-group" style={{ marginBottom: 12 }}>
                  <label className="field-label">Starting Term</label>
                  <div className="term-pills">
                    {["1","2","3","4"].map((t) => (
                      <button key={t} type="button" className={`term-pill ${startTerm === t ? "active" : ""}`} onClick={() => setStartTerm(t)}>
                        Term {t}
                      </button>
                    ))}
                  </div>
                </div>

                {(mode === "year" || mode === "multiyear") && (
                  <div className="field-group">
                    <label className="field-label">Number of {mode === "multiyear" ? "Years" : "Terms"}</label>
                    <div className="term-pills">
                      {(mode === "multiyear" ? ["1","2","3"] : ["1","2","3","4"]).map((n) => (
                        <button key={n} type="button" className={`term-pill ${numTerms === Number(n) ? "active" : ""}`} onClick={() => setNumTerms(Number(n))}>
                          {mode === "multiyear" ? `${n} yr${Number(n) > 1 ? "s" : ""}` : `${n} term${Number(n) > 1 ? "s" : ""}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Session Basics */}
            <div className="form-section">
              <div className="form-section-label">{mode === "session" ? "Session Basics" : "Typical Session"}</div>
              <div className="field-row two-col">
                <div className="field-group">
                  <label className="field-label">Duration</label>
                  <div className="number-input-wrap">
                    <button className="step-btn" type="button" onClick={() => setDuration(String(Math.max(30, Number(duration) - 15)))}>−</button>
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                    <button className="step-btn" type="button" onClick={() => setDuration(String(Number(duration) + 15))}>+</button>
                  </div>
                  <span className="field-hint">minutes</span>
                </div>
                <div className="field-group">
                  <label className="field-label">Group Size</label>
                  <div className="number-input-wrap">
                    <button className="step-btn" type="button" onClick={() => setGroupSize(String(Math.max(1, Number(groupSize) - 1)))}>−</button>
                    <input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} />
                    <button className="step-btn" type="button" onClick={() => setGroupSize(String(Number(groupSize) + 1))}>+</button>
                  </div>
                  <span className="field-hint">participants</span>
                </div>
              </div>
            </div>

            {/* OAS Badge Goals */}
            <div className="form-section">
              <div className="form-section-label">OAS Badge Goals</div>

              {Object.entries(OAS_STREAMS).map(([category, { color, streams }]) => (
                <div key={category} className="oas-category">
                  <div className="oas-category-header" onClick={() => setOasOpen(oasOpen === category ? null : category)}>
                    <span className="oas-category-title">{category}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="oas-category-badge" style={{ background: color }}>{Object.keys(streams).length} streams</span>
                      <span className={`oas-chevron ${oasOpen === category ? "open" : ""}`}>▼</span>
                    </div>
                  </div>

                  {oasOpen === category && (
                    <div className="oas-streams">
                      {Object.entries(streams).map(([streamName, info]) => (
                        <div key={streamName} className="oas-stream-row">
                          <div className="oas-stream-name">{streamName}</div>
                          {info.note && <div className="oas-stream-note">{info.note}</div>}
                          <div className="oas-stages">
                            {Array.from({ length: info.stages }, (_, i) => i + 1).map((stage) => (
                              <button
                                key={stage} type="button"
                                className={`oas-stage-btn ${isSelected(streamName, stage) ? "selected" : ""}`}
                                onClick={() => toggleOas(streamName, stage)}
                                title={`${streamName} Stage ${stage}`}
                              >
                                {stage}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {oasSelections.length > 0 && (
                <div className="oas-selected-summary">
                  {oasSelections.map((s) => (
                    <span key={`${s.stream}-${s.stage}`} className="oas-tag">
                      {s.stream} S{s.stage}
                      <span className="oas-tag-remove" onClick={() => toggleOas(s.stream, s.stage)}>✕</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="field-group" style={{ marginTop: 12 }}>
                <label className="field-label">Additional / Custom Goals</label>
                <span className="field-hint">One per line — e.g. "Pioneering Stage 3", "First Aid Certificate"</span>
                <textarea rows={3} placeholder={"Pioneering Stage 3\nSurvival Skills Stage 2"} value={customOas} onChange={(e) => setCustomOas(e.target.value)} />
              </div>
            </div>

            {/* Theme & Context */}
            <div className="form-section">
              <div className="form-section-label">Theme & Context</div>
              <div className="field-row" style={{ gap: 14 }}>
                <div className="field-group">
                  <label className="field-label">{mode === "session" ? "Session Theme" : "Overarching Theme"}</label>
                  <input type="text" placeholder="e.g. Bushcraft, Navigation, Leadership…" value={theme} onChange={(e) => setTheme(e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">{mode === "session" ? "Session Goal" : "Program Goal"}</label>
                  <textarea rows={2} placeholder="What should Scouts achieve by the end of this program?" value={goal} onChange={(e) => setGoal(e.target.value)} />
                </div>
              </div>
            </div>

            {/* History */}
            <div className="form-section">
              <div className="form-section-label">Program History</div>
              <div className="field-group">
                <label className="field-label">Previous Sessions / Terms</label>
                <span className="field-hint">Helps build progressively and avoid repetition</span>
                <textarea rows={4} placeholder={"Term 1 — Compass basics, map reading, bearings\nTerm 2 — Day hikes, campfire cooking"} value={previousSessions} onChange={(e) => setPreviousSessions(e.target.value)} />
              </div>
            </div>

            <button className="generate-btn" onClick={handleGenerate} disabled={isGenerating} type="button">
              <div className="generate-btn-inner">
                {isGenerating ? (
                  <><div className="loading-dots"><span /><span /><span /></div><span className="generate-btn-text">Building Program…</span></>
                ) : (
                  <><span className="generate-btn-text">Generate {mode === "session" ? "Session" : mode === "term" ? "Term Plan" : mode === "year" ? "Year Plan" : "Multi-Year Plan"}</span><span className="generate-btn-icon">→</span></>
                )}
              </div>
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
