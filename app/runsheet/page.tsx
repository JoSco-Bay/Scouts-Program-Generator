"use client";

import { useEffect, useState } from "react";
import { SECTION_COLOURS } from "@/lib/colours";
import type { GroupConfig, TermRow, ActivityRow } from "@/lib/types";

function Inline({ t }: { t: string }) {
  const parts = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
        return p;
      })}
    </>
  );
}

export default function RunSheetPage() {
  const [config, setConfig]         = useState<GroupConfig | null>(null);
  const [row, setRow]               = useState<TermRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState("");
  const [editingId, setEditingId]   = useState<string | null>(null);

  useEffect(() => {
    const rawConfig = localStorage.getItem("groupConfig");
    const rawRows   = localStorage.getItem("termRows");
    const activeId  = localStorage.getItem("activeRowId");

    if (!rawConfig) { window.location.href = "/setup"; return; }
    if (!rawRows || !activeId) { window.location.href = "/term"; return; }

    try {
      const cfg = JSON.parse(rawConfig) as GroupConfig;
      setConfig(cfg);
      const rows = JSON.parse(rawRows) as TermRow[];
      const active = rows.find(r => r.id === activeId);
      if (!active) { window.location.href = "/term"; return; }
      setRow(active);
    } catch {
      window.location.href = "/setup";
    }
  }, []);

  const col = config ? SECTION_COLOURS[config.section] : SECTION_COLOURS.Scouts;

  const handleGenerate = async () => {
    if (!config || !row) return;
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/generate-runsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupConfig: config, row }),
      });
      const data = await res.json() as { activities?: ActivityRow[] };
      if (data.activities && Array.isArray(data.activities)) {
        setActivities(data.activities);
        localStorage.setItem("runsheetActivities", JSON.stringify(data.activities));
      } else {
        setGenError("No activities returned — try again.");
      }
    } catch {
      setGenError("Connection error — check your network and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const updateActivity = (id: string, field: keyof ActivityRow, value: string | boolean) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const addActivity = () => {
    const newAct: ActivityRow = {
      id: `act-${Date.now()}`,
      time: "",
      name: "",
      detail: "",
      oasTag: "",
      hasRecipe: false,
      optional: false,
    };
    setActivities(prev => [...prev, newAct]);
    setEditingId(newAct.id);
  };

  if (!config || !row) {
    return (
      <div style={{ minHeight: "100vh", background: "#1a1208", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(253,246,227,0.5)", fontFamily: "serif", fontSize: 16 }}>Loading…</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rs-root { min-height: 100vh; background: #1a1208; font-family: 'Source Serif 4', Georgia, serif; padding-bottom: 80px; }

        /* ── HEADER ── */
        .rs-header { background: #fdf6e3; border-bottom: 1px solid rgba(101,62,11,0.15); padding: 0 32px; position: relative; }
        .rs-header::before { content:''; position:absolute; top:0; bottom:0; left:40px; width:1px; background:rgba(220,38,38,0.12); pointer-events:none; }
        .rs-header-top { display:flex; align-items:center; gap:12px; padding: 16px 0 0; flex-wrap:wrap; }
        .rs-back { font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.15em; text-transform:uppercase; color:#a16207; text-decoration:none; cursor:pointer; background:none; border:none; padding:0; transition:color 0.15s; }
        .rs-back:hover { color:#78350f; }
        .rs-section-pill { display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:2px; font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.12em; text-transform:uppercase; border:1px solid; }
        .rs-header-inner { padding: 8px 0 0 16px; }
        .rs-eyebrow { font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.28em; text-transform:uppercase; color:#a16207; margin-bottom:5px; }
        .rs-title { font-family:'Teko',sans-serif; font-size:clamp(26px,4vw,40px); font-weight:600; color:#1c0f00; line-height:1; }
        .rs-meta { display:flex; flex-wrap:wrap; gap:8px; margin: 10px 0 0 16px; padding-bottom:16px; }
        .rs-meta-pill { padding:4px 11px; border-radius:2px; border:1px solid rgba(101,62,11,0.2); background:rgba(255,255,255,0.5); font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.08em; color:#78350f; }

        /* ── CONTENT ── */
        .rs-content { max-width: 1100px; margin: 0 auto; padding: 36px 32px 0; }

        /* ── GENERATE CARD ── */
        .gen-card { background: rgba(253,246,227,0.06); border: 1px solid rgba(253,230,138,0.15); border-radius: 3px; padding: 24px 28px; margin-bottom: 28px; display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
        .gen-desc { flex:1; font-size:14px; line-height:1.65; color:rgba(253,246,227,0.6); font-style:italic; }
        .gen-btn { display:inline-flex; align-items:center; gap:8px; font-family:'Teko',sans-serif; font-size:18px; letter-spacing:0.12em; text-transform:uppercase; background:#fde68a; color:#1c0f00; border:none; border-radius:2px; padding:12px 28px; cursor:pointer; transition:all 0.2s; flex-shrink:0; position:relative; overflow:hidden; }
        .gen-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,#92400e,#451a03); opacity:0; transition:opacity 0.25s; }
        .gen-btn:hover::before { opacity:1; }
        .gen-btn:hover { transform:translateY(-1px); }
        .gen-btn:disabled { opacity:0.5; cursor:default; transform:none; }
        .gen-btn span { position:relative; z-index:1; }
        .gen-btn.generating { background:#1c0f00; color:#fde68a; }
        .gen-btn.generating::before { display:none; }
        .dot-pulse { display:flex; gap:3px; align-items:center; position:relative; z-index:1; }
        .dot-pulse span { width:5px; height:5px; background:#fde68a; border-radius:50%; animation:dp 1.2s ease-in-out infinite; }
        .dot-pulse span:nth-child(2){animation-delay:0.2s;}
        .dot-pulse span:nth-child(3){animation-delay:0.4s;}
        @keyframes dp { 0%,80%,100%{transform:scale(0.6);opacity:0.4;} 40%{transform:scale(1);opacity:1;} }
        .gen-error { font-size:13px; color:#f87171; font-style:italic; width:100%; }

        /* ── ACTION BAR ── */
        .act-bar { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
        .act-bar-title { font-family:'Teko',sans-serif; font-size:20px; letter-spacing:0.04em; color:#fdf6e3; flex:1; }
        .add-act-btn { display:inline-flex; align-items:center; gap:6px; font-family:'Teko',sans-serif; font-size:14px; letter-spacing:0.1em; text-transform:uppercase; background:transparent; color:rgba(253,230,138,0.5); border:1px dashed rgba(253,230,138,0.2); border-radius:2px; padding:8px 16px; cursor:pointer; transition:all 0.2s; }
        .add-act-btn:hover { border-color:rgba(253,230,138,0.45); color:rgba(253,230,138,0.8); }
        .print-btn { display:inline-flex; align-items:center; gap:6px; font-family:'Teko',sans-serif; font-size:14px; letter-spacing:0.1em; text-transform:uppercase; background:rgba(253,246,227,0.08); color:#fdf6e3; border:1px solid rgba(253,246,227,0.2); border-radius:2px; padding:8px 16px; cursor:pointer; transition:all 0.2s; }
        .print-btn:hover { background:rgba(253,246,227,0.14); }

        /* ── ACTIVITY CARDS ── */
        .act-list { display:flex; flex-direction:column; gap:12px; }
        .act-card { background: rgba(253,246,227,0.05); border: 1px solid rgba(253,230,138,0.12); border-radius: 3px; overflow:hidden; transition:border-color 0.15s; }
        .act-card:hover { border-color:rgba(253,230,138,0.22); }
        .act-card.editing { border-color:rgba(253,230,138,0.4); background:rgba(253,246,227,0.07); }
        .act-card-header { display:flex; align-items:center; gap:12px; padding:12px 16px; cursor:pointer; }
        .act-time { font-family:'Teko',sans-serif; font-size:16px; color:#fde68a; min-width:64px; flex-shrink:0; }
        .act-name { font-family:'Teko',sans-serif; font-size:18px; letter-spacing:0.03em; color:#fdf6e3; flex:1; }
        .act-tags { display:flex; gap:6px; flex-wrap:wrap; }
        .act-tag { font-family:'Teko',sans-serif; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; padding:2px 8px; border-radius:2px; }
        .act-tag.oas { background:rgba(107,191,90,0.15); color:#86efac; }
        .act-tag.recipe { background:rgba(217,119,6,0.15); color:#fde68a; }
        .act-tag.optional { background:rgba(253,246,227,0.08); color:rgba(253,246,227,0.45); }
        .act-edit-toggle { font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:rgba(253,230,138,0.4); background:none; border:none; cursor:pointer; padding:4px 8px; border-radius:2px; transition:all 0.15s; flex-shrink:0; }
        .act-edit-toggle:hover { color:#fde68a; background:rgba(253,230,138,0.06); }
        .act-del { width:26px; height:26px; display:flex; align-items:center; justify-content:center; background:transparent; border:1px solid rgba(253,246,227,0.1); border-radius:2px; cursor:pointer; color:rgba(253,246,227,0.25); font-size:12px; transition:all 0.15s; flex-shrink:0; }
        .act-del:hover { border-color:rgba(220,38,38,0.4); color:#f87171; background:rgba(220,38,38,0.08); }

        .act-detail { padding: 4px 16px 12px; font-size:14px; line-height:1.7; color:rgba(253,246,227,0.65); }

        .act-edit-body { padding:12px 16px 16px; border-top:1px solid rgba(253,230,138,0.1); display:flex; flex-direction:column; gap:12px; }
        .edit-row { display:grid; gap:12px; }
        .edit-row.two-col { grid-template-columns:1fr 1fr; }
        .edit-group { display:flex; flex-direction:column; gap:4px; }
        .edit-label { font-family:'Teko',sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#a16207; }
        .edit-input { font-family:'Source Serif 4',serif; font-size:13px; color:#1c0f00; background:rgba(255,255,255,0.85); border:1px solid rgba(101,62,11,0.2); border-radius:2px; padding:6px 10px; width:100%; outline:none; transition:border-color 0.15s,box-shadow 0.15s; }
        .edit-input:focus { border-color:#92400e; box-shadow:0 0 0 2px rgba(146,64,14,0.12); background:white; }
        .edit-textarea { resize:vertical; min-height:72px; }
        .edit-checks { display:flex; gap:16px; flex-wrap:wrap; }
        .edit-check-label { display:flex; align-items:center; gap:6px; font-size:13px; color:rgba(253,246,227,0.7); cursor:pointer; }
        .edit-check-label input { width:15px; height:15px; accent-color:#92400e; cursor:pointer; }

        /* ── EMPTY ── */
        .empty-act { text-align:center; padding:56px 32px; }
        .empty-act-icon { font-size:36px; margin-bottom:14px; }
        .empty-act h3 { font-family:'Teko',sans-serif; font-size:22px; letter-spacing:0.06em; color:rgba(253,246,227,0.5); margin-bottom:8px; }
        .empty-act p { font-size:14px; color:rgba(253,246,227,0.35); font-style:italic; line-height:1.6; }

        @media print {
          .rs-header, .gen-card, .act-bar, .act-edit-toggle, .act-del, .act-edit-body, .print-btn, .add-act-btn { display:none!important; }
          .rs-root { background:white!important; }
          .act-card { border:1px solid rgba(0,0,0,0.1)!important; background:white!important; }
          .act-name, .act-time, .act-detail { color:#1c0f00!important; }
        }

        @media (max-width: 640px) {
          .rs-content { padding: 24px 16px 0; }
          .rs-header { padding: 0 16px; }
          .edit-row.two-col { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="rs-root">

        {/* HEADER */}
        <div className="rs-header">
          <div className="rs-header-top">
            <a href="/term" className="rs-back">← Back to Term</a>
            <div className="rs-section-pill" style={{ backgroundColor: `${col.accent}15`, borderColor: `${col.accent}35`, color: col.accent }}>
              {config.groupName || config.section}
            </div>
          </div>
          <div className="rs-header-inner">
            <div className="rs-eyebrow">⚜ Run Sheet</div>
            <div className="rs-title">{row.topic || "Meeting Program"}</div>
          </div>
          <div className="rs-meta">
            {row.date   && <span className="rs-meta-pill">📅 {row.date}</span>}
            {row.time   && <span className="rs-meta-pill">⏱ {row.time}</span>}
            {row.location && <span className="rs-meta-pill">📍 {row.location}</span>}
            {row.leader && <span className="rs-meta-pill">👤 {row.leader}</span>}
            {row.oasFocus && <span className="rs-meta-pill">⚜ {row.oasFocus}</span>}
            {row.consentRequired && <span className="rs-meta-pill" style={{ background: "rgba(220,38,38,0.12)", borderColor: "rgba(220,38,38,0.3)", color: "#f87171" }}>⚠ Consent Required</span>}
          </div>
        </div>

        <div className="rs-content">

          {/* GENERATE CARD */}
          <div className="gen-card">
            <div className="gen-desc">
              {activities.length > 0
                ? "Run sheet generated — edit any activity below or regenerate."
                : `Click Generate to create a timed run sheet for ${row.topic ? `"${row.topic}"` : "this session"}.`}
            </div>
            <button
              type="button"
              className={`gen-btn ${generating ? "generating" : ""}`}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <><div className="dot-pulse"><span /><span /><span /></div><span>Generating…</span></>
              ) : (
                <span>{activities.length > 0 ? "↺ Regenerate" : "✨ Generate Run Sheet"}</span>
              )}
            </button>
            {genError && <div className="gen-error">{genError}</div>}
          </div>

          {/* ACTIVITY LIST */}
          {activities.length > 0 && (
            <div className="act-bar">
              <div className="act-bar-title">{activities.length} Activities</div>
              <button type="button" className="add-act-btn" onClick={addActivity}>+ Add Activity</button>
              <button type="button" className="print-btn" onClick={() => window.print()}>🖨 Print</button>
            </div>
          )}

          {activities.length > 0 ? (
            <div className="act-list">
              {activities.map(act => (
                <div key={act.id} className={`act-card ${editingId === act.id ? "editing" : ""}`}>
                  <div className="act-card-header" onClick={() => setEditingId(editingId === act.id ? null : act.id)}>
                    <div className="act-time">{act.time}</div>
                    <div className="act-name">{act.name || <em style={{ opacity: 0.4 }}>Untitled</em>}</div>
                    <div className="act-tags">
                      {act.oasTag && <span className="act-tag oas">⚜ {act.oasTag}</span>}
                      {act.hasRecipe && <span className="act-tag recipe">🍳 Recipe</span>}
                      {act.optional && <span className="act-tag optional">Optional</span>}
                    </div>
                    <button type="button" className="act-edit-toggle">
                      {editingId === act.id ? "Done" : "Edit"}
                    </button>
                    <button type="button" className="act-del" onClick={e => { e.stopPropagation(); removeActivity(act.id); }}>✕</button>
                  </div>

                  {editingId !== act.id && act.detail && (
                    <div className="act-detail"><Inline t={act.detail} /></div>
                  )}

                  {editingId === act.id && (
                    <div className="act-edit-body">
                      <div className="edit-row two-col">
                        <div className="edit-group">
                          <label className="edit-label">Time</label>
                          <input
                            className="edit-input"
                            placeholder="e.g. 6:30 PM"
                            value={act.time}
                            onChange={e => updateActivity(act.id, "time", e.target.value)}
                          />
                        </div>
                        <div className="edit-group">
                          <label className="edit-label">Activity Name</label>
                          <input
                            className="edit-input"
                            placeholder="Activity name"
                            value={act.name}
                            onChange={e => updateActivity(act.id, "name", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="edit-group">
                        <label className="edit-label">Detail / Instructions</label>
                        <textarea
                          className="edit-input edit-textarea"
                          placeholder="What Scouts do and the leader's role…"
                          value={act.detail}
                          onChange={e => updateActivity(act.id, "detail", e.target.value)}
                        />
                      </div>
                      <div className="edit-row two-col">
                        <div className="edit-group">
                          <label className="edit-label">OAS Tag</label>
                          <input
                            className="edit-input"
                            placeholder="e.g. Bushcraft Stage 2"
                            value={act.oasTag ?? ""}
                            onChange={e => updateActivity(act.id, "oasTag", e.target.value)}
                          />
                        </div>
                        <div className="edit-checks" style={{ alignItems: "flex-end", paddingBottom: 4 }}>
                          <label className="edit-check-label">
                            <input
                              type="checkbox"
                              checked={act.hasRecipe ?? false}
                              onChange={e => updateActivity(act.id, "hasRecipe", e.target.checked)}
                            />
                            Has Recipe
                          </label>
                          <label className="edit-check-label">
                            <input
                              type="checkbox"
                              checked={act.optional ?? false}
                              onChange={e => updateActivity(act.id, "optional", e.target.checked)}
                            />
                            Optional
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-act">
              <div className="empty-act-icon">⚜️</div>
              <h3>No run sheet yet</h3>
              <p>Click <strong>Generate Run Sheet</strong> to create a timed program for this session.</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
