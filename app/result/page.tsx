"use client";

import { useEffect, useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Markdown parser
// ─────────────────────────────────────────────────────────────────────────────

type Block =
  | { type: "h1"; content: string }
  | { type: "h2"; content: string }
  | { type: "h3"; content: string }
  | { type: "h4"; content: string }
  | { type: "bullet"; content: string; depth: number }
  | { type: "numbered"; content: string; n: string }
  | { type: "meta"; key: string; value: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "rule" }
  | { type: "blank" }
  | { type: "text"; content: string };

function parse(raw: string): Block[] {
  const lines = raw.split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trim = line.trim();
    if (!trim) { out.push({ type: "blank" }); i++; continue; }
    if (/^[-*_]{3,}$/.test(trim)) { out.push({ type: "rule" }); i++; continue; }
    // Table
    if (trim.startsWith("|") && i + 1 < lines.length && /^\|[-| :]+\|/.test(lines[i + 1]?.trim() ?? "")) {
      const row = (r: string) => r.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      const headers = row(trim);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(row(lines[i])); i++; }
      out.push({ type: "table", headers, rows });
      continue;
    }
    if (trim.startsWith("#### ")) { out.push({ type: "h4", content: trim.slice(5) }); i++; continue; }
    if (trim.startsWith("### "))  { out.push({ type: "h3", content: trim.slice(4) }); i++; continue; }
    if (trim.startsWith("## "))   { out.push({ type: "h2", content: trim.slice(3) }); i++; continue; }
    if (trim.startsWith("# "))    { out.push({ type: "h1", content: trim.slice(2) }); i++; continue; }
    if (/^\*\*[^*]+\*\*$/.test(trim)) { out.push({ type: "h3", content: trim.replace(/^\*\*|\*\*$/g, "") }); i++; continue; }
    const bm = line.match(/^(\s*)[-*•]\s+(.+)/);
    if (bm) { out.push({ type: "bullet", content: bm[2], depth: Math.floor(bm[1].length / 2) }); i++; continue; }
    const nm = trim.match(/^(\d+)\.\s+(.+)/);
    if (nm) { out.push({ type: "numbered", content: nm[2], n: nm[1] }); i++; continue; }
    const mm = trim.match(/^([A-Za-z][A-Za-z &/():-]{1,35}):\s+(.+)/);
    if (mm && trim.length < 120 && !trim.includes("**")) { out.push({ type: "meta", key: mm[1], value: mm[2] }); i++; continue; }
    out.push({ type: "text", content: trim }); i++;
  }
  return out;
}

function Inline({ t }: { t: string }) {
  const parts = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return <>{parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      const name = p.slice(2, -2);
      const isActivity = /^[A-Z]/.test(name) && name.length > 3 && name.length < 60;
      if (isActivity) {
        const url = `/activity?name=${encodeURIComponent(name)}&section=Scouts&context=${encodeURIComponent(t)}`;
        return (
          <a key={i} href={url} target="_blank" rel="noreferrer" style={{
            fontWeight: 700, color: "#92400e",
            textDecoration: "underline", textDecorationStyle: "dotted" as const,
            textUnderlineOffset: "3px", cursor: "pointer",
          }}>
            {name} ↗
          </a>
        );
      }
      return <strong key={i}>{name}</strong>;
    }
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1,-1)}</em>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i}>{p.slice(1,-1)}</code>;
    return p;
  })}</>;
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map((b, i) => {
    switch (b.type) {
      case "h1": return <div key={i} className="rh1"><Inline t={b.content}/></div>;
      case "h2": return <div key={i} className="rh2"><span className="rh2a">◆</span><Inline t={b.content}/></div>;
      case "h3": return <div key={i} className="rh3"><Inline t={b.content}/></div>;
      case "h4": return <div key={i} className="rh4"><Inline t={b.content}/></div>;
      case "bullet": return (
        <div key={i} className={`rbul rbul${Math.min(b.depth,2)}`}>
          <span className="rdot"/>
          <span><Inline t={b.content}/></span>
        </div>
      );
      case "numbered": return (
        <div key={i} className="rnum">
          <span className="rnb">{b.n}</span>
          <span><Inline t={b.content}/></span>
        </div>
      );
      case "meta": return (
        <div key={i} className="rmeta">
          <span className="rmk"><Inline t={b.key}/></span>
          <span className="rmv"><Inline t={b.value}/></span>
        </div>
      );
      case "table": return (
        <div key={i} className="rtw">
          <table className="rt">
            <thead><tr>{b.headers.map((h,j)=><th key={j}><Inline t={h}/></th>)}</tr></thead>
            <tbody>{b.rows.map((row,ri)=>(
              <tr key={ri}>{row.map((cell,ci)=><td key={ci}><Inline t={cell}/></td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      );
      case "rule":  return <div key={i} className="rrul"/>;
      case "blank": return <div key={i} className="rblk"/>;
      case "text":  return <p key={i} className="rtxt"><Inline t={b.content}/></p>;
      default: return null;
    }
  })}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Term card — shown for year/multiyear plans
// ─────────────────────────────────────────────────────────────────────────────

type TermState = "idle" | "loading" | "done" | "error";

interface TermCardProps {
  termNumber: number;
  termSummary: string;   // the summary snippet from the year overview
  yearOverview: string;
  context: Record<string, unknown>;
}

function TermCard({ termNumber, termSummary, yearOverview, context }: TermCardProps) {
  const [state, setState] = useState<TermState>("idle");
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);

  const expand = useCallback(async () => {
    if (state === "done") { setOpen(o => !o); return; }
    setState("loading");
    setOpen(true);
    try {
      const res = await fetch("/api/generate-term", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termNumber, termTheme: "", yearOverview, context }),
      });
      const data = await res.json();
      setContent(data.result ?? "");
      setState("done");
    } catch {
      setState("error");
    }
  }, [state, termNumber, yearOverview, context]);

  const blocks = content ? parse(content) : [];

  return (
    <div className={`tcard ${open ? "tcard-open" : ""}`}>
      <div className="tcard-head" onClick={expand}>
        <div className="tcard-left">
          <span className="tcard-num">Term {termNumber}</span>
          <p className="tcard-preview">{termSummary || "Click to generate full term plan"}</p>
        </div>
        <div className="tcard-right">
          {state === "loading" && (
            <div className="tcard-spinner-wrap">
              <div className="tcard-spinner"/>
              <span className="tcard-status">Generating…</span>
            </div>
          )}
          {state === "error" && <span className="tcard-status err">Failed — retry</span>}
          {state === "idle" && <span className="tcard-cta">Expand Term →</span>}
          {state === "done" && <span className="tcard-cta">{open ? "Collapse ↑" : "Show ↓"}</span>}
        </div>
      </div>

      {open && state === "done" && (
        <div className="tcard-body">
          <Blocks blocks={blocks}/>
        </div>
      )}

      {open && state === "loading" && (
        <div className="tcard-loading">
          <div className="tcard-spinner large"/>
          <span>Building Term {termNumber} — run sheets, parade scripts, activities…</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Extract per-term summary snippets from the year overview text
// ─────────────────────────────────────────────────────────────────────────────

function extractTermSummaries(text: string, numTerms: number): string[] {
  const summaries: string[] = Array(numTerms).fill("");
  for (let t = 1; t <= numTerms; t++) {
    const re = new RegExp(`###?\\s*Term\\s*${t}[^\\n]*\\n([\\s\\S]*?)(?=###?\\s*Term\\s*${t+1}|$)`, "i");
    const m = text.match(re);
    if (m) {
      // Grab first non-empty line from the match as a preview
      const preview = m[1].split("\n").map(l=>l.trim()).find(l=>l && !l.startsWith("#") && !l.startsWith("|") && !l.startsWith("-"));
      summaries[t - 1] = preview ?? "";
    }
  }
  return summaries;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [program, setProgram]   = useState("");
  const [planMode, setPlanMode] = useState("session");
  const [context, setContext]   = useState<Record<string,unknown>>({});
  const [loaded, setLoaded]     = useState(false);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    const saved   = localStorage.getItem("generatedProgram") ?? "";
    const mode    = localStorage.getItem("planningMode") ?? "session";
    const ctx     = JSON.parse(localStorage.getItem("programContext") ?? "{}");
    setProgram(saved);
    setPlanMode(mode);
    setContext(ctx);
    setTimeout(() => setLoaded(true), 80);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(program).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2000); });
  };

  const isLongPlan  = planMode === "year" || planMode === "multiyear";
  const numTerms    = isLongPlan ? (Number(context.numTerms) || 4) : 0;
  const termSummaries = isLongPlan ? extractTermSummaries(program, numTerms) : [];

  // For year plans: split the overview text away from the ## Term Plans section
  // so we render the overview and then term cards separately
  let overviewText = program;
  if (isLongPlan) {
    const splitIdx = program.search(/^#{1,2}\s*Term Plans/im);
    if (splitIdx > -1) overviewText = program.slice(0, splitIdx);
  }

  const overviewBlocks = parse(overviewText);
  const modeLabel: Record<string,string> = {
    session:"Session Plan", term:"Term Plan", year:"Year Plan", multiyear:"Multi-Year Plan"
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .rr{min-height:100vh;background:#1a1208;
          background-image:radial-gradient(ellipse 90% 50% at 50% -5%,rgba(101,62,11,0.45) 0%,transparent 65%);
          padding:36px 20px 80px;font-family:'Source Serif 4',Georgia,serif}

        /* top bar */
        .tb{max-width:880px;margin:0 auto 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .bbtn{display:flex;align-items:center;gap:6px;background:none;border:1px solid rgba(161,98,7,0.3);
          border-radius:2px;padding:7px 14px;color:#a16207;font-family:'Teko',sans-serif;font-size:14px;
          letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;transition:all 0.2s}
        .bbtn:hover{border-color:rgba(161,98,7,0.7);background:rgba(161,98,7,0.08);color:#d97706}
        .acts{display:flex;gap:8px}
        .abtn{display:flex;align-items:center;gap:6px;background:rgba(253,246,227,0.06);
          border:1px solid rgba(161,98,7,0.28);border-radius:2px;padding:7px 14px;color:#d6b77a;
          font-family:'Teko',sans-serif;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s}
        .abtn:hover{background:rgba(253,246,227,0.12);border-color:rgba(161,98,7,0.6);color:#fde68a}
        .abtn.ok{background:rgba(21,128,61,0.18);border-color:rgba(21,128,61,0.45);color:#4ade80}

        /* doc card */
        .doc{max-width:880px;margin:0 auto;background:#fdf6e3;border-radius:3px;
          box-shadow:0 0 0 1px rgba(101,62,11,0.18),0 6px 12px rgba(0,0,0,0.4),0 30px 80px rgba(0,0,0,0.6);
          position:relative;overflow:hidden;
          opacity:0;transform:translateY(14px);transition:opacity 0.45s ease,transform 0.45s ease}
        .doc.in{opacity:1;transform:none}
        .doc::after{content:'';position:absolute;top:0;bottom:0;left:56px;width:1px;
          background:rgba(220,38,38,0.15);pointer-events:none;z-index:1}

        /* doc header */
        .dh{position:relative;z-index:2;padding:36px 48px 28px 76px;
          border-bottom:2px solid rgba(101,62,11,0.14);
          background:linear-gradient(160deg,rgba(254,243,199,0.75) 0%,transparent 70%)}
        .dey{font-family:'Teko',sans-serif;font-size:11px;letter-spacing:0.3em;
          text-transform:uppercase;color:#a16207;margin-bottom:8px;display:flex;align-items:center;gap:8px}
        .dey::before{content:'⚜';font-size:10px}
        .dtitle{font-family:'Teko',sans-serif;font-size:clamp(28px,5vw,44px);
          font-weight:600;color:#1c0f00;line-height:1;letter-spacing:-0.01em}
        .dtitle em{font-style:italic;font-weight:300;color:#78350f}
        .dpills{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
        .dpill{padding:3px 10px;border-radius:2px;border:1px solid rgba(101,62,11,0.2);
          background:rgba(255,255,255,0.5);font-family:'Teko',sans-serif;
          font-size:12px;letter-spacing:0.1em;color:#78350f}
        .co{position:absolute;width:22px;height:22px;opacity:0.18}
        .co.tr{top:10px;right:10px;border-top:2px solid #78350f;border-right:2px solid #78350f}
        .co.br{bottom:10px;right:10px;border-bottom:2px solid #78350f;border-right:2px solid #78350f}

        /* doc body */
        .db{position:relative;z-index:2;padding:36px 48px 52px 76px}

        /* term cards section */
        .tcs{padding:0 48px 48px 76px;position:relative;z-index:2;display:flex;flex-direction:column;gap:12px}
        .tcs-label{font-family:'Teko',sans-serif;font-size:11px;letter-spacing:0.25em;
          text-transform:uppercase;color:#a16207;margin-bottom:4px;
          display:flex;align-items:center;gap:8px}
        .tcs-label::after{content:'';flex:1;height:1px;background:rgba(161,98,7,0.2)}

        /* individual term card */
        .tcard{border:1px solid rgba(101,62,11,0.2);border-radius:3px;overflow:hidden;
          background:rgba(255,255,255,0.35);transition:border-color 0.2s,box-shadow 0.2s}
        .tcard:hover{border-color:rgba(101,62,11,0.4)}
        .tcard-open{border-color:rgba(146,64,14,0.45);box-shadow:0 2px 12px rgba(101,62,11,0.15)}

        .tcard-head{display:flex;align-items:center;justify-content:space-between;gap:16px;
          padding:16px 20px;cursor:pointer;user-select:none}
        .tcard-left{flex:1}
        .tcard-num{font-family:'Teko',sans-serif;font-size:18px;font-weight:600;
          letter-spacing:0.08em;color:#1c0f00;display:block;margin-bottom:3px}
        .tcard-preview{font-size:12.5px;color:#78350f;font-style:italic;
          line-height:1.5;max-width:480px}
        .tcard-right{flex-shrink:0;display:flex;align-items:center;gap:10px}
        .tcard-cta{font-family:'Teko',sans-serif;font-size:14px;letter-spacing:0.1em;
          text-transform:uppercase;color:#92400e;white-space:nowrap}
        .tcard-status{font-family:'Teko',sans-serif;font-size:13px;letter-spacing:0.08em;
          text-transform:uppercase;color:#a16207}
        .tcard-status.err{color:#dc2626}
        .tcard-spinner-wrap{display:flex;align-items:center;gap:8px}
        .tcard-spinner{width:18px;height:18px;border:2px solid rgba(146,64,14,0.2);
          border-top-color:#92400e;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0}
        .tcard-spinner.large{width:28px;height:28px}

        .tcard-body{padding:24px 28px 32px;border-top:1px dashed rgba(101,62,11,0.2);
          background:rgba(255,255,255,0.55)}
        .tcard-loading{padding:40px;display:flex;flex-direction:column;align-items:center;gap:14px;
          border-top:1px dashed rgba(101,62,11,0.2);color:#92400e;font-style:italic;font-size:14px}

        @keyframes spin{to{transform:rotate(360deg)}}

        /* content blocks */
        .rh1{font-family:'Teko',sans-serif;font-size:clamp(22px,3.5vw,32px);font-weight:600;
          color:#1c0f00;margin:24px 0 8px;padding-bottom:6px;border-bottom:2px solid rgba(101,62,11,0.18)}
        .rh1:first-child{margin-top:0}
        .rh2{font-family:'Teko',sans-serif;font-size:clamp(17px,2.8vw,24px);font-weight:500;
          color:#1c0f00;margin:20px 0 5px;display:flex;align-items:center;gap:8px}
        .rh2a{color:#92400e;font-size:10px;flex-shrink:0}
        .rh3{font-family:'Teko',sans-serif;font-size:15px;font-weight:500;letter-spacing:0.12em;
          text-transform:uppercase;color:#92400e;margin:16px 0 4px}
        .rh4{font-size:12px;font-weight:600;color:#44260a;letter-spacing:0.06em;
          text-transform:uppercase;margin:10px 0 3px}
        .rtxt{font-size:14px;line-height:1.72;color:#2d1a06;margin:3px 0}
        .rbul{display:flex;align-items:baseline;gap:10px;font-size:14px;line-height:1.65;
          color:#2d1a06;padding:2px 0}
        .rbul1{padding-left:18px}.rbul2{padding-left:36px}
        .rdot{flex-shrink:0;width:5px;height:5px;border-radius:50%;background:#a16207;margin-top:8px;opacity:0.65}
        .rbul1 .rdot{opacity:0.4;width:4px;height:4px}
        .rbul2 .rdot{opacity:0.3;width:3px;height:3px;border-radius:0}
        .rnum{display:flex;align-items:baseline;gap:10px;font-size:14px;line-height:1.65;color:#2d1a06;padding:2px 0}
        .rnb{flex-shrink:0;min-width:22px;height:22px;background:#92400e;color:white;border-radius:2px;
          font-family:'Teko',sans-serif;font-size:13px;display:flex;align-items:center;justify-content:center;margin-top:1px}
        .rmeta{display:flex;font-size:13px;padding:4px 0;border-bottom:1px dotted rgba(101,62,11,0.12)}
        .rmk{flex-shrink:0;width:170px;font-weight:600;color:#78350f;font-size:11.5px;
          letter-spacing:0.04em;text-transform:uppercase;padding-right:10px}
        .rmv{color:#2d1a06;flex:1}
        .rtw{margin:12px 0;overflow-x:auto;border:1px solid rgba(101,62,11,0.18);border-radius:3px}
        .rt{width:100%;border-collapse:collapse;font-size:13px}
        .rt thead tr{background:#1c0f00}
        .rt thead th{padding:8px 13px;text-align:left;font-family:'Teko',sans-serif;font-size:11.5px;
          letter-spacing:0.12em;text-transform:uppercase;color:#fde68a;font-weight:500;
          border-right:1px solid rgba(255,255,255,0.08)}
        .rt thead th:last-child{border-right:none}
        .rt tbody tr{border-bottom:1px solid rgba(101,62,11,0.1)}
        .rt tbody tr:last-child{border-bottom:none}
        .rt tbody tr:nth-child(even){background:rgba(101,62,11,0.04)}
        .rt tbody td{padding:7px 13px;color:#2d1a06;vertical-align:top;
          border-right:1px solid rgba(101,62,11,0.08);line-height:1.5}
        .rt tbody td:first-child{font-weight:600;color:#44260a;white-space:nowrap}
        .rt tbody td:last-child{border-right:none}
        .rrul{height:1px;background:rgba(101,62,11,0.18);margin:18px 0}
        .rblk{height:7px}

        /* loading */
        .ldg{display:flex;flex-direction:column;align-items:center;gap:16px;
          padding:64px 0;color:#92400e;font-style:italic}
        .ldg-sp{width:32px;height:32px;border:2px solid rgba(146,64,14,0.2);
          border-top-color:#92400e;border-radius:50%;animation:spin 0.8s linear infinite}

        /* footer */
        .df{position:relative;z-index:2;padding:14px 48px 18px 76px;
          border-top:1px dashed rgba(101,62,11,0.2);display:flex;justify-content:space-between}
        .dft{font-family:'Teko',sans-serif;font-size:11px;letter-spacing:0.2em;
          text-transform:uppercase;color:#b59060;opacity:0.55}

        @media print{
          .rr{background:white!important;padding:0!important}
          .tb,.tcard-head{display:none!important}
          .doc{box-shadow:none!important;opacity:1!important;transform:none!important}
          .doc::after,.df{display:none!important}
          .tcard{border:1px solid #ddd!important}
          .tcard-body{display:block!important}
          .rt thead tr{background:#333!important;-webkit-print-color-adjust:exact}
        }
        @media(max-width:540px){
          .dh,.db,.tcs,.df{padding-left:28px;padding-right:24px}
          .doc::after{left:20px}
          .rmk{width:120px}
          .abtn span{display:none}
        }
      `}</style>

      <div className="rr">
        {/* Top bar */}
        <div className="tb">
          <button className="bbtn" type="button" onClick={() => { window.location.href = "/"; }}>← New Program</button>
          <div className="acts">
            <button className={`abtn ${copied?"ok":""}`} type="button" onClick={handleCopy}>
              {copied?"✓ ":"⎘ "}<span>{copied?"Copied":"Copy"}</span>
            </button>
            <button className="abtn" type="button" onClick={() => window.print()}>⎙ <span>Print</span></button>
          </div>
        </div>

        {/* Document */}
        <div className={`doc ${loaded?"in":""}`}>
          <div className="co tr"/><div className="co br"/>

          {/* Header */}
          <div className="dh">
            <div className="dey">Generated Program</div>
            <h1 className="dtitle">Scout <em>{modeLabel[planMode] ?? "Program"}</em></h1>
            <div className="dpills">
              <span className="dpill">⚜ Scouts Australia</span>
              <span className="dpill">📅 {new Date().toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}</span>
              <span className="dpill">📋 {modeLabel[planMode]}</span>
            </div>
          </div>

          {/* Body — overview or full plan */}
          <div className="db">
            {!program ? (
              <div className="ldg"><div className="ldg-sp"/><span>Generating your program…</span></div>
            ) : (
              <Blocks blocks={overviewBlocks}/>
            )}
          </div>

          {/* Term expansion cards (year/multiyear only) */}
          {isLongPlan && program && (
            <div className="tcs">
              <div className="tcs-label">Term Plans — tap to generate</div>
              {Array.from({ length: numTerms }, (_, idx) => (
                <TermCard
                  key={idx + 1}
                  termNumber={idx + 1}
                  termSummary={termSummaries[idx] ?? ""}
                  yearOverview={program}
                  context={context}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="df">
            <span className="dft">Scouts Australia · Program Builder</span>
            <span className="dft">Leaders Only</span>
          </div>
        </div>
      </div>
    </>
  );
}

