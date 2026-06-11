"use client";

import { useEffect, useState, useId } from "react";
import { SECTION_COLOURS } from "@/lib/colours";
import type { GroupConfig, TermRow } from "@/lib/types";

const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = (h ?? 0) < 12 ? "AM" : "PM";
  const h12 = (h ?? 0) % 12 || 12;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
}

function getMeetingDates(start: Date, end: Date, dayName: string): Date[] {
  const target = DAY_INDEX[dayName] ?? 1;
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur.getDay() !== target) cur.setDate(cur.getDate() + 1);
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return dates;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function TermPage() {
  const [config, setConfig]           = useState<GroupConfig | null>(null);
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");
  const [rows, setRows]               = useState<TermRow[]>([]);
  const [suggesting, setSuggesting]   = useState(false);
  const [suggestError, setSuggestError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("groupConfig");
    if (raw) {
      try { setConfig(JSON.parse(raw) as GroupConfig); }
      catch { window.location.href = "/setup"; }
    } else {
      window.location.href = "/setup";
    }
    const savedRows = localStorage.getItem("termRows");
    if (savedRows) {
      try { setRows(JSON.parse(savedRows) as TermRow[]); }
      catch { /* ignore */ }
    }
  }, []);

  const col = config ? SECTION_COLOURS[config.section] : SECTION_COLOURS.Scouts;

  const buildSchedule = () => {
    if (!config || !startDate || !endDate) return;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s >= e) return;
    const dates = getMeetingDates(s, e, config.meetingDay);
    const newRows: TermRow[] = dates.map(d => ({
      id: uid(),
      date: formatDate(d),
      time: formatTime(config.meetingTime),
      topic: "",
      location: "Scout Hall",
      oasFocus: "",
      bring: "Uniform",
      leader: config.leaders[0] ?? "",
      assistantPatrol: "",
      consentRequired: false,
      rowType: "session",
    }));
    setRows(newRows);
    localStorage.setItem("termRows", JSON.stringify(newRows));
  };

  const updateRow = (id: string, field: keyof TermRow, value: string | boolean) => {
    setRows(prev => {
      const next = prev.map(r => r.id === id ? { ...r, [field]: value } : r);
      localStorage.setItem("termRows", JSON.stringify(next));
      return next;
    });
  };

  const addExtraRow = () => {
    if (!config) return;
    const newRow: TermRow = {
      id: uid(),
      date: "",
      time: formatTime(config.meetingTime),
      topic: "",
      location: "",
      oasFocus: "",
      bring: "",
      leader: config.leaders[0] ?? "",
      assistantPatrol: "",
      consentRequired: false,
      rowType: "extra",
    };
    setRows(prev => {
      const next = [...prev, newRow];
      localStorage.setItem("termRows", JSON.stringify(next));
      return next;
    });
  };

  const removeRow = (id: string) => {
    setRows(prev => {
      const next = prev.filter(r => r.id !== id);
      localStorage.setItem("termRows", JSON.stringify(next));
      return next;
    });
  };

  const handleSuggest = async () => {
    if (!config || rows.length === 0) return;
    setSuggesting(true);
    setSuggestError("");
    try {
      const res = await fetch("/api/generate-term", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupConfig: config,
          dates: rows.map(r => r.date),
        }),
      });
      const data = await res.json() as { suggestions?: Array<{ week: number; topic: string; oasFocus: string; location: string; bring: string }> };
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setRows(prev => {
          const next = prev.map((row, i) => {
            const sug = data.suggestions!.find(s => s.week === i + 1) ?? data.suggestions![i];
            if (!sug) return row;
            return {
              ...row,
              topic: sug.topic ?? row.topic,
              oasFocus: sug.oasFocus ?? row.oasFocus,
              location: sug.location ?? row.location,
              bring: sug.bring ?? row.bring,
            };
          });
          localStorage.setItem("termRows", JSON.stringify(next));
          return next;
        });
      }
    } catch {
      setSuggestError("Couldn't reach AI — check your connection and try again.");
    } finally {
      setSuggesting(false);
    }
  };

  const openRunSheet = (rowId: string) => {
    localStorage.setItem("activeRowId", rowId);
    window.location.href = "/runsheet";
  };

  if (!config) {
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

        .tp-root { min-height: 100vh; background: #1a1208; font-family: 'Source Serif 4', Georgia, serif; padding-bottom: 80px; }

        /* ── HEADER ── */
        .tp-header { background: #fdf6e3; border-bottom: 1px solid rgba(101,62,11,0.15); padding: 20px 32px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; position: relative; }
        .tp-header::before { content:''; position:absolute; top:0; bottom:0; left:40px; width:1px; background:rgba(220,38,38,0.12); }
        .tp-logo { font-family:'Teko',sans-serif; font-size:15px; letter-spacing:0.08em; color:rgba(44,26,6,0.5); text-decoration:none; padding-left:16px; }
        .tp-logo:hover { color:#78350f; }
        .tp-sep { color:rgba(101,62,11,0.25); font-size:14px; }
        .tp-group-pill { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:2px; font-family:'Teko',sans-serif; font-size:13px; letter-spacing:0.1em; text-transform:uppercase; border:1px solid; }
        .tp-header-title { font-family:'Teko',sans-serif; font-size:22px; font-weight:600; color:#1c0f00; flex:1; }
        .tp-edit-setup { margin-left:auto; font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.15em; text-transform:uppercase; color:#a16207; text-decoration:none; border:1px solid rgba(161,98,7,0.3); border-radius:2px; padding:5px 12px; transition:all 0.2s; }
        .tp-edit-setup:hover { border-color:#a16207; background:rgba(161,98,7,0.06); }

        /* ── CONTENT ── */
        .tp-content { max-width: 1200px; margin: 0 auto; padding: 40px 32px 0; }

        /* ── DATE PICKER CARD ── */
        .dp-card { background: rgba(253,246,227,0.06); border: 1px solid rgba(253,230,138,0.15); border-radius: 3px; padding: 24px 28px; margin-bottom: 28px; }
        .dp-title { font-family:'Teko',sans-serif; font-size:18px; letter-spacing:0.08em; color:#fde68a; margin-bottom:16px; }
        .dp-row { display:flex; align-items:flex-end; gap:16px; flex-wrap:wrap; }
        .dp-group { display:flex; flex-direction:column; gap:5px; }
        .dp-label { font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#a16207; }
        .dp-input { font-family:'Source Serif 4',serif; font-size:14px; color:#1c0f00; background:#fdf6e3; border:1px solid rgba(101,62,11,0.25); border-radius:2px; padding:8px 12px; outline:none; transition:border-color 0.2s,box-shadow 0.2s; }
        .dp-input:focus { border-color:#92400e; box-shadow:0 0 0 3px rgba(146,64,14,0.1); }
        .build-btn { font-family:'Teko',sans-serif; font-size:17px; letter-spacing:0.12em; text-transform:uppercase; background:#fde68a; color:#1c0f00; border:none; border-radius:2px; padding:10px 24px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .build-btn:hover { background:#fcd34d; transform:translateY(-1px); }
        .build-btn:disabled { opacity:0.4; cursor:default; transform:none; }

        /* ── ACTION BAR ── */
        .action-bar { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
        .action-bar-title { font-family:'Teko',sans-serif; font-size:22px; letter-spacing:0.04em; color:#fdf6e3; flex:1; }
        .suggest-btn { display:inline-flex; align-items:center; gap:8px; font-family:'Teko',sans-serif; font-size:15px; letter-spacing:0.1em; text-transform:uppercase; background:rgba(253,230,138,0.1); color:#fde68a; border:1px solid rgba(253,230,138,0.3); border-radius:2px; padding:9px 20px; cursor:pointer; transition:all 0.2s; }
        .suggest-btn:hover:not(:disabled) { background:rgba(253,230,138,0.18); border-color:rgba(253,230,138,0.6); }
        .suggest-btn:disabled { opacity:0.5; cursor:default; }
        .add-extra-btn { display:inline-flex; align-items:center; gap:8px; font-family:'Teko',sans-serif; font-size:14px; letter-spacing:0.1em; text-transform:uppercase; background:transparent; color:rgba(253,230,138,0.5); border:1px dashed rgba(253,230,138,0.2); border-radius:2px; padding:9px 16px; cursor:pointer; transition:all 0.2s; }
        .add-extra-btn:hover { border-color:rgba(253,230,138,0.45); color:rgba(253,230,138,0.8); }
        .error-msg { font-size:13px; color:#f87171; font-style:italic; }

        /* ── TABLE ── */
        .term-table-wrap { overflow-x: auto; border-radius: 3px; border: 1px solid rgba(253,230,138,0.12); }
        .term-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .term-table thead tr { background: #1c0f00; }
        .term-table thead th { padding: 10px 12px; text-align: left; font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#fde68a; font-weight:500; white-space:nowrap; }
        .term-table tbody tr { border-bottom: 1px solid rgba(253,246,227,0.07); transition:background 0.15s; }
        .term-table tbody tr:hover { background: rgba(253,246,227,0.04); }
        .term-table tbody tr.extra-row { opacity: 0.8; }
        .term-table tbody td { padding: 6px 8px; vertical-align: middle; color: rgba(253,246,227,0.85); }
        .wk-num { font-family:'Teko',sans-serif; font-size:13px; color:rgba(253,230,138,0.4); width:32px; text-align:center; }
        .date-cell { font-family:'Teko',sans-serif; font-size:13px; color:#fde68a; white-space:nowrap; min-width:120px; }
        .time-cell { font-family:'Teko',sans-serif; font-size:13px; color:rgba(253,230,138,0.6); white-space:nowrap; }

        .cell-input { font-family:'Source Serif 4',serif; font-size:13px; color:#1c0f00; background:rgba(255,255,255,0.85); border:1px solid rgba(101,62,11,0.2); border-radius:2px; padding:5px 8px; width:100%; min-width:80px; outline:none; transition:border-color 0.15s,box-shadow 0.15s; }
        .cell-input:focus { border-color:#92400e; box-shadow:0 0 0 2px rgba(146,64,14,0.12); background:white; }
        .cell-input::placeholder { color:#b59060; }
        .cell-input.date-input { min-width:100px; }
        .cell-input.topic-input { min-width:160px; }
        .cell-input.oas-input { min-width:120px; }
        .cell-input.loc-input { min-width:100px; }
        .cell-input.bring-input { min-width:120px; }
        .cell-input.leader-input { min-width:80px; }

        .consent-check { width:16px; height:16px; cursor:pointer; accent-color:#92400e; }

        .type-badge { display:inline-block; font-family:'Teko',sans-serif; font-size:10px; letter-spacing:0.12em; text-transform:uppercase; padding:2px 7px; border-radius:2px; }
        .type-session { background:rgba(107,191,90,0.15); color:#86efac; }
        .type-extra { background:rgba(253,230,138,0.1); color:#fde68a; }

        .rs-btn { display:inline-flex; align-items:center; gap:5px; font-family:'Teko',sans-serif; font-size:13px; letter-spacing:0.08em; text-transform:uppercase; background:#fde68a; color:#1c0f00; border:none; border-radius:2px; padding:5px 12px; cursor:pointer; white-space:nowrap; transition:all 0.15s; }
        .rs-btn:hover { background:#fcd34d; }

        .del-btn { width:28px; height:28px; display:flex; align-items:center; justify-content:center; background:transparent; border:1px solid rgba(253,246,227,0.1); border-radius:2px; cursor:pointer; color:rgba(253,246,227,0.3); font-size:13px; transition:all 0.15s; }
        .del-btn:hover { border-color:rgba(220,38,38,0.4); color:#f87171; background:rgba(220,38,38,0.08); }

        /* ── EMPTY STATE ── */
        .empty-state { text-align:center; padding:64px 32px; color:rgba(253,246,227,0.35); }
        .empty-state-icon { font-size:40px; margin-bottom:16px; }
        .empty-state h3 { font-family:'Teko',sans-serif; font-size:22px; letter-spacing:0.06em; color:rgba(253,246,227,0.5); margin-bottom:8px; }
        .empty-state p { font-size:14px; font-style:italic; line-height:1.6; }

        @media (max-width: 768px) {
          .tp-content { padding: 24px 16px 0; }
          .dp-row { flex-direction: column; align-items: stretch; }
        }
      `}</style>

      <div className="tp-root">

        {/* HEADER */}
        <div className="tp-header">
          <a href="/" className="tp-logo">⚜ Scout Program Builder</a>
          <span className="tp-sep">›</span>
          <div className="tp-group-pill" style={{ backgroundColor: `${col.accent}15`, borderColor: `${col.accent}35`, color: col.accent }}>
            {config.groupName || config.section} · {col.age}
          </div>
          <a href="/setup" className="tp-edit-setup">Edit Setup</a>
        </div>

        <div className="tp-content">

          {/* DATE PICKER */}
          <div className="dp-card">
            <div className="dp-title">Build Term Schedule</div>
            <div className="dp-row">
              <div className="dp-group">
                <label className="dp-label">Term Start</label>
                <input
                  type="date"
                  className="dp-input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="dp-group">
                <label className="dp-label">Term End</label>
                <input
                  type="date"
                  className="dp-input"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="build-btn"
                onClick={buildSchedule}
                disabled={!startDate || !endDate}
              >
                Build Schedule
              </button>
            </div>
          </div>

          {/* ACTION BAR */}
          {rows.length > 0 && (
            <div className="action-bar">
              <div className="action-bar-title">{rows.length} Sessions</div>
              <button
                type="button"
                className="suggest-btn"
                onClick={handleSuggest}
                disabled={suggesting}
              >
                {suggesting ? (
                  <>⏳ Suggesting…</>
                ) : (
                  <>✨ AI Suggest Themes</>
                )}
              </button>
              <button type="button" className="add-extra-btn" onClick={addExtraRow}>
                + Add Extra Event
              </button>
              {suggestError && <span className="error-msg">{suggestError}</span>}
            </div>
          )}

          {/* TABLE */}
          {rows.length > 0 ? (
            <div className="term-table-wrap">
              <table className="term-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Topic</th>
                    <th>Location</th>
                    <th>OAS Focus</th>
                    <th>Bring</th>
                    <th>Leader</th>
                    <th>Consent</th>
                    <th>Type</th>
                    <th>Run Sheet</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id} className={row.rowType === "extra" ? "extra-row" : ""}>
                      <td className="wk-num">{row.rowType === "session" ? i + 1 : "—"}</td>
                      <td className="date-cell">
                        {row.rowType === "extra" ? (
                          <input
                            className="cell-input date-input"
                            placeholder="e.g. 14 Jun"
                            value={row.date}
                            onChange={e => updateRow(row.id, "date", e.target.value)}
                          />
                        ) : (
                          <span>{row.date}</span>
                        )}
                      </td>
                      <td className="time-cell">
                        <input
                          className="cell-input"
                          style={{ minWidth: 72 }}
                          value={row.time}
                          onChange={e => updateRow(row.id, "time", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input topic-input"
                          placeholder="Session topic…"
                          value={row.topic}
                          onChange={e => updateRow(row.id, "topic", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input loc-input"
                          placeholder="Location"
                          value={row.location}
                          onChange={e => updateRow(row.id, "location", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input oas-input"
                          placeholder="OAS focus"
                          value={row.oasFocus}
                          onChange={e => updateRow(row.id, "oasFocus", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input bring-input"
                          placeholder="Items to bring"
                          value={row.bring}
                          onChange={e => updateRow(row.id, "bring", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input leader-input"
                          placeholder="Leader"
                          value={row.leader}
                          onChange={e => updateRow(row.id, "leader", e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          className="consent-check"
                          checked={row.consentRequired}
                          onChange={e => updateRow(row.id, "consentRequired", e.target.checked)}
                          title="Consent required"
                        />
                      </td>
                      <td>
                        <span className={`type-badge ${row.rowType === "session" ? "type-session" : "type-extra"}`}>
                          {row.rowType}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="rs-btn"
                          onClick={() => openRunSheet(row.id)}
                        >
                          Create →
                        </button>
                      </td>
                      <td>
                        <button type="button" className="del-btn" onClick={() => removeRow(row.id)} title="Remove">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🗓️</div>
              <h3>No schedule yet</h3>
              <p>
                Pick your term start and end dates above,<br />
                then click <strong>Build Schedule</strong> to generate your weekly program.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
