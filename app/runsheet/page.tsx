"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SECTION_COLOURS: Record<string,{accent:string;pale:string;text:string}> = {
  Joeys:     { accent:'#C17F24', pale:'rgba(193,127,36,0.07)', text:'#fff' },
  Cubs:      { accent:'#E8B800', pale:'rgba(232,184,0,0.08)',  text:'#3d2800' },
  Scouts:    { accent:'#6BBF5A', pale:'rgba(107,191,90,0.08)', text:'#fff' },
  Venturers: { accent:'#B5485E', pale:'rgba(181,72,94,0.07)',  text:'#fff' },
};
const NAVY = '#2C3E6B';

const CHALLENGE_ICONS: Record<string,string> = {
  Community: '🤝', Outdoor: '🌿', Creative: '🎨', Personal: '⭐',
};

interface GroupConfig { groupName:string; section:string; meetingDay:string; meetingTime:string; leaders:string[]; members:string[]; }
interface TermRow { id:string; date:string; time:string; topic:string; location:string; oasFocus:string; bring:string; leader:string; assistantPatrol:string; consentRequired:boolean; rowType:'session'|'extra'; }
interface ActivityRow { id:string; time:string; name:string; detail:string; optional?:boolean; oasTag?:string|null; hasRecipe?:boolean; }
interface RunSheetData {
  tagline?: string;
  challengeAreas?: string[];
  plan?: string[];
  activities: ActivityRow[];
  review?: string[];
  participate?: string[];
  assist?: string[];
  lead?: string[];
  itemsRequired?: string[];
}

function genId(){ return Math.random().toString(36).slice(2,9); }

export default function RunSheetPage() {
  const router = useRouter();
  const [config, setConfig] = useState<GroupConfig|null>(null);
  const [source, setSource] = useState<{row:TermRow; config:GroupConfig}|null>(null);
  const [data, setData] = useState<RunSheetData|null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [genError, setGenError] = useState('');
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ActivityRow>>({});

  // Quick-create form
  const [quickTopic, setQuickTopic] = useState('');
  const [quickDate, setQuickDate] = useState('');
  const [quickTime, setQuickTime] = useState('6:00pm');
  const [quickLocation, setQuickLocation] = useState('Hall');
  const [quickOas, setQuickOas] = useState('');

  useEffect(()=>{
    const cfg = localStorage.getItem('scoutGroupConfig');
    if(cfg) setConfig(JSON.parse(cfg));
    const src = localStorage.getItem('runSheetSource');
    if(src){
      const parsed = JSON.parse(src);
      setSource(parsed);
      setConfig(parsed.config);
    }
  },[]);

  const sc = config ? SECTION_COLOURS[config.section]||SECTION_COLOURS.Joeys : SECTION_COLOURS.Joeys;
  const acc = sc.accent;

  const generate = async (rowOverride?: TermRow) => {
    const activeRow = rowOverride || source?.row;
    const activeConfig = source?.config || config;
    if(!activeRow || !activeConfig) return;
    setGenerating(true); setGenError('');
    try {
      const res = await fetch('/api/generate-runsheet',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ row: activeRow, config: activeConfig }),
      });
      if(!res.ok){ const text=await res.text(); throw new Error(`API error ${res.status}: ${text.slice(0,200)}`); }
      const json = await res.json();
      if(json.error) throw new Error(json.error);
      if(!json.activities || !Array.isArray(json.activities)) throw new Error('No activities returned from AI');
      setSource({row: activeRow, config: activeConfig});
      setData(json);
      setGenerated(true);
    } catch(err:any){
      setGenError(err.message || 'Something went wrong generating the run sheet. Please try again.');
    } finally { setGenerating(false); }
  };

  const generateQuick = () => {
    if(!config) return;
    const quickRow: TermRow = {
      id: genId(), date: quickDate || new Date().toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'}),
      time: quickTime, topic: quickTopic||'Scout meeting', location: quickLocation,
      oasFocus: quickOas, bring:'', leader: config.leaders[0]||'', assistantPatrol:'',
      consentRequired:false, rowType:'session',
    };
    generate(quickRow);
  };

  const startEdit = (a: ActivityRow) => { setEditingId(a.id); setEditDraft({...a}); };
  const saveEdit = () => {
    if(!data) return;
    setData(d => d ? {...d, activities: d.activities.map(a=>a.id===editingId?{...a,...editDraft} as ActivityRow:a)} : d);
    setEditingId(null);
  };
  const deleteActivity = (id:string) => {
    if(!data) return;
    if(confirm('Remove this activity?')) setData(d=>d?{...d,activities:d.activities.filter(a=>a.id!==id)}:d);
  };
  const addActivity = (optional=false) => {
    if(!data) return;
    const newA: ActivityRow = {id:genId(), time:'', name: optional?'Optional game':'New activity', detail:'', optional};
    setData(d=>d?{...d,activities:[...d.activities,newA]}:d);
    setEditingId(newA.id); setEditDraft({...newA});
  };

  const row = source?.row;
  const groupConfig = source?.config || config;

  const downloadRunSheet = () => {
    if (!data || !row) return;
    const payload = {
      type: 'scout-program-builder-run-sheet',
      version: 1,
      savedAt: new Date().toISOString(),
      row,
      config: groupConfig,
      data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (row.topic || 'run-sheet').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    a.href = url;
    a.download = `${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Editable list sections (plan, review, participate, assist, lead, itemsRequired)
  const updateListItem = (key: keyof RunSheetData, idx: number, value: string) => {
    if(!data) return;
    setData(d=>{
      if(!d) return d;
      const list = [...(d[key] as string[] || [])];
      list[idx] = value;
      return {...d, [key]: list};
    });
  };
  const addListItem = (key: keyof RunSheetData) => {
    if(!data) return;
    setData(d=>d?{...d,[key]:[...(d[key] as string[]||[]),'']}:d);
  };
  const removeListItem = (key: keyof RunSheetData, idx: number) => {
    if(!data) return;
    setData(d=>{
      if(!d) return d;
      const list = [...(d[key] as string[]||[])];
      list.splice(idx,1);
      return {...d, [key]: list};
    });
  };

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
        :root{--acc:${acc};}
        .nav{background:${NAVY};height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
        .nav-l{display:flex;align-items:center;gap:10px;}
        .nav-dot{width:28px;height:28px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;}
        .nav-title{color:#fff;font-size:15px;font-weight:500;}
        .back-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);padding:5px 11px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;}
        .nav-r{display:flex;gap:6px;}
        .nav-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);padding:5px 11px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;}
        .ph{background:#fff;border-bottom:1px solid #e5e7eb;padding:18px 24px;}
        .bc{font-size:11px;color:#9ca3af;margin-bottom:6px;}
        .ph-title{color:#111827;font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:2px;}
        .ph-sub{color:#6b7280;font-size:12px;}
        .body{max-width:820px;margin:0 auto;padding:20px 24px 60px;}

        /* Generate prompt */
        .gen-card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;padding:24px;text-align:center;margin-bottom:16px;}
        .gen-title{font-size:16px;font-weight:600;color:#111;margin-bottom:6px;}
        .gen-desc{font-size:13px;color:#6b7280;margin-bottom:20px;line-height:1.6;}
        .gen-topic{font-size:15px;font-weight:600;color:var(--acc);margin-bottom:16px;}
        .gen-btn{padding:12px 28px;border-radius:8px;border:none;background:var(--acc);color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;}
        .gen-btn:disabled{opacity:0.6;cursor:not-allowed;}
        .gen-error{background:#fef2f2;border:1px solid #fca5a5;color:#b91c1c;font-size:12px;padding:8px 12px;border-radius:6px;margin-top:14px;text-align:left;}
        .spinning{display:inline-block;animation:spin 1s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .qf-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;text-align:left;}
        .qf-field{display:flex;flex-direction:column;gap:4px;}
        .qf-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;}
        .qf-field input{border:1px solid #d1d5db;border-radius:6px;padding:7px 10px;font-size:13px;color:#111;font-family:inherit;outline:none;}
        .qf-field input:focus{border-color:var(--acc);}

        /* Sheet card */
        .sheet-card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;}
        .sheet-head{background:${NAVY};padding:16px 18px;}
        .sheet-title{color:#fff;font-size:19px;font-weight:700;letter-spacing:-0.01em;margin-bottom:3px;}
        .sheet-tagline{color:rgba(255,255,255,0.65);font-size:13px;font-style:italic;margin-bottom:9px;}
        .sheet-meta{color:rgba(255,255,255,0.5);font-size:12px;margin-bottom:9px;}
        .sheet-pills{display:flex;gap:5px;flex-wrap:wrap;}
        .pill{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.75);font-size:11px;padding:2px 8px;border-radius:4px;}
        .pill.acc{background:var(--acc);color:#fff;}

        .sbar{background:var(--acc);color:#fff;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:6px 18px;}

        /* Challenge areas */
        .ca-row{display:flex;gap:10px;padding:14px 18px;border-bottom:1px solid #f3f4f6;flex-wrap:wrap;}
        .ca-chip{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:16px;border:1.5px solid #e5e7eb;font-size:12px;font-weight:500;color:#9ca3af;}
        .ca-chip.on{border-color:var(--acc);background:rgba(193,127,36,0.07);color:#111827;}
        .ca-icon{font-size:15px;}

        /* List sections (plan, review, etc) */
        .list-section{padding:12px 18px;border-bottom:1px solid #f3f4f6;}
        .list-item{display:flex;align-items:flex-start;gap:8px;padding:4px 0;}
        .list-checkbox{width:14px;height:14px;border:1.5px solid #d1d5db;border-radius:3px;flex-shrink:0;margin-top:3px;}
        .list-text{flex:1;font-size:13px;color:#374151;line-height:1.6;}
        .list-text-input{flex:1;font-size:13px;color:#374151;line-height:1.6;border:1px solid transparent;border-radius:4px;padding:2px 4px;font-family:inherit;background:transparent;outline:none;}
        .list-text-input:focus{border-color:var(--acc);background:#fff;}
        .list-del{background:none;border:none;color:#d1d5db;cursor:pointer;font-size:12px;padding:2px;flex-shrink:0;}
        .list-del:hover{color:#ef4444;}
        .list-add{font-size:11px;color:var(--acc);background:none;border:none;cursor:pointer;font-family:inherit;font-weight:500;margin-top:4px;padding-left:22px;}

        /* PAL grid */
        .pal-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;}
        .pal-col{padding:12px 14px;border-right:1px solid #f3f4f6;}
        .pal-col:last-child{border-right:none;}
        .pal-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;padding:3px 8px;border-radius:4px;display:inline-block;}
        .pal-label.p{background:#e8f4e8;color:#2a6e2a;}
        .pal-label.a{background:#e8eef8;color:${NAVY};}
        .pal-label.l{background:#fef3e0;color:#92600a;}
        .pal-item{font-size:12px;color:#6b7280;line-height:1.6;padding:3px 0;}

        /* Activity rows */
        .activity{border-bottom:1px solid #f3f4f6;}
        .activity:last-child{border-bottom:none;}
        .activity.editing{border-left:3px solid var(--acc);}
        .act-view{display:grid;grid-template-columns:64px 1fr auto;align-items:start;}
        .av-time{padding:11px 10px;font-size:13px;font-weight:600;color:var(--acc);white-space:nowrap;}
        .av-body{padding:11px 8px 11px 0;}
        .av-name{font-size:13px;font-weight:700;color:#111;margin-bottom:4px;letter-spacing:0.02em;}
        .av-detail{font-size:12.5px;color:#4b5563;line-height:1.65;white-space:pre-wrap;}
        .av-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;}
        .atag{font-size:10px;padding:1px 6px;border-radius:3px;border:1px solid;}
        .atag.oas{background:#eef1f9;color:${NAVY};border-color:#c5cedf;}
        .atag.opt{background:#f5f5f3;color:#6b7280;border-color:#e5e7eb;}
        .atag.recipe{background:rgba(193,127,36,0.08);color:var(--acc);border-color:rgba(193,127,36,0.25);cursor:pointer;}
        .av-actions{padding:9px 10px 9px 0;display:flex;flex-direction:column;gap:4px;align-items:stretch;}
        .edit-btn{font-size:10px;padding:3px 8px;border-radius:4px;border:1px solid #d1d5db;background:#fff;color:#6b7280;cursor:pointer;font-family:inherit;white-space:nowrap;}
        .edit-btn:hover{border-color:var(--acc);color:var(--acc);}
        .del-btn{font-size:10px;padding:2px 5px;border-radius:4px;border:1px solid transparent;background:transparent;color:#d1d5db;cursor:pointer;font-family:inherit;text-align:center;}
        .del-btn:hover{color:#ef4444;border-color:#fca5a5;background:#fef2f2;}

        .act-edit{padding:10px 14px 14px;background:rgba(193,127,36,0.03);border-top:1px dashed rgba(193,127,36,0.2);display:none;}
        .activity.editing .act-edit{display:block;}
        .ef-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}
        .ef-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-bottom:3px;}
        .ef-input{width:100%;border:1px solid #d1d5db;border-radius:5px;padding:6px 8px;font-size:12.5px;color:#111;font-family:inherit;outline:none;}
        .ef-input:focus{border-color:var(--acc);}
        .ef-textarea{width:100%;border:1px solid #d1d5db;border-radius:5px;padding:7px 9px;font-size:12.5px;color:#111;font-family:inherit;outline:none;resize:vertical;min-height:90px;line-height:1.6;}
        .ef-textarea:focus{border-color:var(--acc);}
        .ef-actions{display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap;}
        .save-btn{font-size:12px;padding:5px 14px;border-radius:5px;background:var(--acc);border:none;color:#fff;cursor:pointer;font-family:inherit;font-weight:600;}
        .cancel-btn{font-size:12px;padding:5px 12px;border-radius:5px;border:1px solid #d1d5db;background:#fff;color:#6b7280;cursor:pointer;font-family:inherit;}
        .recipe-opts{display:flex;gap:5px;margin-left:auto;flex-wrap:wrap;}
        .ro-btn{font-size:11px;padding:4px 8px;border-radius:4px;border:1px solid #d1d5db;background:#fff;color:#6b7280;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:3px;}
        .ro-btn:hover{border-color:var(--acc);color:var(--acc);}
        .ro-btn.pri{background:rgba(193,127,36,0.1);border-color:rgba(193,127,36,0.3);color:var(--acc);}

        .add-row{padding:10px 16px;border-top:1px solid #f3f4f6;display:flex;gap:8px;background:#f9fafb;}
        .add-btn{font-size:12px;padding:5px 10px;border-radius:5px;border:1px dashed #d1d5db;background:transparent;color:#6b7280;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;}
        .add-btn:hover{border-color:var(--acc);color:var(--acc);}

        /* Items required */
        .items-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;}

        @media (max-width:640px){
          .pal-grid{grid-template-columns:1fr;}
          .pal-col{border-right:none;border-bottom:1px solid #f3f4f6;}
          .pal-col:last-child{border-bottom:none;}
          .items-grid{grid-template-columns:1fr;}
          .qf-grid{grid-template-columns:1fr;}
        }

        @media print {
          .nav, .ph, .gen-card, .add-row, .av-actions, .edit-btn, .del-btn, .act-edit, .list-del, .list-add { display: none !important; }
          body { background: #fff; }
          .body { max-width: 100%; padding: 0; }
          .sheet-card { border: none; }
          .sheet-head { background: ${NAVY} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sbar { background: var(--acc) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .pill, .pill.acc, .atag.oas, .ca-chip.on { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .activity, .list-section, .ca-row, .pal-grid { break-inside: avoid; }
          .list-text-input { border: none !important; }
        }
      `}</style>

      <nav className="nav">
        <div className="nav-l">
          <div className="nav-dot">⚜</div>
          <span className="nav-title">Scout Program Builder</span>
        </div>
        <div className="nav-r">
          <button className="back-btn" onClick={()=>router.push('/term')}>← Term plan</button>
          <button className="nav-btn" onClick={()=>window.print()}>🖨 Print</button>
          <button className="nav-btn" style={{background:acc,borderColor:acc,color:'#fff'}} onClick={()=>window.print()}>⬇ PDF</button>
          {generated && <button className="nav-btn" onClick={downloadRunSheet}>💾 Save</button>}
        </div>
      </nav>

      <div className="ph">
        <div className="bc">Home › Term Plans › Run Sheet</div>
        <div className="ph-title">{row?.topic || 'Run sheet'}</div>
        <div className="ph-sub">{row?.date ? `${row.date}${row.time?' · '+row.time:''}` : 'Generate a session run sheet'}</div>
      </div>

      <div className="body">

        {!row && !generating && !generated && (
          <div className="gen-card">
            <div className="gen-title">Create a run sheet</div>
            <div className="gen-desc" style={{marginBottom:'16px'}}>
              No session selected from a term plan — fill in the details below and AI will generate a complete session plan.
            </div>
            <div className="qf-grid">
              <div className="qf-field"><div className="qf-label">Topic / theme</div><input value={quickTopic} onChange={e=>setQuickTopic(e.target.value)} placeholder="e.g. Camp cooking"/></div>
              <div className="qf-field"><div className="qf-label">OAS focus (optional)</div><input value={quickOas} onChange={e=>setQuickOas(e.target.value)} placeholder="e.g. Camping S1"/></div>
              <div className="qf-field"><div className="qf-label">Date</div><input type="date" value={quickDate} onChange={e=>setQuickDate(e.target.value)}/></div>
              <div className="qf-field"><div className="qf-label">Time</div><input value={quickTime} onChange={e=>setQuickTime(e.target.value)} placeholder="e.g. 6:00pm"/></div>
              <div className="qf-field" style={{gridColumn:'span 2'}}><div className="qf-label">Location</div><input value={quickLocation} onChange={e=>setQuickLocation(e.target.value)} placeholder="e.g. Hall"/></div>
            </div>
            <button className="gen-btn" onClick={generateQuick} disabled={!quickTopic}>Generate run sheet →</button>
            {genError && <div className="gen-error">⚠ {genError}</div>}
          </div>
        )}

        {!generated && !generating && row && (
          <div className="gen-card">
            <div className="gen-title">Generate run sheet</div>
            <div className="gen-topic">{row.topic}</div>
            <div className="gen-desc">
              AI will generate a complete PLAN/DO/REVIEW session plan with challenge areas, timed activities, safety notes, equipment lists, and participate/assist/lead suggestions.
              {row.oasFocus && ` OAS focus: ${row.oasFocus}.`}
            </div>
            <button className="gen-btn" onClick={()=>generate()}>Generate run sheet →</button>
            {genError && <div className="gen-error">⚠ {genError}</div>}
          </div>
        )}

        {generating && (
          <div className="gen-card">
            <div style={{fontSize:'32px',marginBottom:'12px'}} className="spinning">⏳</div>
            <div className="gen-title">Building your run sheet…</div>
            <div className="gen-desc">Generating activities, safety notes, and equipment lists</div>
          </div>
        )}

        {generated && data && (
          <div className="sheet-card">
            <div className="sheet-head">
              <div className="sheet-title">{row?.topic}</div>
              {data.tagline && <div className="sheet-tagline">{data.tagline}</div>}
              <div className="sheet-meta">{groupConfig?.groupName} · {groupConfig?.section} · {row?.date}</div>
              <div className="sheet-pills">
                {row?.time && <span className="pill">⏰ {row.time}</span>}
                {row?.location && <span className="pill">📍 {row.location}</span>}
                {row?.leader && <span className="pill">👤 {row.leader}</span>}
                {row?.assistantPatrol && <span className="pill">🎖 Asst: {row.assistantPatrol}</span>}
                {row?.oasFocus && <span className="pill acc">⚜ {row.oasFocus}</span>}
              </div>
            </div>

            {/* Challenge Areas */}
            {data.challengeAreas && (
              <div className="ca-row">
                {['Community','Outdoor','Creative','Personal'].map(area=>(
                  <div key={area} className={`ca-chip ${data.challengeAreas!.includes(area)?'on':''}`}>
                    <span className="ca-icon">{CHALLENGE_ICONS[area]}</span> {area}
                  </div>
                ))}
              </div>
            )}

            {/* PLAN */}
            {data.plan && (
              <>
                <div className="sbar">Plan</div>
                <div className="list-section">
                  {data.plan.map((item,i)=>(
                    <div key={i} className="list-item">
                      <div className="list-checkbox"/>
                      <input className="list-text-input" value={item} onChange={e=>updateListItem('plan',i,e.target.value)}/>
                      <button className="list-del" onClick={()=>removeListItem('plan',i)}>✕</button>
                    </div>
                  ))}
                  <button className="list-add" onClick={()=>addListItem('plan')}>+ Add item</button>
                </div>
              </>
            )}

            {/* DO — activities */}
            <div className="sbar">Do — Run Sheet</div>
            {data.activities.map(act=>(
              <div key={act.id} className={`activity ${editingId===act.id?'editing':''}`}>
                <div className="act-view">
                  <div className="av-time">{act.time}</div>
                  <div className="av-body">
                    <div className="av-name">{act.name}</div>
                    {act.detail && <div className="av-detail">{act.detail}</div>}
                    <div className="av-tags">
                      {act.optional && <span className="atag opt">optional</span>}
                      {act.oasTag && <span className="atag oas">⚜ {act.oasTag}</span>}
                      {act.hasRecipe && <span className="atag recipe">📄 Recipe</span>}
                    </div>
                  </div>
                  <div className="av-actions">
                    <button className="edit-btn" onClick={()=>editingId===act.id?setEditingId(null):startEdit(act)}>✏ Edit</button>
                    <button className="del-btn" onClick={()=>deleteActivity(act.id)}>🗑</button>
                  </div>
                </div>
                <div className="act-edit">
                  <div className="ef-grid">
                    <div><div className="ef-label">Time</div><input className="ef-input" value={editDraft.time||''} onChange={e=>setEditDraft(d=>({...d,time:e.target.value}))}/></div>
                    <div><div className="ef-label">Activity name</div><input className="ef-input" value={editDraft.name||''} onChange={e=>setEditDraft(d=>({...d,name:e.target.value}))}/></div>
                  </div>
                  <div style={{marginBottom:'8px'}}>
                    <div className="ef-label">Detail — instructions, equipment, sub-steps</div>
                    <textarea className="ef-textarea" value={editDraft.detail||''} onChange={e=>setEditDraft(d=>({...d,detail:e.target.value}))}/>
                  </div>
                  <div className="ef-actions">
                    <button className="save-btn" onClick={saveEdit}>Save</button>
                    <button className="cancel-btn" onClick={()=>setEditingId(null)}>Cancel</button>
                    {act.hasRecipe && (
                      <div className="recipe-opts">
                        <button className="ro-btn pri">📄 Built-in recipe</button>
                        <button className="ro-btn" onClick={()=>window.open(`https://www.google.com/search?q=${encodeURIComponent(act.name+' recipe scouts kids')}`)}>🔍 Search Google</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="add-row">
              <button className="add-btn" onClick={()=>addActivity(false)}>+ Add activity</button>
              <button className="add-btn" onClick={()=>addActivity(true)}>+ Add optional game</button>
            </div>

            {/* REVIEW */}
            {data.review && (
              <>
                <div className="sbar">Review</div>
                <div className="list-section">
                  {data.review.map((item,i)=>(
                    <div key={i} className="list-item">
                      <div className="list-checkbox"/>
                      <input className="list-text-input" value={item} onChange={e=>updateListItem('review',i,e.target.value)}/>
                      <button className="list-del" onClick={()=>removeListItem('review',i)}>✕</button>
                    </div>
                  ))}
                  <button className="list-add" onClick={()=>addListItem('review')}>+ Add item</button>
                </div>
              </>
            )}

            {/* PARTICIPATE / ASSIST / LEAD */}
            {(data.participate || data.assist || data.lead) && (
              <>
                <div className="sbar">Participate · Assist · Lead</div>
                <div className="pal-grid">
                  <div className="pal-col">
                    <div className="pal-label p">Participate</div>
                    {(data.participate||[]).map((item,i)=>(
                      <div key={i} className="list-item">
                        <input className="list-text-input pal-item" value={item} onChange={e=>updateListItem('participate',i,e.target.value)}/>
                        <button className="list-del" onClick={()=>removeListItem('participate',i)}>✕</button>
                      </div>
                    ))}
                    <button className="list-add" style={{paddingLeft:0}} onClick={()=>addListItem('participate')}>+ Add</button>
                  </div>
                  <div className="pal-col">
                    <div className="pal-label a">Assist</div>
                    {(data.assist||[]).map((item,i)=>(
                      <div key={i} className="list-item">
                        <input className="list-text-input pal-item" value={item} onChange={e=>updateListItem('assist',i,e.target.value)}/>
                        <button className="list-del" onClick={()=>removeListItem('assist',i)}>✕</button>
                      </div>
                    ))}
                    <button className="list-add" style={{paddingLeft:0}} onClick={()=>addListItem('assist')}>+ Add</button>
                  </div>
                  <div className="pal-col">
                    <div className="pal-label l">Lead</div>
                    {(data.lead||[]).map((item,i)=>(
                      <div key={i} className="list-item">
                        <input className="list-text-input pal-item" value={item} onChange={e=>updateListItem('lead',i,e.target.value)}/>
                        <button className="list-del" onClick={()=>removeListItem('lead',i)}>✕</button>
                      </div>
                    ))}
                    <button className="list-add" style={{paddingLeft:0}} onClick={()=>addListItem('lead')}>+ Add</button>
                  </div>
                </div>
              </>
            )}

            {/* ITEMS REQUIRED */}
            {data.itemsRequired && (
              <>
                <div className="sbar">Items Required</div>
                <div className="list-section">
                  <div className="items-grid">
                    {data.itemsRequired.map((item,i)=>(
                      <div key={i} className="list-item">
                        <div className="list-checkbox"/>
                        <input className="list-text-input" value={item} onChange={e=>updateListItem('itemsRequired',i,e.target.value)}/>
                        <button className="list-del" onClick={()=>removeListItem('itemsRequired',i)}>✕</button>
                      </div>
                    ))}
                  </div>
                  <button className="list-add" onClick={()=>addListItem('itemsRequired')}>+ Add item</button>
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </>
  );
}
