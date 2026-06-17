"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const SECTION_COLOURS: Record<string,{accent:string;pale:string;text:string}> = {
  Joeys:     { accent:'#C17F24', pale:'rgba(193,127,36,0.07)', text:'#fff' },
  Cubs:      { accent:'#E8B800', pale:'rgba(232,184,0,0.08)',  text:'#3d2800' },
  Scouts:    { accent:'#6BBF5A', pale:'rgba(107,191,90,0.08)', text:'#fff' },
  Venturers: { accent:'#B5485E', pale:'rgba(181,72,94,0.07)',  text:'#fff' },
};

const OAS_STREAMS = ['Bushcraft','Bushwalking','Camping','Aquatics','Cycling','Paddling','Vertical','Alpine','Community','Creative','Personal Growth'];

interface GroupConfig { groupName:string; section:string; meetingDay:string; meetingTime:string; leaders:string[]; members:string[]; }
interface TermRow { id:string; date:string; time:string; topic:string; location:string; oasFocus:string; sessionNotes:string; bring:string; leader:string; assistantPatrol:string; consentRequired:boolean; rowType:'session'|'extra'; }

const COLUMN_DEFS = [
  { key:'date', label:'Date', width:'88px', always:true },
  { key:'topic', label:'Topic / theme', width:'190px', always:true },
  { key:'location', label:'Location', width:'80px' },
  { key:'focusNotes', label:'Focus / notes', width:'130px' },
  { key:'bring', label:'Bring', width:'100px' },
  { key:'leader', label:'Leader', width:'68px' },
  { key:'assistantPatrol', label:'Asst. patrol', width:'74px' },
];

function genId(){ return Math.random().toString(36).slice(2,9); }

function getMeetingDates(start:string, end:string, day:string): {date:string, iso:string}[] {
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const target=days.indexOf(day);
  const dates:{date:string,iso:string}[]=[];
  const cur=new Date(start);
  while(cur.getDay()!==target) cur.setDate(cur.getDate()+1);
  const endD=new Date(end);
  while(cur<=endD){
    dates.push({ date: cur.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'}), iso: cur.toISOString().slice(0,10) });
    cur.setDate(cur.getDate()+7);
  }
  return dates;
}

function fmt12(t:string){ if(!t) return ''; const [h,m]=t.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')}${h>=12?'pm':'am'}`; }

// parse a "Wed 22 Apr"-style date string (with implied year context) to a sortable value
function dateSortKey(row: TermRow, yearHint: number): number {
  if (!row.date) return Infinity;
  const parsed = Date.parse(`${row.date} ${yearHint}`);
  if (!isNaN(parsed)) return parsed;
  return Infinity;
}

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
  const [visibleCols, setVisibleCols] = useState<Record<string,boolean>>(
    Object.fromEntries(COLUMN_DEFS.map(c=>[c.key,true]))
  );
  const [showColPicker, setShowColPicker] = useState(false);

  // Theme planning panel
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [selectedOAS, setSelectedOAS] = useState<string[]>([]);
  const [extraThemeNotes, setExtraThemeNotes] = useState('');
  const [extraEventsDraft, setExtraEventsDraft] = useState<{name:string;date:string;time:string;location:string;consent:boolean}[]>([]);
  const [aiError, setAiError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadPlan = () => {
    const payload = {
      type: 'program-builder-term-plan',
      version: 1,
      savedAt: new Date().toISOString(),
      termName,
      startDate,
      endDate,
      config,
      rows,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (termName || 'term-plan').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    a.href = url;
    a.download = `${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = JSON.parse(text);
        if (data.type !== 'scout-program-builder-term-plan') {
          alert('This file doesn\'t look like a Scout Program Builder term plan.');
          return;
        }
        if (data.termName) setTermName(data.termName);
        if (data.startDate) setStartDate(data.startDate);
        if (data.endDate) setEndDate(data.endDate);
        if (data.config) {
          setConfig(data.config);
          localStorage.setItem('groupConfig', JSON.stringify(data.config));
        }
        if (data.rows) {
          setRows(data.rows);
          setDatesSet(true);
          localStorage.setItem('programRows', JSON.stringify(data.rows));
        }
      } catch (err) {
        alert('Could not read this file — it may be corrupted or not a valid term plan file.');
      }
    };
    reader.readAsText(file);
    // reset input so the same file can be re-uploaded if needed
    e.target.value = '';
  };

  useEffect(()=>{
    const c=localStorage.getItem('groupConfig'); if(c) setConfig(JSON.parse(c));
    const t=localStorage.getItem('programRows'); if(t){setRows(JSON.parse(t));setDatesSet(true);}
  },[]);

  const sc = config ? SECTION_COLOURS[config.section]||SECTION_COLOURS.Joeys : SECTION_COLOURS.Joeys;
  const acc = sc.accent;
  const pale = sc.pale;

  const buildDates = useCallback(()=>{
    if(!startDate||!endDate||!config) return;
    const dates = getMeetingDates(startDate, endDate, config.meetingDay);
    const newRows: TermRow[] = dates.map(d=>({
      id:genId(), date:d.date, time:fmt12(config.meetingTime),
      topic:'', location:'Hall', oasFocus:'', sessionNotes:'', bring:'',
      leader:config.leaders[0]||'', assistantPatrol:'',
      consentRequired:false, rowType:'session',
    }));
    setRows(newRows); setDatesSet(true);
    localStorage.setItem('programRows', JSON.stringify(newRows));
  },[startDate,endDate,config]);

  const saveRows=(r:TermRow[])=>{ setRows(r); localStorage.setItem('programRows',JSON.stringify(r)); };
  const startEdit=(row:TermRow)=>{ setEditingId(row.id); setEditDraft({...row}); };
  const saveEdit=()=>{ saveRows(rows.map(r=>r.id===editingId?{...r,...editDraft} as TermRow:r)); setEditingId(null); };
  const deleteRow=(id:string)=>{ if(confirm('Remove this row?')) saveRows(rows.filter(r=>r.id!==id)); };

  const addRow=(type:'session'|'extra')=>{
    const nr:TermRow={id:genId(),date:'',time:type==='session'?fmt12(config?.meetingTime||'18:00'):'',topic:'',location: type==='session'?'Hall':'',oasFocus:'',sessionNotes:'',bring:'',leader:config?.leaders[0]||'',assistantPatrol:'',consentRequired:false,rowType:type};
    const updated=[...rows,nr]; saveRows(updated); setEditingId(nr.id); setEditDraft({...nr});
  };

  const moveRow=(id:string, dir:-1|1)=>{
    const idx = rows.findIndex(r=>r.id===id);
    const newIdx = idx+dir;
    if(newIdx<0||newIdx>=rows.length) return;
    const updated=[...rows];
    [updated[idx],updated[newIdx]]=[updated[newIdx],updated[idx]];
    saveRows(updated);
  };

  const toggleOAS=(stream:string)=>{
    setSelectedOAS(s=> s.includes(stream) ? s.filter(x=>x!==stream) : [...s,stream]);
  };

  const addExtraEventDraft=()=>{
    setExtraEventsDraft(d=>[...d,{name:'',date:'',time:'',location:'',consent:false}]);
  };
  const updateExtraEventDraft=(i:number, field:string, value:string|boolean)=>{
    setExtraEventsDraft(d=>d.map((e,idx)=>idx===i?{...e,[field]:value}:e));
  };
  const removeExtraEventDraft=(i:number)=>{
    setExtraEventsDraft(d=>d.filter((_,idx)=>idx!==i));
  };

  const generateAI = async () => {
    if(!config) return;
    if(rows.length===0){ setAiError('Generate dates first using the Term start/end fields above.'); return; }
    setGenerating(true); setAiError('');
    try {
      const res = await fetch('/api/generate-term',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          section: config.section,
          termName,
          rowCount: rows.filter(r=>r.rowType==='session').length,
          oasStreams: selectedOAS,
          notes: extraThemeNotes,
        }),
      });
      if(!res.ok){
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text.slice(0,200)}`);
      }
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      if(!data.suggestions || !Array.isArray(data.suggestions)){
        throw new Error('No suggestions returned from AI');
      }

      // Apply suggestions only to session rows, in order
      let sIdx = 0;
      const updated = rows.map(r=>{
        if(r.rowType!=='session') return r;
        const suggestion = data.suggestions[sIdx];
        sIdx++;
        if(!suggestion) return r;
        return {
          ...r,
          topic: suggestion.topic || r.topic,
          oasFocus: suggestion.oasFocus || r.oasFocus,
          location: suggestion.location || r.location,
          bring: suggestion.bring || r.bring,
        };
      });

      // Add extra events from the theme panel
      let finalRows = [...updated];
      for(const ev of extraEventsDraft){
        if(!ev.name) continue;
        finalRows.push({
          id: genId(),
          date: ev.date || '',
          time: ev.time || '',
          topic: ev.name,
          location: ev.location || '',
          oasFocus: '',
          sessionNotes: '',
          bring: '',
          leader: config.leaders[0]||'',
          assistantPatrol: '',
          consentRequired: ev.consent,
          rowType: 'extra',
        });
      }

      // Sort by date if possible
      const yearMatch = termName.match(/(\d{4})/);
      const yearHint = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      finalRows.sort((a,b)=> dateSortKey(a,yearHint) - dateSortKey(b,yearHint));

      saveRows(finalRows);
      setShowThemePanel(false);
    } catch(err:any){
      setAiError(err.message || 'Something went wrong generating themes. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const openRunSheet=(row:TermRow)=>{
    localStorage.setItem('runSheetSource',JSON.stringify({row,config}));
    router.push('/runsheet');
  };

  const sessionCount=rows.filter(r=>r.rowType==='session').length;
  const activeCols = COLUMN_DEFS.filter(c=>visibleCols[c.key]);
  const colSpanTotal = activeCols.length + 1; // +1 for actions

  return (
    <>
      <style key={acc}>{`
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
        .body{max-width:1080px;margin:0 auto;padding:20px 24px 60px;}
        .setup-card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;padding:14px 18px;margin-bottom:14px;display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;}
        .sf{display:flex;flex-direction:column;gap:3px;}
        .slabel{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;}
        input[type=date],input[type=text],input[type=time],select,.tf{border:1px solid #d1d5db;border-radius:6px;padding:7px 10px;font-size:13px;color:#111827;font-family:inherit;outline:none;background:#fff;}
        input[type=date]:focus,input[type=text]:focus,input[type=time]:focus,.tf:focus{border-color:${acc};}
        .gen-btn{padding:8px 18px;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#fff;}
        .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
        .tl{display:flex;gap:6px;flex-wrap:wrap;position:relative;}
        .tbtn{font-size:12px;padding:6px 12px;border-radius:6px;border:1px solid #d1d5db;background:#fff;color:#374151;cursor:pointer;font-family:inherit;font-weight:500;display:flex;align-items:center;gap:4px;transition:all 0.15s;}
        .tbtn:hover{border-color:${acc};color:${acc};}
        .tbtn:disabled{opacity:0.5;cursor:not-allowed;}
        .tbtn.pri{color:#fff;border-color:transparent;}
        .tbtn.pri:hover{opacity:0.9;}
        .tbtn.active{background:${pale};border-color:${acc};color:${acc};}

        /* Theme panel */
        .theme-panel{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:18px;margin-bottom:14px;}
        .theme-panel-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;}
        .theme-panel-title{font-size:15px;font-weight:600;color:#111827;margin-bottom:3px;}
        .theme-panel-desc{font-size:12px;color:#6b7280;line-height:1.5;}
        .close-x{background:none;border:none;color:#9ca3af;cursor:pointer;font-size:18px;padding:0;line-height:1;}
        .close-x:hover{color:#374151;}
        .tp-section{margin-bottom:16px;}
        .tp-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;margin-bottom:8px;}
        .oas-grid{display:flex;flex-wrap:wrap;gap:6px;}
        .oas-chip{padding:6px 13px;border-radius:16px;border:1.5px solid #e5e7eb;background:#fff;color:#6b7280;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s;}
        .oas-chip.on{border-color:${acc};background:${pale};color:${acc};}
        .tp-textarea{width:100%;border:1px solid #d1d5db;border-radius:6px;padding:8px 10px;font-size:13px;color:#111827;font-family:inherit;outline:none;resize:vertical;min-height:60px;line-height:1.5;}
        .tp-textarea:focus{border-color:${acc};}
        .extra-event-row{display:grid;grid-template-columns:1.4fr 0.9fr 0.7fr 1fr auto auto;gap:6px;margin-bottom:6px;align-items:center;}
        .extra-event-row input{font-size:12px;padding:6px 8px;}
        .consent-check{display:flex;align-items:center;gap:4px;font-size:11px;color:#6b7280;white-space:nowrap;}
        .add-extra-link{font-size:12px;cursor:pointer;background:none;border:none;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;font-weight:500;color:${acc};}
        .tp-actions{display:flex;gap:8px;align-items:center;margin-top:14px;}
        .ai-error{background:#fef2f2;border:1px solid #fca5a5;color:#b91c1c;font-size:12px;padding:8px 12px;border-radius:6px;margin-top:10px;}

        /* Column picker */
        .col-picker{position:absolute;top:calc(100% + 4px);right:0;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.08);padding:10px;z-index:20;min-width:180px;}
        .col-picker-title{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;margin-bottom:6px;}
        .col-opt{display:flex;align-items:center;gap:7px;font-size:12px;color:#374151;padding:4px 2px;cursor:pointer;}
        .col-opt input{accent-color:${acc};}

        .term-card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;}
        .term-head{background:#fff;border-bottom:1px solid #e5e7eb;border-left:4px solid ${acc};padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        .th-name{font-size:14px;font-weight:600;color:#111827;}
        .th-meta{font-size:11px;color:#6b7280;margin-top:1px;}
        .th-tags{display:flex;gap:5px;}
        .th-tag{background:#f3f4f6;color:#6b7280;font-size:11px;padding:2px 8px;border-radius:4px;}
        .th-tag.a{color:#fff;}
        .tbl-wrap{overflow-x:auto;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        thead tr{background:${acc};}
        th{padding:8px 9px;text-align:left;font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#fff;white-space:nowrap;}
        tbody tr.session td{background:${pale};}
        tbody tr.extra td{background:#fff;}
        tbody tr.editing td{background:rgba(193,127,36,0.05)!important;}
        td{padding:8px 9px;border-bottom:1px solid #f3f4f6;vertical-align:top;line-height:1.45;color:#111827;}
        tbody tr:hover td{filter:brightness(0.98);}
        .dm{font-weight:600;font-size:12px;}
        .dt{font-size:10px;color:#9ca3af;margin-top:1px;}
        .ctag{display:inline-flex;align-items:center;gap:2px;font-size:10px;background:#fef9ec;color:#92600a;border:1px solid #f0cf80;border-radius:3px;padding:1px 5px;margin-top:3px;}
        .otag{display:inline-block;font-size:10px;background:#eef1f9;color:#2C3E6B;border:1px solid #c5cedf;border-radius:3px;padding:1px 5px;}
        .act-col{display:flex;flex-direction:column;gap:3px;}
        .act-row-top{display:flex;gap:3px;}
        .move-btn{font-size:11px;padding:2px 5px;border-radius:4px;border:1px solid #e5e7eb;background:#fff;color:#9ca3af;cursor:pointer;line-height:1;}
        .move-btn:hover{border-color:${acc};color:${acc};}
        .move-btn:disabled{opacity:0.3;cursor:not-allowed;}
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
        .skip-row{display:flex;justify-content:center;margin:10px 0 0;}
        .skip-link{font-size:12px;color:#9ca3af;cursor:pointer;background:none;border:none;font-family:inherit;text-decoration:underline;}
        .skip-link:hover{color:${acc};}

        /* Print styles */
        @media print {
          .nav, .ph, .setup-card, .toolbar, .theme-panel, .add-row, .leg, .act-col, th:last-child, td:last-child { display: none !important; }
          body { background: #fff; }
          .body { max-width: 100%; padding: 12px 0; }
          .term-card { border: none; }
          .term-head { border-left: 4px solid ${acc}; padding: 14px 16px; }
          table { font-size: 11px; }
          th { padding: 8px 8px; }
          td { padding: 10px 8px; line-height: 1.6; }
          .dm { font-size: 12px; margin-bottom: 2px; }
          .dt { font-size: 10px; }
          tr.session td, tr.extra td { border-bottom: 1px solid #e5e7eb; }
          .term-card, .term-head { break-inside: avoid; }
          tr { break-inside: avoid; }
        }
        .upload-input{display:none;}
        /* Info tooltips */
        .info-btn{width:16px;height:16px;border-radius:50%;border:1.5px solid #d1d5db;background:#f9fafb;color:#9ca3af;font-size:10px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;position:relative;font-style:italic;font-family:Georgia,serif;vertical-align:middle;line-height:1;}
        .info-btn:hover,.info-btn.open{border-color:#C17F24;background:rgba(193,127,36,0.08);color:#C17F24;}
        .info-btn.on-dark{border-color:rgba(255,255,255,0.35);background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);}
        .info-btn.on-dark:hover,.info-btn.on-dark.open{border-color:#fff;background:rgba(255,255,255,0.2);color:#fff;}
        .tt{position:absolute;top:calc(100% + 7px);right:-4px;width:240px;background:#fff;border:0.5px solid #e5e7eb;border-radius:8px;padding:10px 12px;box-shadow:0 4px 14px rgba(0,0,0,0.1);z-index:100;text-align:left;display:none;pointer-events:none;}
        .tt.show{display:block;}
        .tt::before{content:'';position:absolute;top:-5px;right:8px;width:8px;height:8px;background:#fff;border-top:0.5px solid #e5e7eb;border-left:0.5px solid #e5e7eb;transform:rotate(45deg);}
        .tt-title{font-size:12px;font-weight:600;color:#111827;margin-bottom:4px;}
        .tt-body{font-size:11.5px;color:#6b7280;line-height:1.55;}
        .tt-tip{font-size:11px;color:#C17F24;margin-top:6px;display:flex;align-items:baseline;gap:4px;}
        .tt-tip::before{content:'→';flex-shrink:0;}

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
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <button className="gen-btn" style={{background:acc}} onClick={buildDates} disabled={!startDate||!endDate}>
              Generate dates
            </button>
            <span style={{position:'relative',display:'inline-flex',alignItems:'center'}} dangerouslySetInnerHTML={{__html:`<span class="info-btn">i<div class="tt"><div class="tt-title">Generate dates</div><div class="tt-body">Enter the first and last day of term. The app calculates every Wednesday (or your meeting day) in between and creates a row for each one automatically.</div><div class="tt-tip">You can add or remove rows manually afterwards</div></div></span>`}}/>
          </div>
        </div>

        {datesSet && <>
          <div className="toolbar">
            <div className="tl">
              <button className="tbtn" onClick={()=>addRow('session')}>+ Add week</button>
              <button className="tbtn" onClick={()=>addRow('extra')}>+ Special event</button>
              <button className={`tbtn ${showThemePanel?'active':''}`} onClick={()=>setShowThemePanel(s=>!s)}>
                ✦ AI suggest themes
              </button>
              <span style={{position:'relative',display:'inline-flex',alignItems:'center'}} dangerouslySetInnerHTML={{__html:`<span class="info-btn">i<div class="tt"><div class="tt-title">AI suggest themes</div><div class="tt-body">Opens a panel where you can select OAS focus areas, add notes about the term direction, and list any special events (night hike, camp etc). AI then fills in all the weekly topics for you.</div><div class="tt-tip">You can still edit each row manually after AI fills them in</div></div></span>`}}/>
              <button className="tbtn" onClick={()=>setShowColPicker(s=>!s)}>☰ Columns</button>
              {showColPicker && (
                <div className="col-picker">
                  <div className="col-picker-title">Show columns</div>
                  {COLUMN_DEFS.map(c=>(
                    <label key={c.key} className="col-opt">
                      <input type="checkbox" checked={visibleCols[c.key]} disabled={c.always}
                        onChange={e=>setVisibleCols(v=>({...v,[c.key]:e.target.checked}))}/>
                      {c.label}{c.always?' (always shown)':''}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="tl">
              <button className="tbtn pri" style={{background:acc}} onClick={()=>window.print()}>🖨 Print / Save as PDF</button>
              <button className="tbtn" onClick={downloadPlan} title="Save this term plan as a file you can re-upload later">💾 Save plan</button>
              <button className="tbtn" onClick={()=>fileInputRef.current?.click()} title="Load a previously saved term plan">📂 Load plan</button>
              <input ref={fileInputRef} type="file" accept=".json" className="upload-input" onChange={handleUpload}/>
            </div>
          </div>

          {showThemePanel && (
            <div className="theme-panel">
              <div className="theme-panel-head">
                <div>
                  <div className="theme-panel-title">Plan this term's themes</div>
                  <div className="theme-panel-desc">
                    Pick OAS focus areas, add notes about the term's direction, and add any special events
                    (night hikes, camps, working bees). AI will fill in the weekly topics, OAS focus, and
                    extra events for you.
                  </div>
                </div>
                <button className="close-x" onClick={()=>setShowThemePanel(false)}>✕</button>
              </div>

              <div className="tp-section">
                <div className="tp-label">OAS focus areas for this term (optional)</div>
                <div className="oas-grid">
                  {OAS_STREAMS.map(s=>(
                    <button key={s} className={`oas-chip ${selectedOAS.includes(s)?'on':''}`} onClick={()=>toggleOAS(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tp-section">
                <div className="tp-label">Notes for AI (optional)</div>
                <textarea className="tp-textarea" value={extraThemeNotes} onChange={e=>setExtraThemeNotes(e.target.value)}
                  placeholder="e.g. We're building up to a camp at the end of term, so include camp prep activities in the last few weeks. Keep early weeks low-key as new members are joining."/>
              </div>

              <div className="tp-section">
                <div className="tp-label">Special events (optional)</div>
                {extraEventsDraft.map((ev,i)=>(
                  <div key={i} className="extra-event-row">
                    <input placeholder="Event name (e.g. Night hike)" value={ev.name} onChange={e=>updateExtraEventDraft(i,'name',e.target.value)}/>
                    <input placeholder="Location" value={ev.location} onChange={e=>updateExtraEventDraft(i,'location',e.target.value)}/>
                    <input type="date" value={ev.date} onChange={e=>updateExtraEventDraft(i,'date',e.target.value)}/>
                    <input type="time" value={ev.time} onChange={e=>updateExtraEventDraft(i,'time',e.target.value)}/>
                    <label className="consent-check">
                      <input type="checkbox" checked={ev.consent} onChange={e=>updateExtraEventDraft(i,'consent',e.target.checked)}/>
                      Consent
                    </label>
                    <button className="rm-extra" onClick={()=>removeExtraEventDraft(i)} style={{border:'none',background:'none',color:'#d1d5db',cursor:'pointer',fontSize:'14px'}}>✕</button>
                  </div>
                ))}
                <button className="add-extra-link" onClick={addExtraEventDraft}>+ Add special event</button>
              </div>

              <div className="tp-actions">
                <button className="save-btn" style={{background:acc}} onClick={generateAI} disabled={generating}>
                  {generating ? '⏳ Generating…' : '✦ Generate themes'}
                </button>
                <button className="cancel-btn" onClick={()=>setShowThemePanel(false)}>Cancel</button>
              </div>

              {aiError && <div className="ai-error">⚠ {aiError}</div>}
            </div>
          )}

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
                    {activeCols.map(c=>(
                      <th key={c.key} style={{width:c.width}}>{c.label}</th>
                    ))}
                    <th style={{width:'90px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row,idx)=>(
                    <>
                      <tr key={row.id} className={`${row.rowType==='session'?'session':'extra'} ${editingId===row.id?'editing':''}`}>
                        {activeCols.map(c=>{
                          if(c.key==='date') return <td key="date"><div className="dm">{row.date}</div><div className="dt">{row.time}</div></td>;
                          if(c.key==='topic') return (
                            <td key="topic">
                              {row.topic||<span style={{color:'#d1d5db',fontStyle:'italic'}}>No topic yet</span>}
                              {row.consentRequired&&<div><span className="ctag">⚠ Consent</span></div>}
                            </td>
                          );
                          if(c.key==='focusNotes') return (
                            <td key="focusNotes">
                              {row.oasFocus && <div><span className="otag" style={{marginBottom:'3px',display:'inline-block'}}>{row.oasFocus}</span></div>}
                              {row.sessionNotes
                                ? <span style={{fontSize:'11px',color:'#6b7280',lineHeight:'1.4',display:'block'}}>{row.sessionNotes.length>60?row.sessionNotes.slice(0,60)+'…':row.sessionNotes}</span>
                                : (!row.oasFocus && '—')
                              }
                            </td>
                          );
                          if(c.key==='location') return <td key="location">{row.location||'—'}</td>;
                          if(c.key==='bring') return <td key="bring">{row.bring||'—'}</td>;
                          if(c.key==='leader') return <td key="leader">{row.leader||'—'}</td>;
                          if(c.key==='assistantPatrol') return <td key="assistantPatrol">{row.assistantPatrol||'—'}</td>;
                          return <td key={c.key}>—</td>;
                        })}
                        <td>
                          <div className="act-col">
                            <div className="act-row-top">
                              <button className="move-btn" onClick={()=>moveRow(row.id,-1)} disabled={idx===0} title="Move up">↑</button>
                              <button className="move-btn" onClick={()=>moveRow(row.id,1)} disabled={idx===rows.length-1} title="Move down">↓</button>
                            </div>
                            <button className="edit-btn" onClick={()=>editingId===row.id?setEditingId(null):startEdit(row)}>✏ Edit</button>
                            <button className="create-btn" onClick={()=>openRunSheet(row)}>Create</button>
                            <button className="del-btn" onClick={()=>deleteRow(row.id)}>🗑 delete</button>
                          </div>
                        </td>
                      </tr>
                      {editingId===row.id&&(
                        <tr key={`${row.id}-edit`}>
                          <td colSpan={colSpanTotal} style={{padding:0,borderLeft:`3px solid ${acc}`}}>
                            <div className="edit-form">
                              <div className="ef3">
                                <div><div className="efl">Date</div><input className="efi" value={editDraft.date||''} onChange={e=>setEditDraft(d=>({...d,date:e.target.value}))} placeholder="e.g. Wed 22 Apr"/></div>
                                <div><div className="efl">Time</div><input className="efi" value={editDraft.time||''} onChange={e=>setEditDraft(d=>({...d,time:e.target.value}))} placeholder="e.g. 6:00pm"/></div>
                                <div><div className="efl">Location</div><input className="efi" value={editDraft.location||''} onChange={e=>setEditDraft(d=>({...d,location:e.target.value}))}/></div>
                              </div>
                              <div className="ef3">
                                <div><div className="efl">Topic / theme</div><input className="efi" value={editDraft.topic||''} onChange={e=>setEditDraft(d=>({...d,topic:e.target.value}))}/></div>
                                <div><div className="efl">OAS focus</div><input className="efi" value={editDraft.oasFocus||''} onChange={e=>setEditDraft(d=>({...d,oasFocus:e.target.value}))} placeholder="e.g. Bushcraft S1"/></div>
                                <div><div className="efl">Bring</div><input className="efi" value={editDraft.bring||''} onChange={e=>setEditDraft(d=>({...d,bring:e.target.value}))}/></div>
                              </div>
                              <div style={{marginBottom:'8px'}}>
                                <div className="efl" style={{marginBottom:'3px'}}>Session notes <span style={{fontSize:'10px',color:'#9ca3af',fontWeight:'400',textTransform:'none',letterSpacing:0}}>— what to include, specific skills, context for AI run sheet generation</span></div>
                                <textarea className="efi" style={{resize:'vertical',minHeight:'68px',lineHeight:'1.55'}}
                                  value={editDraft.sessionNotes||''}
                                  onChange={e=>setEditDraft(d=>({...d,sessionNotes:e.target.value}))}
                                  placeholder="e.g. Include reef knot and bowline. Joeys are still new so keep instructions simple. Have rope cut into 60cm lengths before session."/>
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
          <>
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">Enter your term dates above</div>
              <div className="empty-desc">The app will generate all your {config?.meetingDay||'weekly'} meeting dates automatically</div>
            </div>
            <div className="skip-row" style={{gap:'16px',flexWrap:'wrap'}}>
              <button className="skip-link" onClick={()=>fileInputRef.current?.click()}>
                📂 Load a previously saved term plan
              </button>
              <span style={{color:'#e5e7eb'}}>·</span>
              <button className="skip-link" onClick={()=>router.push('/runsheet')}>
                Skip term planning — create a single run sheet instead →
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="upload-input" onChange={handleUpload}/>
            </div>
          </>
        )}
      </div>
      
      <script dangerouslySetInnerHTML={{__html:`
        (function(){
          function closeAll(){ document.querySelectorAll('.tt').forEach(t=>t.classList.remove('show')); document.querySelectorAll('.info-btn').forEach(b=>b.classList.remove('open')); }
          document.addEventListener('click',function(e){
            const btn = e.target.closest('.info-btn');
            if(!btn){ closeAll(); return; }
            const tt = btn.querySelector('.tt');
            const wasOpen = tt && tt.classList.contains('show');
            closeAll();
            if(tt && !wasOpen){ tt.classList.add('show'); btn.classList.add('open'); }
          });
        })();
      `}}/>

    </>
  );
}
