"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SECTION_COLOURS, NAVY, type Section } from "@/lib/colours";
import type { GroupConfig, TermRow, ActivityRow } from "@/lib/types";

function genId() { return Math.random().toString(36).slice(2,9); }

export default function RunSheetPage() {
  const router = useRouter();
  const [config, setConfig] = useState<GroupConfig | null>(null);
  const [source, setSource] = useState<{row: TermRow; config: GroupConfig} | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ActivityRow>>({});

  useEffect(() => {
    const cfg = localStorage.getItem('scoutGroupConfig');
    if (cfg) setConfig(JSON.parse(cfg));
    const src = localStorage.getItem('runSheetSource');
    if (src) {
      const parsed = JSON.parse(src);
      setSource(parsed);
      setConfig(parsed.config);
    }
  }, []);

  const acc = config ? SECTION_COLOURS[config.section as Section].accent : '#C17F24';

  const generate = async () => {
    if (!source) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-runsheet', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ row: source.row, config: source.config }),
      });
      const data = await res.json();
      if (data.activities) {
        setActivities(data.activities);
        setGenerated(true);
      }
    } finally { setGenerating(false); }
  };

  const startEdit = (a: ActivityRow) => { setEditingId(a.id); setEditDraft({...a}); };
  const saveEdit = () => {
    setActivities(acts => acts.map(a => a.id===editingId ? {...a,...editDraft} as ActivityRow : a));
    setEditingId(null);
  };
  const deleteActivity = (id: string) => {
    if (confirm('Remove this activity?')) setActivities(acts => acts.filter(a => a.id!==id));
  };
  const addActivity = () => {
    const newA: ActivityRow = { id: genId(), time: '', name: 'New activity', detail: '' };
    setActivities(acts => [...acts, newA]);
    setEditingId(newA.id);
    setEditDraft({...newA});
  };

  const row = source?.row;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',system-ui,sans-serif;background:#f4f5f7;}
        :root{--acc:${acc};}
        .nav{background:${NAVY};padding:0 24px;height:52px;display:flex;align-items:center;justify-content:space-between;}
        .nav-l{display:flex;align-items:center;gap:10px;}
        .nav-dot{width:28px;height:28px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;}
        .nav-title{color:#fff;font-size:15px;font-weight:500;}
        .back-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);padding:5px 11px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;}
        .nav-r{display:flex;gap:6px;}
        .nav-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);padding:5px 11px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;}
        .body{max-width:780px;margin:0 auto;padding:20px 24px 60px;}
        .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
        .tlabel{font-size:13px;font-weight:500;color:#6b7280;}
        .tbtns{display:flex;gap:6px;}
        .tbtn{font-size:12px;padding:5px 11px;border-radius:6px;border:1px solid #d1d5db;background:#fff;color:#374151;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;}
        .tbtn.pri{background:var(--acc);border-color:var(--acc);color:#fff;}

        /* Generate prompt */
        .gen-card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;padding:24px;text-align:center;margin-bottom:16px;}
        .gen-title{font-size:16px;font-weight:500;color:#111;margin-bottom:6px;}
        .gen-desc{font-size:13px;color:#6b7280;margin-bottom:20px;line-height:1.6;}
        .gen-topic{font-size:15px;font-weight:500;color:var(--acc);margin-bottom:16px;}
        .gen-btn{padding:12px 28px;border-radius:8px;border:none;background:var(--acc);color:#fff;font-size:15px;font-weight:500;cursor:pointer;font-family:inherit;}
        .spinning{display:inline-block;animation:spin 1s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}

        /* Run sheet card */
        .rs-card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;}
        .rs-head{background:${NAVY};padding:14px 18px;}
        .rs-title{color:#fff;font-size:18px;font-weight:600;margin-bottom:2px;}
        .rs-sub{color:rgba(255,255,255,0.5);font-size:12px;}
        .rs-pills{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px;}
        .pill{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.75);font-size:11px;padding:2px 8px;border-radius:4px;}
        .pill.acc{background:var(--acc);color:#fff;}
        .sbar{background:var(--acc);color:#fff;font-size:10px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;padding:5px 16px;}

        /* Activity rows */
        .activity{border-bottom:1px solid #f3f4f6;}
        .activity:last-child{border-bottom:none;}
        .activity.editing{border-left:3px solid var(--acc);}
        .act-view{display:grid;grid-template-columns:62px 1fr auto;align-items:start;}
        .av-time{padding:11px 10px;font-size:13px;font-weight:500;color:var(--acc);white-space:nowrap;}
        .av-body{padding:11px 8px 11px 0;}
        .av-name{font-size:13px;font-weight:500;color:#111;margin-bottom:4px;}
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

        /* Edit form */
        .act-edit{padding:10px 14px 14px;background:rgba(193,127,36,0.03);border-top:1px dashed rgba(193,127,36,0.2);display:none;}
        .activity.editing .act-edit{display:block;}
        .ef-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}
        .ef-label{font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-bottom:3px;}
        .ef-input{width:100%;border:1px solid #d1d5db;border-radius:5px;padding:6px 8px;font-size:12.5px;color:#111;font-family:inherit;outline:none;}
        .ef-input:focus{border-color:var(--acc);}
        .ef-textarea{width:100%;border:1px solid #d1d5db;border-radius:5px;padding:7px 9px;font-size:12.5px;color:#111;font-family:inherit;outline:none;resize:vertical;min-height:90px;line-height:1.6;}
        .ef-textarea:focus{border-color:var(--acc);}
        .ef-actions{display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap;}
        .save-btn{font-size:12px;padding:5px 14px;border-radius:5px;background:var(--acc);border:none;color:#fff;cursor:pointer;font-family:inherit;font-weight:500;}
        .cancel-btn{font-size:12px;padding:5px 12px;border-radius:5px;border:1px solid #d1d5db;background:#fff;color:#6b7280;cursor:pointer;font-family:inherit;}
        .recipe-opts{display:flex;gap:5px;margin-left:auto;flex-wrap:wrap;}
        .ro-btn{font-size:11px;padding:4px 8px;border-radius:4px;border:1px solid #d1d5db;background:#fff;color:#6b7280;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:3px;}
        .ro-btn:hover{border-color:var(--acc);color:var(--acc);}
        .ro-btn.pri{background:rgba(193,127,36,0.1);border-color:rgba(193,127,36,0.3);color:var(--acc);}

        .add-row{padding:10px 16px;border-top:1px solid #f3f4f6;display:flex;gap:8px;background:#f9fafb;}
        .add-btn{font-size:12px;padding:5px 10px;border-radius:5px;border:1px dashed #d1d5db;background:transparent;color:#6b7280;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;}
        .add-btn:hover{border-color:var(--acc);color:var(--acc);}
      `}</style>

      <nav className="nav">
        <div className="nav-l">
          <div className="nav-dot">⚜</div>
          <span className="nav-title">Scout Program Builder</span>
        </div>
        <div className="nav-r">
          <button className="back-btn" onClick={()=>router.push('/term')}>← Term plan</button>
          <button className="nav-btn">🖨 Print</button>
          <button className="nav-btn" style={{background:acc,borderColor:acc,color:'#fff'}}>⬇ PDF</button>
        </div>
      </nav>

      <div className="body">
        <div className="toolbar">
          <div className="tlabel">
            {row?.topic || 'Run sheet'} · {row?.date}
          </div>
        </div>

        {!generated && !generating && row && (
          <div className="gen-card">
            <div className="gen-title">Generate run sheet</div>
            <div className="gen-topic">{row.topic}</div>
            <div className="gen-desc">
              AI will generate a complete run sheet with timed activities, safety notes,
              equipment lists, opening and closing parades, and optional games.
              {row.oasFocus && ` OAS focus: ${row.oasFocus}.`}
            </div>
            <button className="gen-btn" onClick={generate}>
              Generate run sheet →
            </button>
          </div>
        )}

        {generating && (
          <div className="gen-card">
            <div style={{fontSize:'32px',marginBottom:'12px'}} className="spinning">⏳</div>
            <div className="gen-title">Building your run sheet…</div>
            <div className="gen-desc">Generating activities, safety notes, and equipment lists</div>
          </div>
        )}

        {generated && activities.length > 0 && (
          <div className="rs-card">
            <div className="rs-head">
              <div className="rs-title">{row?.topic}</div>
              <div className="rs-sub">{config?.groupName} · {config?.section} · {row?.date}</div>
              <div className="rs-pills">
                <span className="pill">⏰ {row?.time}</span>
                <span className="pill">📍 {row?.location}</span>
                <span className="pill">👤 {row?.leader}</span>
                {row?.oasFocus && <span className="pill acc">⚜ {row.oasFocus}</span>}
              </div>
            </div>

            <div className="sbar">Run sheet</div>

            {activities.map(act => (
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
                    <button className="edit-btn" onClick={()=> editingId===act.id ? setEditingId(null) : startEdit(act)}>
                      ✏ Edit
                    </button>
                    <button className="del-btn" onClick={()=>deleteActivity(act.id)}>🗑</button>
                  </div>
                </div>

                <div className="act-edit">
                  <div className="ef-grid">
                    <div><div className="ef-label">Time</div><input className="ef-input" value={editDraft.time||''} onChange={e=>setEditDraft(d=>({...d,time:e.target.value}))}/></div>
                    <div><div className="ef-label">Activity name</div><input className="ef-input" value={editDraft.name||''} onChange={e=>setEditDraft(d=>({...d,name:e.target.value}))}/></div>
                  </div>
                  <div style={{marginBottom:'8px'}}>
                    <div className="ef-label">Detail — instructions, notes, sub-steps</div>
                    <textarea className="ef-textarea" value={editDraft.detail||''} onChange={e=>setEditDraft(d=>({...d,detail:e.target.value}))}/>
                  </div>
                  <div className="ef-actions">
                    <button className="save-btn" onClick={saveEdit}>Save</button>
                    <button className="cancel-btn" onClick={()=>setEditingId(null)}>Cancel</button>
                    {act.hasRecipe && (
                      <div className="recipe-opts">
                        <button className="ro-btn pri">📄 Built-in recipe</button>
                        <button className="ro-btn" onClick={()=>window.open(`https://www.google.com/search?q=${encodeURIComponent(act.name+' recipe camp cooking kids')}`)}>🔍 Search Google</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="add-row">
              <button className="add-btn" onClick={addActivity}>+ Add activity</button>
              <button className="add-btn" onClick={()=>{
                const g: ActivityRow = {id:genId(),time:'',name:'Optional game',detail:'',optional:true};
                setActivities(a=>[...a,g]); setEditingId(g.id); setEditDraft({...g});
              }}>+ Add optional game</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
