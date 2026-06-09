"use client";

import { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RunSheetRow { time: string; action: string; leaderNotes: string; }
interface Equipment { fromShed: string[]; toBring: string[]; consumables: string[]; }
interface Instructions {
  overview: string;
  setup: string[];
  runSheet: RunSheetRow[];
  equipment: Equipment;
  safety: string[];
  variations: { easier: string; harder: string };
}
interface LeaderScript {
  intro: string;
  instructions: string;
  debrief: string;
  reflectionQuestions: string[];
}
interface PrintableContent {
  // nature puzzle
  items?: string[];
  // orienteering
  controls?: { id: string; clue: string }[];
  bearings?: { from: string; to: string; bearing: string }[];
  // first aid / scenario
  scenario?: string;
  patientCondition?: string[];
  actions?: string[];
  debrief?: string;
  roles?: string[];
  objectives?: string[];
  // cipher
  cipherType?: string;
  key?: Record<string, string>;
  messages?: string[];
  // kims game
  // worksheet
  sections?: { heading: string; lines: number }[];
  title?: string;
  instructions?: string;
}
interface Printable {
  needed: boolean;
  reason: string;
  type: string | null;
  title: string | null;
  content: PrintableContent | null;
}
interface Activity {
  title: string;
  tagline: string;
  oasLink: string;
  duration: string;
  groupSize: string;
  difficulty: string;
  instructions: Instructions;
  leaderScript: LeaderScript;
  printable: Printable;
}

// ── Printable Sheet Renderers ─────────────────────────────────────────────────

function NaturePuzzle({ content, title }: { content: PrintableContent; title: string }) {
  const items = content.items ?? [];
  const cols = 4;
  const rows = Math.ceil(items.length / cols);
  // Each cell gets a unique puzzle cut pattern using SVG clip-path-like borders
  const cutStyles = [
    "border-radius: 0 12px 0 8px",
    "border-radius: 8px 0 12px 0",
    "border-radius: 12px 0 8px 0",
    "border-radius: 0 8px 0 12px",
  ];

  return (
    <div className="printable-sheet">
      <div className="print-header">
        <div className="print-logo">⚜ Scout Program Builder</div>
        <h1 className="print-title">{title}</h1>
        <p className="print-sub">{content.instructions ?? "Cut along the dashed lines. Mix up the pieces and challenge Scouts to reassemble."}</p>
      </div>

      <div className="puzzle-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 120px)` }}>
        {items.map((item, i) => (
          <div key={i} className="puzzle-cell">
            <div className="puzzle-cell-inner">
              {/* Nature illustration placeholder — leaf/plant silhouette */}
              <svg viewBox="0 0 80 60" className="puzzle-svg">
                <rect width="80" height="60" fill="#e8f5e9" rx="2"/>
                {/* Simple leaf shape */}
                <ellipse cx="40" cy="30" rx="20" ry="14" fill="#4caf50" opacity="0.6" transform={`rotate(${(i * 37) % 180} 40 30)`}/>
                <line x1="40" y1="44" x2="40" y2="16" stroke="#2e7d32" strokeWidth="1.5" opacity="0.7"/>
                <line x1="40" y1="30" x2="28" y2="22" stroke="#2e7d32" strokeWidth="1" opacity="0.5"/>
                <line x1="40" y1="26" x2="52" y2="20" stroke="#2e7d32" strokeWidth="1" opacity="0.5"/>
                {/* Number */}
                <circle cx="68" cy="10" r="8" fill="#1c0f00" opacity="0.7"/>
                <text x="68" y="14" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{i + 1}</text>
              </svg>
              <span className="puzzle-label">{item}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="print-recording-table">
        <h3>Recording Sheet — Match the number to the plant name</h3>
        <div className="recording-grid">
          {items.map((_, i) => (
            <div key={i} className="recording-row">
              <span className="recording-num">{i + 1}</span>
              <span className="recording-line"/>
            </div>
          ))}
        </div>
      </div>

      <div className="print-footer">⚜ Scouts Australia · Printable Activity Sheet · Cut along dashed lines</div>
    </div>
  );
}

function OrienteeringSheet({ content, title }: { content: PrintableContent; title: string }) {
  const controls = content.controls ?? [];
  const bearings = content.bearings ?? [];
  return (
    <div className="printable-sheet">
      <div className="print-header">
        <div className="print-logo">⚜ Scout Program Builder</div>
        <h1 className="print-title">{title}</h1>
        <p className="print-sub">{content.instructions ?? "Follow the bearings to find each control point. Record your answer at each."}</p>
      </div>

      <div className="orien-layout">
        {/* Map grid */}
        <div className="orien-map">
          <div className="map-grid">
            {/* Grid lines */}
            <svg viewBox="0 0 300 300" className="map-svg">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#c8e6c9" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="300" height="300" fill="#f1f8e9"/>
              <rect width="300" height="300" fill="url(#grid)"/>
              {/* Compass rose */}
              <g transform="translate(260,40)">
                <circle cx="0" cy="0" r="18" fill="white" stroke="#78350f" strokeWidth="1"/>
                <polygon points="0,-14 3,-4 0,0 -3,-4" fill="#92400e"/>
                <polygon points="0,14 3,4 0,0 -3,4" fill="#44260a" opacity="0.4"/>
                <text x="0" y="-18" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#92400e">N</text>
              </g>
              {/* Control markers */}
              {controls.map((c, i) => {
                const x = 40 + (i % 3) * 90 + 30;
                const y = 60 + Math.floor(i / 3) * 80 + 20;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="12" fill="none" stroke="#d97706" strokeWidth="2"/>
                    <circle cx={x} cy={y} r="3" fill="#d97706"/>
                    <text x={x} y={y - 16} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400e">{c.id}</text>
                  </g>
                );
              })}
              {/* Start triangle */}
              <polygon points="30,270 40,252 50,270" fill="none" stroke="#15803d" strokeWidth="2"/>
              <text x="40" y="285" textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="bold">START</text>
            </svg>
          </div>
        </div>

        {/* Control table + bearing table */}
        <div className="orien-tables">
          <h3 className="orien-section-title">Control Points</h3>
          <table className="orien-table">
            <thead><tr><th>ID</th><th>Clue</th><th>Found? ✓</th></tr></thead>
            <tbody>
              {controls.map((c, i) => (
                <tr key={i}><td className="bold">{c.id}</td><td>{c.clue}</td><td className="check-cell"/></tr>
              ))}
            </tbody>
          </table>

          <h3 className="orien-section-title" style={{ marginTop: 20 }}>Bearing Log</h3>
          <table className="orien-table">
            <thead><tr><th>From</th><th>To</th><th>Bearing</th><th>Paces</th></tr></thead>
            <tbody>
              {bearings.map((b, i) => (
                <tr key={i}><td>{b.from}</td><td>{b.to}</td><td className="bold">{b.bearing}°</td><td/></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="print-footer">⚜ Scouts Australia · Orienteering Sheet</div>
    </div>
  );
}

function FirstAidCard({ content, title }: { content: PrintableContent; title: string }) {
  return (
    <div className="printable-sheet">
      <div className="print-header danger">
        <div className="print-logo">⚜ Scout Program Builder</div>
        <h1 className="print-title">{title}</h1>
        <div className="scenario-badge">SCENARIO CARD — TRAINING ONLY</div>
      </div>

      <div className="fa-layout">
        <div className="fa-scenario-box">
          <h3 className="fa-section">📍 The Scenario</h3>
          <p className="fa-text">{content.scenario ?? ""}</p>
        </div>

        {(content.roles ?? []).length > 0 && (
          <div className="fa-roles">
            <h3 className="fa-section">👥 Roles</h3>
            {(content.roles ?? []).map((r, i) => <p key={i} className="fa-text">{r}</p>)}
          </div>
        )}

        <div className="fa-conditions">
          <h3 className="fa-section">🩺 Patient Condition</h3>
          <ul>{(content.patientCondition ?? []).map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>

        <div className="fa-actions">
          <h3 className="fa-section">✅ Required Actions (in order)</h3>
          {(content.actions ?? []).map((a, i) => (
            <div key={i} className="fa-action-row">
              <div className="fa-action-num">{i + 1}</div>
              <div className="fa-action-text">{a}</div>
              <div className="fa-action-check"/>
            </div>
          ))}
        </div>

        {(content.objectives ?? []).length > 0 && (
          <div className="fa-objectives">
            <h3 className="fa-section">🎯 Objectives</h3>
            <ul>{(content.objectives ?? []).map((o, i) => <li key={i}>{o}</li>)}</ul>
          </div>
        )}

        <div className="fa-debrief">
          <h3 className="fa-section">💬 Debrief Points</h3>
          <p className="fa-text">{content.debrief ?? ""}</p>
          <div className="fa-notes-lines">
            {[1,2,3].map(i => <div key={i} className="fa-line"/>)}
          </div>
        </div>
      </div>
      <div className="print-footer">⚜ Scouts Australia · First Aid Training Scenario · Training Only — Not a medical document</div>
    </div>
  );
}

function CipherSheet({ content, title }: { content: PrintableContent; title: string }) {
  const key = content.key ?? {};
  return (
    <div className="printable-sheet">
      <div className="print-header">
        <div className="print-logo">⚜ Scout Program Builder</div>
        <h1 className="print-title">{title}</h1>
        <p className="print-sub">{content.cipherType} Cipher · {content.instructions}</p>
      </div>

      <div className="cipher-key-box">
        <h3>Cipher Key</h3>
        <div className="cipher-key-grid">
          {Object.entries(key).map(([k, v]) => (
            <div key={k} className="cipher-pair">
              <span className="cipher-plain">{k}</span>
              <span className="cipher-arrow">→</span>
              <span className="cipher-encoded">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cipher-messages">
        <h3>Messages to Decode</h3>
        {(content.messages ?? []).map((m, i) => (
          <div key={i} className="cipher-msg-block">
            <p className="cipher-msg">{m}</p>
            <div className="cipher-answer-line"/>
          </div>
        ))}
      </div>
      <div className="print-footer">⚜ Scouts Australia · Cipher Activity Sheet</div>
    </div>
  );
}

function KimsGameSheet({ content, title }: { content: PrintableContent; title: string }) {
  const items = content.items ?? [];
  return (
    <div className="printable-sheet">
      <div className="print-header">
        <div className="print-logo">⚜ Scout Program Builder</div>
        <h1 className="print-title">{title}</h1>
        <p className="print-sub">Memorise the items on the tray, then write as many as you can remember.</p>
      </div>

      <div className="kims-two-col">
        <div className="kims-tray">
          <h3>Leader's Tray List (Leaders Only)</h3>
          <div className="kims-items-grid">
            {items.map((item, i) => (
              <div key={i} className="kims-item">
                <span className="kims-num">{i + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="kims-scout-sheet">
          <h3>Scout Recording Sheet</h3>
          <p className="kims-instructions">Write every item you can remember:</p>
          <div className="kims-lines">
            {Array.from({ length: Math.max(items.length, 20) }, (_, i) => (
              <div key={i} className="kims-line">
                <span className="kims-line-num">{i + 1}.</span>
                <div className="kims-line-rule"/>
              </div>
            ))}
          </div>
          <div className="kims-score">Score: _______ / {items.length}</div>
        </div>
      </div>
      <div className="print-footer">⚜ Scouts Australia · Kim's Game Activity Sheet</div>
    </div>
  );
}

function GenericWorksheet({ content, title }: { content: PrintableContent; title: string }) {
  return (
    <div className="printable-sheet">
      <div className="print-header">
        <div className="print-logo">⚜ Scout Program Builder</div>
        <h1 className="print-title">{content.title ?? title}</h1>
      </div>
      {(content.sections ?? []).map((s, i) => (
        <div key={i} className="ws-section">
          <h3 className="ws-heading">{s.heading}</h3>
          {Array.from({ length: s.lines ?? 3 }, (_, j) => (
            <div key={j} className="ws-line"/>
          ))}
        </div>
      ))}
      <div className="print-footer">⚜ Scouts Australia · Activity Worksheet</div>
    </div>
  );
}

function PrintableRenderer({ printable }: { printable: Printable }) {
  if (!printable.needed || !printable.content || !printable.type) {
    return (
      <div className="no-printable">
        <div className="no-printable-icon">🎒</div>
        <h3>No printable needed</h3>
        <p>{printable.reason}</p>
      </div>
    );
  }
  const title = printable.title ?? "Activity Sheet";
  const content = printable.content;
  switch (printable.type) {
    case "nature_puzzle":      return <NaturePuzzle content={content} title={title}/>;
    case "orienteering_sheet": return <OrienteeringSheet content={content} title={title}/>;
    case "first_aid_scenario":
    case "scenario_card":      return <FirstAidCard content={content} title={title}/>;
    case "cipher_sheet":       return <CipherSheet content={content} title={title}/>;
    case "kims_game_sheet":    return <KimsGameSheet content={content} title={title}/>;
    default:                   return <GenericWorksheet content={content} title={title}/>;
  }
}

// ── Inline component ──────────────────────────────────────────────────────────

function Inline({ t }: { t: string }) {
  const parts = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return <>{parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2,-2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1,-1)}</em>;
    return p;
  })}</>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "instructions" | "printable" | "script";

export default function ActivityPage() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState<Tab>("instructions");

  useEffect(() => {
    // Read params from URL: ?name=...&context=...&section=...&oas=...
    const params = new URLSearchParams(window.location.search);
    const activityName    = decodeURIComponent(params.get("name") ?? "");
    const activityContext = decodeURIComponent(params.get("context") ?? "");
    const section         = decodeURIComponent(params.get("section") ?? "Scouts");
    const oasContext      = decodeURIComponent(params.get("oas") ?? "");

    if (!activityName) { setError("No activity specified."); setLoading(false); return; }

    fetch("/api/generate-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityName, activityContext, section, oasContext }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.activity) setActivity(data.activity);
        else setError("Failed to generate activity.");
        setLoading(false);
      })
      .catch(() => { setError("Network error."); setLoading(false); });
  }, []);

  const difficultyColor: Record<string, string> = {
    Easy: "#15803d", Moderate: "#d97706", Challenging: "#dc2626",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #1a1208; }

        .ap-root {
          min-height: 100vh; background: #1a1208;
          background-image: radial-gradient(ellipse 90% 40% at 50% -5%, rgba(101,62,11,0.45) 0%, transparent 60%);
          font-family: 'Source Serif 4', Georgia, serif;
          padding-bottom: 80px;
        }

        /* ── Header ── */
        .ap-header {
          background: #fdf6e3;
          border-bottom: 1px solid rgba(101,62,11,0.15);
          position: relative;
        }
        .ap-header::before {
          content: ''; position: absolute; top: 0; bottom: 0; left: 44px;
          width: 1px; background: rgba(220,38,38,0.15); pointer-events: none;
        }
        .ap-header-inner {
          max-width: 900px; margin: 0 auto;
          padding: 24px 40px 0 64px;
        }
        .ap-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Teko', sans-serif; font-size: 12px; letter-spacing: 0.15em;
          text-transform: uppercase; color: #a16207; text-decoration: none;
          margin-bottom: 16px; cursor: pointer; background: none; border: none;
          transition: color 0.2s;
        }
        .ap-back:hover { color: #78350f; }
        .ap-eyebrow {
          font-family: 'Teko', sans-serif; font-size: 11px; letter-spacing: 0.28em;
          text-transform: uppercase; color: #a16207; margin-bottom: 6px;
          display: flex; align-items: center; gap: 6px;
        }
        .ap-title {
          font-family: 'Teko', sans-serif; font-size: clamp(28px,5vw,44px);
          font-weight: 600; color: #1c0f00; line-height: 1; margin-bottom: 10px;
        }
        .ap-tagline { font-size: 15px; color: #78350f; font-style: italic; margin-bottom: 16px; }
        .ap-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 0; }
        .ap-meta-pill {
          padding: 4px 11px; border-radius: 2px;
          border: 1px solid rgba(101,62,11,0.2); background: rgba(255,255,255,0.6);
          font-family: 'Teko', sans-serif; font-size: 12px; letter-spacing: 0.08em; color: #78350f;
        }
        .ap-meta-pill.diff { color: white; border-color: transparent; }

        /* ── Tabs ── */
        .ap-tabs {
          display: flex; gap: 0; margin-top: 20px;
          border-top: 1px solid rgba(101,62,11,0.12);
        }
        .ap-tab {
          padding: 13px 24px; background: none; border: none; cursor: pointer;
          font-family: 'Teko', sans-serif; font-size: 14px; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(120,53,15,0.5);
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: color 0.2s, border-color 0.2s;
          display: flex; align-items: center; gap: 7px;
        }
        .ap-tab:hover { color: #78350f; }
        .ap-tab.active { color: #1c0f00; border-bottom-color: #92400e; }
        .ap-tab-badge {
          background: #15803d; color: white; border-radius: 2px;
          font-size: 9px; padding: 1px 5px; letter-spacing: 0.08em;
        }

        /* ── Content area ── */
        .ap-content {
          max-width: 900px; margin: 0 auto; padding: 32px 40px 0 64px;
        }

        /* ── Instructions tab ── */
        .inst-section { margin-bottom: 28px; }
        .inst-heading {
          font-family: 'Teko', sans-serif; font-size: 16px; letter-spacing: 0.14em;
          text-transform: uppercase; color: #92400e; margin-bottom: 10px;
          padding-bottom: 5px; border-bottom: 1px dashed rgba(101,62,11,0.2);
        }
        .inst-para { font-size: 14.5px; line-height: 1.72; color: #fdf6e3; margin-bottom: 8px; }
        .inst-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
        .inst-list li {
          display: flex; gap: 10px; align-items: baseline;
          font-size: 14px; line-height: 1.65; color: #fdf6e3;
        }
        .inst-list li::before {
          content: ''; width: 5px; height: 5px; border-radius: 50%;
          background: #a16207; flex-shrink: 0; margin-top: 7px;
        }

        /* Equipment box */
        .equip-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .equip-col {
          background: rgba(253,246,227,0.06); border: 1px solid rgba(161,98,7,0.15);
          border-radius: 3px; padding: 14px 16px;
        }
        .equip-col-title {
          font-family: 'Teko', sans-serif; font-size: 12px; letter-spacing: 0.14em;
          text-transform: uppercase; color: #a16207; margin-bottom: 8px;
        }
        .equip-item { font-size: 13px; color: rgba(253,246,227,0.8); padding: 3px 0; display: flex; gap: 6px; align-items: baseline; }
        .equip-item::before { content: '—'; color: rgba(161,98,7,0.4); flex-shrink: 0; }

        /* Run sheet table */
        .run-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .run-table thead tr { background: #1c0f00; }
        .run-table thead th {
          padding: 8px 14px; text-align: left;
          font-family: 'Teko', sans-serif; font-size: 11px; letter-spacing: 0.14em;
          text-transform: uppercase; color: #fde68a; font-weight: 500;
        }
        .run-table tbody tr { border-bottom: 1px solid rgba(253,246,227,0.08); }
        .run-table tbody tr:nth-child(even) { background: rgba(253,246,227,0.03); }
        .run-table tbody td { padding: 8px 14px; color: rgba(253,246,227,0.85); vertical-align: top; line-height: 1.5; }
        .run-table tbody td:first-child { font-family: 'Teko', sans-serif; font-size: 14px; color: #fde68a; white-space: nowrap; }

        /* Safety */
        .safety-item {
          display: flex; gap: 10px; align-items: baseline;
          font-size: 14px; line-height: 1.65; color: rgba(253,246,227,0.85);
          padding: 5px 0; border-bottom: 1px dotted rgba(253,246,227,0.08);
        }
        .safety-item::before { content: '⚠'; flex-shrink: 0; font-size: 13px; }

        /* Variations */
        .var-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .var-box {
          background: rgba(253,246,227,0.05); border: 1px solid rgba(161,98,7,0.15);
          border-radius: 3px; padding: 14px 16px;
        }
        .var-box-title {
          font-family: 'Teko', sans-serif; font-size: 13px; letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 6px;
        }
        .var-box-title.easier { color: #15803d; }
        .var-box-title.harder { color: #dc2626; }
        .var-text { font-size: 13.5px; line-height: 1.65; color: rgba(253,246,227,0.75); }

        /* ── Leader script tab ── */
        .script-block { margin-bottom: 28px; }
        .script-label {
          font-family: 'Teko', sans-serif; font-size: 13px; letter-spacing: 0.16em;
          text-transform: uppercase; color: #a16207; margin-bottom: 6px;
        }
        .script-text {
          background: rgba(253,246,227,0.07);
          border-left: 3px solid rgba(161,98,7,0.4);
          border-radius: 0 3px 3px 0;
          padding: 14px 18px;
          font-size: 15px; line-height: 1.8; color: #fdf6e3;
          font-style: italic;
        }
        .script-qs { display: flex; flex-direction: column; gap: 8px; }
        .script-q {
          display: flex; gap: 12px; align-items: baseline;
          font-size: 14.5px; line-height: 1.65; color: rgba(253,246,227,0.85);
        }
        .script-q-num {
          flex-shrink: 0; width: 22px; height: 22px; background: #92400e; color: white;
          border-radius: 2px; font-family: 'Teko', sans-serif; font-size: 13px;
          display: flex; align-items: center; justify-content: center;
        }

        /* ── Printable tab ── */
        .print-actions {
          display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .print-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 2px; cursor: pointer;
          font-family: 'Teko', sans-serif; font-size: 15px; letter-spacing: 0.12em;
          text-transform: uppercase; border: none; transition: all 0.2s;
        }
        .print-btn.primary { background: #1c0f00; color: #fde68a; }
        .print-btn.primary:hover { background: #92400e; }
        .print-btn.secondary { background: rgba(253,246,227,0.08); border: 1px solid rgba(161,98,7,0.3); color: #d6b77a; }
        .print-btn.secondary:hover { background: rgba(253,246,227,0.15); }

        /* ── Printable sheet (print-ready, cream paper) ── */
        .printable-sheet {
          background: #fdf6e3; border-radius: 3px;
          border: 1px solid rgba(101,62,11,0.2);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          padding: 32px 36px 24px;
          font-family: 'Source Serif 4', serif;
          position: relative;
        }
        .print-header { margin-bottom: 24px; border-bottom: 2px solid rgba(101,62,11,0.15); padding-bottom: 16px; }
        .print-header.danger { border-bottom-color: rgba(220,38,38,0.3); }
        .print-logo { font-family: 'Teko', sans-serif; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #a16207; margin-bottom: 6px; }
        .print-title { font-family: 'Teko', sans-serif; font-size: 28px; font-weight: 600; color: #1c0f00; line-height: 1; margin-bottom: 6px; }
        .print-sub { font-size: 12px; color: #78350f; font-style: italic; }
        .print-footer {
          margin-top: 24px; padding-top: 12px;
          border-top: 1px dashed rgba(101,62,11,0.25);
          font-family: 'Teko', sans-serif; font-size: 10px; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(101,62,11,0.45); text-align: center;
        }

        /* Nature puzzle */
        .puzzle-grid {
          display: grid; gap: 0;
          border: 2px dashed rgba(101,62,11,0.25);
          margin-bottom: 20px;
        }
        .puzzle-cell {
          border: 1.5px dashed rgba(101,62,11,0.3);
          position: relative; overflow: hidden; min-height: 110px;
        }
        .puzzle-cell-inner { padding: 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
        .puzzle-svg { width: 80px; height: 60px; }
        .puzzle-label { font-size: 11px; font-weight: 600; color: #44260a; text-align: center; text-transform: capitalize; }
        .print-recording-table { margin-top: 16px; }
        .print-recording-table h3 { font-family: 'Teko', sans-serif; font-size: 14px; letter-spacing: 0.1em; color: #44260a; margin-bottom: 10px; }
        .recording-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
        .recording-row { display: flex; align-items: center; gap: 6px; }
        .recording-num { font-family: 'Teko', sans-serif; font-size: 13px; font-weight: 600; color: #78350f; width: 20px; flex-shrink: 0; }
        .recording-line { flex: 1; height: 1px; background: rgba(101,62,11,0.3); }

        /* Orienteering */
        .orien-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
        .map-svg { width: 100%; height: auto; }
        .orien-section-title { font-family: 'Teko', sans-serif; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #44260a; margin-bottom: 8px; }
        .orien-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .orien-table thead tr { background: #1c0f00; }
        .orien-table thead th { padding: 6px 10px; text-align: left; color: #fde68a; font-family: 'Teko', sans-serif; font-size: 11px; letter-spacing: 0.1em; }
        .orien-table tbody tr { border-bottom: 1px solid rgba(101,62,11,0.1); }
        .orien-table tbody td { padding: 6px 10px; color: #2d1a06; }
        .orien-table tbody td.bold { font-weight: 700; }
        .orien-table tbody td.check-cell { width: 48px; border: 1px solid rgba(101,62,11,0.2); min-height: 22px; }
        .scenario-badge {
          display: inline-block; background: #dc2626; color: white; padding: 3px 10px;
          border-radius: 2px; font-family: 'Teko', sans-serif; font-size: 11px; letter-spacing: 0.12em;
          margin-top: 8px;
        }
        /* First Aid */
        .fa-layout { display: flex; flex-direction: column; gap: 16px; }
        .fa-section { font-family: 'Teko', sans-serif; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; color: #44260a; margin-bottom: 6px; }
        .fa-text { font-size: 13.5px; line-height: 1.65; color: #2d1a06; }
        .fa-scenario-box, .fa-conditions, .fa-actions, .fa-debrief, .fa-roles, .fa-objectives {
          padding: 12px 16px; border: 1px solid rgba(101,62,11,0.15); border-radius: 2px; background: rgba(255,255,255,0.4);
        }
        .fa-scenario-box { border-left: 3px solid #dc2626; }
        .fa-conditions ul, .fa-objectives ul { list-style: disc; padding-left: 16px; font-size: 13px; color: #2d1a06; }
        .fa-action-row { display: flex; gap: 10px; align-items: center; padding: 5px 0; border-bottom: 1px dotted rgba(101,62,11,0.15); }
        .fa-action-num { width: 22px; height: 22px; background: #1c0f00; color: #fde68a; border-radius: 2px; font-family: 'Teko', sans-serif; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .fa-action-text { flex: 1; font-size: 13px; color: #2d1a06; }
        .fa-action-check { width: 20px; height: 20px; border: 1.5px solid rgba(101,62,11,0.3); border-radius: 2px; flex-shrink: 0; }
        .fa-notes-lines { margin-top: 8px; }
        .fa-line { height: 1px; background: rgba(101,62,11,0.25); margin: 14px 0; }
        /* Cipher */
        .cipher-key-box { background: rgba(255,255,255,0.5); border: 1px solid rgba(101,62,11,0.15); border-radius: 2px; padding: 14px 16px; margin-bottom: 20px; }
        .cipher-key-box h3, .cipher-messages h3 { font-family: 'Teko', sans-serif; font-size: 15px; letter-spacing: 0.1em; color: #44260a; margin-bottom: 10px; }
        .cipher-key-grid { display: grid; grid-template-columns: repeat(6,1fr); gap: 6px; }
        .cipher-pair { display: flex; flex-direction: column; align-items: center; gap: 2px; background: rgba(101,62,11,0.06); padding: 6px; border-radius: 2px; }
        .cipher-plain { font-family: 'Teko', sans-serif; font-size: 16px; font-weight: 600; color: #1c0f00; }
        .cipher-arrow { font-size: 10px; color: #a16207; }
        .cipher-encoded { font-size: 12px; color: #78350f; font-weight: 600; }
        .cipher-msg-block { margin-bottom: 16px; }
        .cipher-msg { font-family: monospace; font-size: 15px; letter-spacing: 0.15em; color: #1c0f00; margin-bottom: 8px; padding: 8px; background: rgba(101,62,11,0.06); border-radius: 2px; }
        .cipher-answer-line { height: 1px; background: rgba(101,62,11,0.3); }
        /* Kim's Game */
        .kims-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .kims-two-col h3 { font-family: 'Teko', sans-serif; font-size: 14px; letter-spacing: 0.1em; color: #44260a; margin-bottom: 10px; }
        .kims-items-grid { display: flex; flex-direction: column; gap: 4px; }
        .kims-item { display: flex; gap: 8px; align-items: center; font-size: 12.5px; color: #2d1a06; padding: 3px 0; border-bottom: 1px dotted rgba(101,62,11,0.12); }
        .kims-num { font-family: 'Teko', sans-serif; font-size: 13px; font-weight: 600; color: #78350f; width: 20px; flex-shrink: 0; }
        .kims-instructions { font-size: 12px; color: #78350f; font-style: italic; margin-bottom: 10px; }
        .kims-lines { display: flex; flex-direction: column; gap: 0; }
        .kims-line { display: flex; gap: 8px; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(101,62,11,0.2); }
        .kims-line-num { font-family: 'Teko', sans-serif; font-size: 12px; color: #a16207; width: 20px; flex-shrink: 0; }
        .kims-line-rule { flex: 1; }
        .kims-score { margin-top: 14px; font-family: 'Teko', sans-serif; font-size: 16px; color: #44260a; }
        /* Generic worksheet */
        .ws-section { margin-bottom: 20px; }
        .ws-heading { font-family: 'Teko', sans-serif; font-size: 15px; letter-spacing: 0.1em; color: #44260a; margin-bottom: 10px; }
        .ws-line { height: 1px; background: rgba(101,62,11,0.25); margin: 14px 0; }

        /* No printable */
        .no-printable {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 48px 0; text-align: center;
        }
        .no-printable-icon { font-size: 40px; }
        .no-printable h3 { font-family: 'Teko', sans-serif; font-size: 22px; letter-spacing: 0.06em; color: #fdf6e3; }
        .no-printable p { font-size: 14px; color: rgba(253,246,227,0.55); font-style: italic; max-width: 360px; line-height: 1.65; }

        /* Loading / error */
        .ap-loading {
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; padding: 80px 0; color: rgba(253,246,227,0.6); font-style: italic;
        }
        .ap-spinner {
          width: 36px; height: 36px;
          border: 2px solid rgba(253,246,227,0.1);
          border-top-color: rgba(253,246,227,0.6);
          border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Print override */
        @media print {
          .ap-root { background: white !important; }
          .ap-header, .ap-tabs, .print-actions { display: none !important; }
          .ap-content { padding: 0 !important; max-width: 100% !important; }
          .printable-sheet { box-shadow: none !important; border: none !important; }
          body { background: white !important; }
        }

        @media (max-width: 640px) {
          .ap-header-inner, .ap-content { padding-left: 24px; padding-right: 24px; }
          .ap-header::before { left: 16px; }
          .equip-grid { grid-template-columns: 1fr; }
          .var-grid { grid-template-columns: 1fr; }
          .orien-layout { grid-template-columns: 1fr; }
          .kims-two-col { grid-template-columns: 1fr; }
          .puzzle-grid { grid-template-columns: repeat(2,1fr) !important; }
          .cipher-key-grid { grid-template-columns: repeat(4,1fr); }
        }
      `}</style>

      <div className="ap-root">
        {/* Header */}
        <div className="ap-header">
          <div className="ap-header-inner">
            <button className="ap-back" onClick={() => window.close()}>← Close Tab</button>

            {loading ? (
              <div style={{ paddingBottom: 32 }}>
                <div className="ap-loading">
                  <div className="ap-spinner"/>
                  <span>Generating activity resources…</span>
                </div>
              </div>
            ) : error ? (
              <div style={{ paddingBottom: 32, color: "#fdf6e3" }}>{error}</div>
            ) : activity ? (
              <>
                <div className="ap-eyebrow">⚜ Activity Resource</div>
                <h1 className="ap-title">{activity.title}</h1>
                {activity.tagline && <p className="ap-tagline">{activity.tagline}</p>}
                <div className="ap-meta">
                  {activity.duration   && <span className="ap-meta-pill">⏱ {activity.duration}</span>}
                  {activity.groupSize  && <span className="ap-meta-pill">👥 {activity.groupSize}</span>}
                  {activity.oasLink    && <span className="ap-meta-pill">⚜ {activity.oasLink}</span>}
                  {activity.difficulty && (
                    <span className="ap-meta-pill diff" style={{ background: difficultyColor[activity.difficulty] ?? "#78350f" }}>
                      {activity.difficulty}
                    </span>
                  )}
                </div>

                {/* Tabs */}
                <div className="ap-tabs">
                  <button className={`ap-tab ${tab==="instructions"?"active":""}`} onClick={() => setTab("instructions")}>
                    📋 Instructions
                  </button>
                  <button className={`ap-tab ${tab==="printable"?"active":""}`} onClick={() => setTab("printable")}>
                    🖨 Printable
                    {activity.printable?.needed && <span className="ap-tab-badge">SHEET</span>}
                  </button>
                  <button className={`ap-tab ${tab==="script"?"active":""}`} onClick={() => setTab("script")}>
                    🎙 Leader Script
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Content */}
        {!loading && !error && activity && (
          <div className="ap-content">

            {/* ── Instructions tab ── */}
            {tab === "instructions" && (
              <div>
                {activity.instructions.overview && (
                  <div className="inst-section">
                    <div className="inst-heading">Overview</div>
                    <p className="inst-para"><Inline t={activity.instructions.overview}/></p>
                  </div>
                )}

                {(activity.instructions.setup ?? []).length > 0 && (
                  <div className="inst-section">
                    <div className="inst-heading">Setup</div>
                    <ul className="inst-list">
                      {activity.instructions.setup.map((s,i) => <li key={i}><Inline t={s}/></li>)}
                    </ul>
                  </div>
                )}

                {(activity.instructions.runSheet ?? []).length > 0 && (
                  <div className="inst-section">
                    <div className="inst-heading">Timed Run Sheet</div>
                    <div style={{ overflowX: "auto", borderRadius: 3, border: "1px solid rgba(253,246,227,0.1)" }}>
                      <table className="run-table">
                        <thead>
                          <tr><th>Time</th><th>Action</th><th>Leader Notes</th></tr>
                        </thead>
                        <tbody>
                          {activity.instructions.runSheet.map((r,i) => (
                            <tr key={i}>
                              <td>{r.time}</td>
                              <td><Inline t={r.action}/></td>
                              <td><Inline t={r.leaderNotes}/></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activity.instructions.equipment && (
                  <div className="inst-section">
                    <div className="inst-heading">Equipment</div>
                    <div className="equip-grid">
                      {[
                        { label: "From the Shed", items: activity.instructions.equipment.fromShed },
                        { label: "Leaders to Bring", items: activity.instructions.equipment.toBring },
                        { label: "Consumables", items: activity.instructions.equipment.consumables },
                      ].map(col => (
                        <div key={col.label} className="equip-col">
                          <div className="equip-col-title">{col.label}</div>
                          {(col.items ?? []).map((item,i) => (
                            <div key={i} className="equip-item">{item}</div>
                          ))}
                          {(col.items ?? []).length === 0 && <div className="equip-item" style={{opacity:0.4}}>None</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(activity.instructions.safety ?? []).length > 0 && (
                  <div className="inst-section">
                    <div className="inst-heading">Safety Considerations</div>
                    {activity.instructions.safety.map((s,i) => (
                      <div key={i} className="safety-item"><Inline t={s}/></div>
                    ))}
                  </div>
                )}

                {activity.instructions.variations && (
                  <div className="inst-section">
                    <div className="inst-heading">Variations</div>
                    <div className="var-grid">
                      <div className="var-box">
                        <div className="var-box-title easier">↓ Easier</div>
                        <p className="var-text"><Inline t={activity.instructions.variations.easier}/></p>
                      </div>
                      <div className="var-box">
                        <div className="var-box-title harder">↑ Harder</div>
                        <p className="var-text"><Inline t={activity.instructions.variations.harder}/></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Printable tab ── */}
            {tab === "printable" && (
              <div>
                {activity.printable?.needed && (
                  <div className="print-actions">
                    <button className="print-btn primary" onClick={() => window.print()}>🖨 Print Sheet</button>
                    <button className="print-btn secondary" onClick={() => {
                      const el = document.querySelector(".printable-sheet");
                      if (el) {
                        const win = window.open("", "_blank");
                        if (win) {
                          win.document.write(`<html><head><title>${activity.printable.title}</title></head><body>${(el as HTMLElement).outerHTML}</body></html>`);
                          win.document.close();
                          win.print();
                        }
                      }
                    }}>Open Print View</button>
                  </div>
                )}
                <PrintableRenderer printable={activity.printable}/>
              </div>
            )}

            {/* ── Script tab ── */}
            {tab === "script" && activity.leaderScript && (
              <div>
                {[
                  { label: "Introduction — say this to open the activity", text: activity.leaderScript.intro },
                  { label: "Instructions — explain the activity to Scouts", text: activity.leaderScript.instructions },
                  { label: "Debrief — closing the activity", text: activity.leaderScript.debrief },
                ].map(block => block.text && (
                  <div key={block.label} className="script-block">
                    <div className="script-label">{block.label}</div>
                    <div className="script-text"><Inline t={block.text}/></div>
                  </div>
                ))}

                {(activity.leaderScript.reflectionQuestions ?? []).length > 0 && (
                  <div className="script-block">
                    <div className="script-label">Reflection Questions</div>
                    <div className="script-qs">
                      {activity.leaderScript.reflectionQuestions.map((q,i) => (
                        <div key={i} className="script-q">
                          <div className="script-q-num">{i+1}</div>
                          <span><Inline t={q}/></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}
