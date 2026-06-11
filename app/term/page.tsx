"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const SECTION_COLOURS: Record<string,{accent:string;pale:string;text:string}> = {
  Joeys:     { accent:'#C17F24', pale:'rgba(193,127,36,0.07)', text:'#fff' },
  Cubs:      { accent:'#E8B800', pale:'rgba(232,184,0,0.08)',  text:'#3d2800' },
  Scouts:    { accent:'#6BBF5A', pale:'rgba(107,191,90,0.08)', text:'#fff' },
  Venturers: { accent:'#B5485E', pale:'rgba(181,72,94,0.07)',  text:'#fff' },
};

interface GroupConfig { groupName:string; section:string; meetingDay:string; meetingTime:string; leaders:string[]; members:string[]; }
interface TermRow { id:string; date:string; time:string; topic:string; location:string; oasFocus:string; bring:string; leader:string; assistantPatrol:string; consentRequired:boolean; rowType:'session'|'extra'; }

function genId(){ return Math.random().toString(36).slice(2,9); }

function getMeetingDates(start:string, end:string, day:string): string[] {
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const target=days.indexOf(day);
  const dates:string[]=[];
  const cur=new Date(start);
  while(cur.getDay()!==target) cur.setDate(cur.getDate()+1);
  const endD=new Date(end);
  while(cur<=endD){ dates.push(cur.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'})); cur.setDate(cur.getDate()+7); }
  return dates;
}

function fmt12(t:string){ if(!t) return ''; const [h,m]=t.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')}${h>=12?'pm':'am'}`; }

export default function TermPage() {
  const router = useRouter();
  const [config, setConfig] = useState<GroupConfig|null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [termName, setTermName] = useState('Term 2, 2026');
  const [rows, setRows] = useState<TermRow[]>([]);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editDraft, setEditDraft] = useState<Partial<TermRow>>({});
  const [generating, setGenerating] = useState(false);
  const [datesSet, setDatesSet] = useState(false);

  useEffect(()=>{
    const c=localStorage.getItem('scoutGroupConfig'); if(c) setConfig(JSON.parse(c));
    const t=localStorage.getItem('termRows'); if(t){setRows(JSON.parse(t));setDatesSet(true);}
  },[]);

  const sc = config ? SECTION_COLOURS[config.section]||SECTION_COLOURS.Joeys : SECTION_COLOURS.Joeys;
  const acc = sc.accent;
  const pale = sc.pale;

  const buildDates = useCallback(()=>{
    if(!startDate||!endDate||!config) return;
    const dates = getMeetingDates(startDate, endDate, config.meetingDay);
    const newRows: TermRow[] = dates.map(d=>({
      id:genId(), date:d, time:fmt12(config.meetingTime),
      topic:'', location:'Hall', oasFocus:'', bring:'',
      leader:config.leaders[0]||'', assistantPatrol:'',
      consentRequired:false, rowType:'session',
    }));
    setRows(newRows); setDatesSet(true);
    localStorage.setItem('termRows', JSON.stringify(newRows));
  },[startDate,endDate,config]);

  const saveRows=(r:TermRow[])=>{ setRows(r); localStorage.setItem('termRows',JSON.stringify(r)); };
  const startEdit=(row:TermRow)=>{ setEditingId(row.id); setEditDraft({...row}); };
  const saveEdit=()=>{ saveRows(rows.map(r=>r.id===editingId?{...r,...editDraft} as TermRow:r)); setEditingId(null); };
  const deleteRow=(id:string)=>{ if(confirm('Remove this row?')) saveRows(rows.filter(r=>r.id!==id)); };
  const addRow=(type:'session'|'extra')=>{
    const nr:TermRow={id:genId(),date:'',time:type==='session'?fmt12(config?.meetingTime||'18:00'):'',topic:'',location:'Hall',oasFocus:'',bring:'',leader:config?.leaders[0]||'',assistantPatrol:'',consentRequired:false,rowType:type};
    const updated=[...rows,nr]; saveRows(updated); setEditingId(nr.id); setEditDraft({...nr});
  };

  const generateAI=async()=>{
    if(!config) return; setGenerating(true);
    try {
      const res=await fetch('/api/generate-term',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({section:config.section,termName,rowCount:rows.length})});
      const data=await res.json();
      if(data.suggestions){ saveRows(rows.map((r,i)=>({...r,topic:data.suggestions[i]?.topic||r.topic,oasFocus:data.suggestions[i]?.oasFocus||r.oasFocus}))); }
    } finally { setGenerating(false); }
  };

  const openRunSheet=(row:TermRow)=>{ localStorage.setItem('runSheetSource',JSON.stringify({row,config})); router.push('/runsheet'); };
  const sessionCount=rows.filter(r=>r.rowType==='session').length;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
        .nav{background:#2C3E6B;height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
        .nav-l{display:flex;align-items:center;gap:10px;}
        .nav-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;}
        .nav-title{color:#fff;font-size:15px;font-weight:500;}
        .nav-tag{font-size:11px;font-weight:500;padding:2px 9px;border-radius:4px;color:#fff;}
        .nav-group{color:rgba(255,255,255,0.5);font-size:12px;}
        .nav-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);padding:5px 11px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;}
        .ph{background:#fff;border-bottom:1px solid #e5e7eb;padding:18px 24px 0;}
        .bc{font-size:11px;color:#9ca3af;margin-bottom:7px;}
        .ph-title{color:#111827;font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:2px;}
        .ph-sub{color:#6b7280;font-size:12px;margin-bottom:14px;}
        .tabs{display:flex;}
        .tab{padding:9px 18px;font-size:12px;color:#6b7280;border-bottom:2px solid transparent;cursor:pointer;font-weight:500;}
        .tab.on{color:#111827;}
        .body{max-width:1040px;margin:0 auto;padding:20px 24px 60px;}
        .setup-card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;padding:14px 18px;margin-bottom:14px;display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;}
        .sf{display:flex;flex-direction:column;gap:3px;}
        .slabel{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;}
        input[type=date],input[type=text],select,.tf{border:1px solid #d1d5db;border-radius:6px;padding:7px 10px;font-size:13px;color:#111827;font-family:inherit;outline:none;background:#fff;}
        input[type=date]:focus,input[type=text]:focus,.tf:focus{border-color:${acc};}
        .gen-btn{padding:8px 18px;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#fff;}
        .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
        .tl{display:flex;gap:6px;flex-wrap:wrap;}
        .tbtn{font-size:12px;padding:6px 12px;border-radius:6px;border:1px solid #d1d5db;background:#fff;color:#374151;cursor:pointer;font-family:inherit;font-weight:500;display:flex;align-items:center;gap:4px;transition:all 0.15s;}
        .tbtn:hover{border-color:${acc};color:${acc};}
        .tbtn.pri{color:#fff;border-color:transparent;}
        .tbtn.pri:hover{opacity:0.9;}
        .term-card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;}
        .term-head{background:#fff;border-bottom:1px solid #e5e7eb;border-left:4px solid #C17F24;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;}
        .th-name{color:#111827;font-size:14px;font-weight:600;}
        .th-meta{color:#6b7280;font-size:11px;margin-top:1px;}
        .th-tags{display:flex;gap:5px;}
        .th-tag{background:#f3f4f6;color:#6b7280;font-size:11px;padding:2px 8px;border-radius:4px;}
        .th-tag.a{color:#fff;}
        .tbl-wrap{overflow-x:auto;}
        table{width:100%;border-collapse:collapse;font-size:12px;min-width:800px;}
        thead tr{background:${acc};}
        th{padding:8px 9px;text-align:left;font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#fff;white-space:nowrap;}
        tbody tr.session td{background:${pale};}
        tbody tr.extra td{background:#fff;}
        tbody tr.editing td{background:rgba(193,127,36,0.05)!important;border-left:3px solid ${acc};}
        td{padding:8px 9px;border-bottom:1px solid #f3f4f6;vertical-align:top;line-height:1.45;color:#111827;}
        tbody tr:hover td{filter:brightness(0.98);}
        .dm{font-weight:600;font-size:12px;}
        .dt{font-size:10px;color:#9ca3af;margin-top:1px;}
        .ctag{display:inline-flex;align-items:center;gap:2px;font-size:10px;background:#fef9ec;color:#92600a;border:1px solid #f0cf80;border-radius:3px;padding:1px 5px;margin-top:3px;}
        .otag{display:inline-block;font-size:10px;background:#eef1f9;color:#2C3E6B;border:1px solid #c5cedf;border-radius:3px;padding:1px 5px;}
        .act-col{display:flex;flex-direction:column;gap:4px;}
        .edit-btn{font-size:10px;padding:3px 8px;border-radius:4px;border:1px solid #d1d5db;background:#fff;color:#6b7280;cursor:pointer;font-family:inherit;text-align:center;width:100%;}
        .edit-btn:hover{border-color:${acc};color:${acc};}
        .create-btn{font-size:10px;padding:3px 8px;border-radius:4px;border:1px solid ${acc};color:${acc};background:transparent;cursor:pointer;font-family:inherit;text-align:center;width:100%;font-weight:500;}
        .create-btn:hover{background:${pale};}
        .del-btn{font-size:10px;padding:2px;border:none;background:transparent;color:#d1d5db;cursor:pointer;font-family:inherit;text-align:center;width:100%;}
        .del-btn:hover{color:#ef4444;}
        .edit-form{padding:12px 14px 14px;background:#fafaf8;border-top:1px dashed #e5e7eb;}
        .ef3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;}
        .ef2{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px;}
        .efl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-bottom:3px;}
        .efi{width:100%;border:1px solid #d1d5db;border-radius:5px;padding:6px 8px;font-size:12px;color:#111827;font-family:inherit;outline:none;}
        .efi:focus{border-color:${acc};}
        .ef-check{display:flex;align-items:center;gap:5px;font-size:12px;color:#374151;cursor:pointer;}
        .ef-actions{display:flex;gap:6px;align-items:center;margin-top:10px;flex-wrap:wrap;}
        .save-btn{font-size:12px;padding:6px 16px;border-radius:6px;border:none;color:#fff;cursor:pointer;font-family:inherit;font-weight:600;}
        .cancel-btn{font-size:12px;padding:6px 12px;border-radius:6px;border:1px solid #d1d5db;background:#fff;color:#6b7280;cursor:pointer;font-family:inherit;}
        .type-sel{font-size:11px;padding:5px 8px;border-radius:5px;border:1px solid #d1d5db;background:#fff;color:#374151;font-family:inherit;margin-left:auto;}
        .totrow{background:#f9fafb;padding:8px 10px;font-size:11px;color:#6b7280;border-top:1px solid #f3f4f6;}
        .add-row{padding:10px 14px;border-top:1px solid #f3f4f6;display:flex;gap:8px;background:#f9fafb;}
        .add-btn{font-size:12px;padding:5px 10px;border-radius:5px;border:1px dashed #d1d5db;background:transparent;color:#6b7280;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;}
        .add-btn:hover{border-color:${acc};color:${acc};}
        .leg{display:flex;gap:14px;padding:10px 14px;border-top:1px solid #f3f4f6;flex-wrap:wrap;}
        .li{display:flex;align-items:center;gap:5px;font-size:11px;color:#6b7280;}
        .ld{width:9px;height:9px;border-radius:2px;flex-shrink:0;}
        .empty-state{text-align:center;padding:52px 0;color:#9ca3af;}
        .empty-icon{font-size:36px;margin-bottom:12px;}
        .empty-title{font-size:15px;font-weight:600;color:#374151;margin-bottom:6px;}
        .empty-desc{font-size:13px;}
      `}</style>

      <nav className="nav">
        <div className="nav-l">
          <div className="nav-dot" style={{background:acc}}>⚜</div>
          <span className="nav-title">Scout Program Builder</span>
        </div>
        <div className="nav-l" style={{gap:'8px'}}>
          {config && <span className="nav-tag" style={{background:acc}}>{config.section}</span>}
          {config && <span className="nav-group">{config.groupName}</span>}
        </div>
        <button className="nav-btn" onClick={()=>router.push('/setup')}>⚙ Settings</button>
      </nav>

      <div className="ph">
        <div className="bc">Home › Term Plans</div>
        <div className="ph-title">{termName}</div>
        <div className="ph-sub">{config?.meetingDay}s {config?fmt12(config.meetingTime):''} · {config?.groupName}</div>
        <div className="tabs">
          <div className="tab on" style={{borderBottomColor:acc}}>Term plan</div>
          <div className="tab">Run sheets</div>
          <div className="tab">Members</div>
        </div>
      </div>

      <div className="body">
        <div className="setup-card">
          <div className="sf">
            <div className="slabel">Term name</div>
            <input type="text" className="tf" value={termName} onChange={e=>setTermName(e.target.value)} style={{width:'150px'}}/>
          </div>
          <div className="sf">
            <div className="slabel">Term start</div>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/>
          </div>
          <div className="sf">
            <div className="slabel">Term end</div>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}/>
          </div>
          <button className="gen-btn" style={{background:acc}} onClick={buildDates} disabled={!startDate||!endDate}>
            Generate dates
          </button>
        </div>

        {datesSet && <>
          <div className="toolbar">
            <div className="tl">
              <button className="tbtn" onClick={()=>addRow('session')}>+ Add week</button>
              <button className="tbtn" onClick={()=>addRow('extra')}>+ Special event</button>
              <button className="tbtn" onClick={generateAI} disabled={generating}>
                {generating?'⏳ Generating…':'✦ AI suggest themes'}
              </button>
            </div>
            <div className="tl">
              <button className="tbtn">🖨 Print</button>
              <button className="tbtn pri" style={{background:acc}}>⬇ PDF</button>
            </div>
          </div>

          <div className="term-card">
            <div className="term-head">
              <div>
                <div className="th-name">{termName}</div>
                <div className="th-meta">{config?.leaders.join(' · ')} · {config?.meetingDay}s {config?fmt12(config.meetingTime):''}</div>
              </div>
              <div className="th-tags">
                <span className="th-tag">{sessionCount} sessions</span>
                <span className="th-tag a" style={{background:acc}}>{config?.section}</span>
              </div>
            </div>

            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{width:'88px'}}>Date</th>
                    <th style={{width:'185px'}}>Topic / theme</th>
                    <th style={{width:'80px'}}>Location</th>
                    <th style={{width:'92px'}}>OAS focus</th>
                    <th style={{width:'105px'}}>Bring</th>
                    <th style={{width:'70px'}}>Leader</th>
                    <th style={{width:'74px'}}>Asst. patrol</th>
                    <th style={{width:'90px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row=>(
                    <>
                      <tr key={row.id} className={`${row.rowType==='session'?'session':'extra'} ${editingId===row.id?'editing':''}`}>
                        <td><div className="dm">{row.date}</div><div className="dt">{row.time}</div></td>
                        <td>
                          {row.topic||<span style={{color:'#d1d5db',fontStyle:'italic'}}>No topic yet</span>}
                          {row.consentRequired&&<div><span className="ctag">⚠ Consent</span></div>}
                        </td>
                        <td>{row.location}</td>
                        <td>{row.oasFocus?<span className="otag">{row.oasFocus}</span>:'—'}</td>
                        <td>{row.bring||'—'}</td>
                        <td>{row.leader||'—'}</td>
                        <td>{row.assistantPatrol||'—'}</td>
                        <td>
                          <div className="act-col">
                            <button className="edit-btn" onClick={()=>editingId===row.id?setEditingId(null):startEdit(row)}>✏ Edit</button>
                            <button className="create-btn" onClick={()=>openRunSheet(row)}>Create</button>
                            <button className="del-btn" onClick={()=>deleteRow(row.id)}>🗑 delete</button>
                          </div>
                        </td>
                      </tr>
                      {editingId===row.id&&(
                        <tr key={`${row.id}-edit`}>
                          <td colSpan={8} style={{padding:0,borderLeft:`3px solid ${acc}`}}>
                            <div className="edit-form">
                              <div className="ef3">
                                <div><div className="efl">Date</div><input className="efi" value={editDraft.date||''} onChange={e=>setEditDraft(d=>({...d,date:e.target.value}))}/></div>
                                <div><div className="efl">Time</div><input className="efi" value={editDraft.time||''} onChange={e=>setEditDraft(d=>({...d,time:e.target.value}))}/></div>
                                <div><div className="efl">Location</div><input className="efi" value={editDraft.location||''} onChange={e=>setEditDraft(d=>({...d,location:e.target.value}))}/></div>
                              </div>
                              <div className="ef3">
                                <div><div className="efl">Topic / theme</div><input className="efi" value={editDraft.topic||''} onChange={e=>setEditDraft(d=>({...d,topic:e.target.value}))}/></div>
                                <div><div className="efl">OAS focus</div><input className="efi" value={editDraft.oasFocus||''} onChange={e=>setEditDraft(d=>({...d,oasFocus:e.target.value}))}/></div>
                                <div><div className="efl">Bring</div><input className="efi" value={editDraft.bring||''} onChange={e=>setEditDraft(d=>({...d,bring:e.target.value}))}/></div>
                              </div>
                              <div className="ef2">
                                <div><div className="efl">Leader</div><input className="efi" value={editDraft.leader||''} onChange={e=>setEditDraft(d=>({...d,leader:e.target.value}))}/></div>
                                <div><div className="efl">Asst. patrol leader</div><input className="efi" value={editDraft.assistantPatrol||''} onChange={e=>setEditDraft(d=>({...d,assistantPatrol:e.target.value}))}/></div>
                              </div>
                              <div className="ef-actions">
                                <button className="save-btn" style={{background:acc}} onClick={saveEdit}>Save</button>
                                <button className="cancel-btn" onClick={()=>setEditingId(null)}>Cancel</button>
                                <label className="ef-check" style={{marginLeft:'8px'}}>
                                  <input type="checkbox" style={{accentColor:acc}} checked={editDraft.consentRequired||false} onChange={e=>setEditDraft(d=>({...d,consentRequired:e.target.checked}))}/>
                                  Consent required
                                </label>
                                <select className="type-sel" value={editDraft.rowType||'session'} onChange={e=>setEditDraft(d=>({...d,rowType:e.target.value as 'session'|'extra'}))}>
                                  <option value="session">Weekly session</option>
                                  <option value="extra">Extra event</option>
                                </select>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="totrow">
              {sessionCount} weekly sessions
              {rows.some(r=>r.oasFocus) && (' · ' + rows.filter(r=>r.oasFocus).map(r=>r.oasFocus).filter((v,i,a)=>a.indexOf(v)===i).join(' · '))}
            </div>

            <div className="add-row">
              <button className="add-btn" onClick={()=>addRow('session')}>+ Add week</button>
              <button className="add-btn" onClick={()=>addRow('extra')}>+ Special event</button>
            </div>

            <div className="leg">
              <div className="li"><div className="ld" style={{background:pale,border:`1px solid ${acc}40`}}></div> Weekly session</div>
              <div className="li"><div className="ld" style={{background:'#fff',border:'1px solid #e5e7eb'}}></div> Extra event</div>
              <div className="li"><div className="ld" style={{background:'#fef9ec',border:'1px solid #f0cf80'}}></div> Consent required</div>
            </div>
          </div>
        </>}

        {!datesSet&&(
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <div className="empty-title">Enter your term dates above</div>
            <div className="empty-desc">The app will generate all your {config?.meetingDay||'weekly'} meeting dates automatically</div>
          </div>
        )}
      </div>
    </>
  );
}
