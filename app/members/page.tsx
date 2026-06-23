"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const NAVY = '#2C3E6B';

const SECTION_COLOURS: Record<string,{accent:string;pale:string;text:string}> = {
  Joeys:     { accent:'#C17F24', pale:'rgba(193,127,36,0.07)', text:'#fff' },
  Cubs:      { accent:'#E8B800', pale:'rgba(232,184,0,0.08)',  text:'#3d2800' },
  Scouts:    { accent:'#6BBF5A', pale:'rgba(107,191,90,0.08)', text:'#fff' },
  Venturers: { accent:'#B5485E', pale:'rgba(181,72,94,0.07)',  text:'#fff' },
};

const PEAK_AWARDS: Record<string,string> = {
  Joeys: 'Joey Scout Challenge',
  Cubs: 'Grey Wolf Award',
  Scouts: 'Australian Scout Medal',
  Venturers: "Queen's Scout Award",
};

const OAS_STREAMS = [
  'Bushcraft','Bushwalking','Camping','Aquatics',
  'Cycling','Paddling','Vertical','Alpine',
  'Community','Creative','Personal Growth',
];

const SIA_CATEGORIES = [
  { id:'adventure', label:'Adventure & Sport', icon:'🏃' },
  { id:'arts', label:'Arts & Literature', icon:'🎨' },
  { id:'world', label:'Creating a Better World', icon:'🌍' },
  { id:'environment', label:'Environment', icon:'🌿' },
  { id:'growth', label:'Growth & Development', icon:'⭐' },
  { id:'stem', label:'Innovation & STEM', icon:'🔬' },
];

// Milestone requirements — same across all sections
const MILESTONES = [
  { id:'m1', label:'Milestone 1', participate:6, assist:2, lead:1, total:27 },
  { id:'m2', label:'Milestone 2', participate:5, assist:3, lead:2, total:25 },
  { id:'m3', label:'Milestone 3', participate:4, assist:4, lead:4, total:24 },
];

const CHALLENGE_AREAS = ['Community','Outdoor','Creative','Personal'];

interface GroupConfig { groupName:string; section:string; meetingDay:string; meetingTime:string; leaders:string[]; }
interface TermRow { id:string; date:string; time:string; topic:string; rowType:string; }

interface SIAEntry {
  category: string;
  projectName: string;
  status: 'planning'|'in-progress'|'complete';
  notes: string;
  dateCompleted?: string;
}

interface MilestoneActivity {
  sessionId: string;
  sessionDate: string;
  challengeArea: string;
  type: 'participate'|'assist'|'lead';
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  yearJoined: number;
  attendance: Record<string, boolean>; // sessionId -> present
  oas: Record<string, number>; // stream -> highest stage earned (0-5)
  sia: SIAEntry[];
  milestoneActivities: MilestoneActivity[];
  milestonesAwarded: string[]; // ['m1','m2','m3','peak']
  peakAwarded: boolean;
}

function genId(){ return Math.random().toString(36).slice(2,9); }
function initials(m: Member){ return `${m.firstName[0]||''}${m.lastName[0]||''}`.toUpperCase(); }

function calcAttendancePct(member: Member, rows: TermRow[]): number {
  const sessions = rows.filter(r=>r.rowType==='session');
  if(!sessions.length) return 0;
  const attended = sessions.filter(r=>member.attendance[r.id]).length;
  return Math.round((attended/sessions.length)*100);
}

function calcMilestoneProgress(member: Member, milestoneId: string) {
  const m = MILESTONES.find(x=>x.id===milestoneId)!;
  const acts = member.milestoneActivities.filter(a=>
    // only count activities after previous milestone
    true
  );
  // Count by type across all challenge areas
  const byType = (type: 'participate'|'assist'|'lead') =>
    acts.filter(a=>a.type===type).length;
  // Count participate per challenge area
  const byArea = (area: string, type: 'participate'|'assist'|'lead') =>
    acts.filter(a=>a.challengeArea===area&&a.type===type).length;

  const participateMin = Math.min(...CHALLENGE_AREAS.map(a=>byArea(a,'participate')));
  const assistTotal = byType('assist');
  const leadTotal = byType('lead');

  return {
    participate: Math.min(participateMin, m.participate),
    participateTarget: m.participate,
    assist: Math.min(assistTotal, m.assist),
    assistTarget: m.assist,
    lead: Math.min(leadTotal, m.lead),
    leadTarget: m.lead,
    complete: participateMin >= m.participate && assistTotal >= m.assist && leadTotal >= m.lead,
  };
}

function avatarColour(idx: number, acc: string): string {
  const colours = [acc, NAVY, '#6BBF5A', '#B5485E', '#E8B800', '#6b7280'];
  return colours[idx % colours.length];
}

export default function MembersPage() {
  const router = useRouter();
  const [config, setConfig] = useState<GroupConfig|null>(null);
  const [rows, setRows] = useState<TermRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [view, setView] = useState<'list'|'attendance'|'profile'>('list');
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDraft, setAddDraft] = useState({firstName:'',lastName:'',age:'',yearJoined: new Date().getFullYear().toString()});
  const [addSIA, setAddSIA] = useState<{category:string;projectName:string;status:string;notes:string}>({category:'adventure',projectName:'',status:'planning',notes:''});
  const [showSIAForm, setShowSIAForm] = useState(false);
  const [addMilAct, setAddMilAct] = useState<{sessionId:string;challengeArea:string;type:string}>({sessionId:'',challengeArea:'Community',type:'participate'});
  const [showMilForm, setShowMilForm] = useState(false);

  useEffect(()=>{
    const c = localStorage.getItem('groupConfig');
    if(c) setConfig(JSON.parse(c));
    const t = localStorage.getItem('programRows');
    if(t) setRows(JSON.parse(t));
    const m = localStorage.getItem('members');
    if(m) setMembers(JSON.parse(m));
  },[]);

  const acc = config ? SECTION_COLOURS[config.section]?.accent||'#C17F24' : '#C17F24';
  const pale = config ? SECTION_COLOURS[config.section]?.pale||'rgba(193,127,36,0.07)' : 'rgba(193,127,36,0.07)';
  const section = config?.section||'Joeys';
  const peakAward = PEAK_AWARDS[section]||'Peak Award';
  const sessions = rows.filter(r=>r.rowType==='session');

  const saveMembers = (m: Member[]) => {
    setMembers(m);
    localStorage.setItem('members', JSON.stringify(m));
  };

  const addMember = () => {
    if(!addDraft.firstName.trim()) return;
    const newM: Member = {
      id: genId(),
      firstName: addDraft.firstName.trim(),
      lastName: addDraft.lastName.trim(),
      age: parseInt(addDraft.age)||0,
      yearJoined: parseInt(addDraft.yearJoined)||new Date().getFullYear(),
      attendance: {},
      oas: {},
      sia: [],
      milestoneActivities: [],
      milestonesAwarded: [],
      peakAwarded: false,
    };
    saveMembers([...members, newM]);
    setAddDraft({firstName:'',lastName:'',age:'',yearJoined:new Date().getFullYear().toString()});
    setShowAddForm(false);
  };

  const deleteMember = (id: string) => {
    if(confirm('Remove this member?')) saveMembers(members.filter(m=>m.id!==id));
    if(selectedId===id){ setView('list'); setSelectedId(null); }
  };

  const toggleAttendance = (memberId: string, sessionId: string) => {
    const updated = members.map(m=>{
      if(m.id!==memberId) return m;
      return {...m, attendance:{...m.attendance, [sessionId]: !m.attendance[sessionId]}};
    });
    saveMembers(updated);
  };

  const toggleOAS = (memberId: string, stream: string, stage: number) => {
    const updated = members.map(m=>{
      if(m.id!==memberId) return m;
      const current = m.oas[stream]||0;
      // clicking earned stage un-earns it (set to stage-1), clicking next earns it
      const newVal = current>=stage ? stage-1 : stage;
      return {...m, oas:{...m.oas, [stream]: Math.max(0,newVal)}};
    });
    saveMembers(updated);
  };

  const addSIAEntry = (memberId: string) => {
    if(!addSIA.projectName.trim()) return;
    const entry: SIAEntry = {
      category: addSIA.category,
      projectName: addSIA.projectName.trim(),
      status: addSIA.status as any,
      notes: addSIA.notes,
      dateCompleted: addSIA.status==='complete' ? new Date().toLocaleDateString('en-AU') : undefined,
    };
    const updated = members.map(m=>{
      if(m.id!==memberId) return m;
      return {...m, sia:[...m.sia, entry]};
    });
    saveMembers(updated);
    setAddSIA({category:'adventure',projectName:'',status:'planning',notes:''});
    setShowSIAForm(false);
  };

  const updateSIAStatus = (memberId: string, siaIdx: number, status: string) => {
    const updated = members.map(m=>{
      if(m.id!==memberId) return m;
      const sia = m.sia.map((s,i)=>i===siaIdx?{...s,status:status as any,dateCompleted:status==='complete'?new Date().toLocaleDateString('en-AU'):s.dateCompleted}:s);
      return {...m, sia};
    });
    saveMembers(updated);
  };

  const deleteSIA = (memberId: string, siaIdx: number) => {
    const updated = members.map(m=>{
      if(m.id!==memberId) return m;
      return {...m, sia: m.sia.filter((_,i)=>i!==siaIdx)};
    });
    saveMembers(updated);
  };

  const addMilestoneActivity = (memberId: string) => {
    if(!addMilAct.sessionId) return;
    const session = rows.find(r=>r.id===addMilAct.sessionId);
    const entry: MilestoneActivity = {
      sessionId: addMilAct.sessionId,
      sessionDate: session?.date||'',
      challengeArea: addMilAct.challengeArea,
      type: addMilAct.type as any,
    };
    const updated = members.map(m=>{
      if(m.id!==memberId) return m;
      return {...m, milestoneActivities:[...m.milestoneActivities, entry]};
    });
    saveMembers(updated);
    setShowMilForm(false);
  };

  const toggleMilestone = (memberId: string, milestoneId: string) => {
    const updated = members.map(m=>{
      if(m.id!==memberId) return m;
      const awarded = m.milestonesAwarded.includes(milestoneId)
        ? m.milestonesAwarded.filter(x=>x!==milestoneId)
        : [...m.milestonesAwarded, milestoneId];
      return {...m, milestonesAwarded: awarded};
    });
    saveMembers(updated);
  };

  const selected = members.find(m=>m.id===selectedId);

  // Summary stats
  const avgAttendance = members.length
    ? Math.round(members.reduce((s,m)=>s+calcAttendancePct(m,rows),0)/members.length)
    : 0;
  const totalOAS = members.reduce((s,m)=>s+Object.values(m.oas).filter(v=>v>0).length,0);
  const totalSIA = members.reduce((s,m)=>s+m.sia.filter(x=>x.status==='complete').length,0);

  return (
    <>
      <style key={acc}>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
        .nav{background:${NAVY};height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
        .nav-l{display:flex;align-items:center;gap:10px;}
        .nav-dot{width:28px;height:28px;border-radius:50%;background:${acc};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;}
        .nav-title{color:#fff;font-size:15px;font-weight:500;}
        .nav-tag{font-size:11px;font-weight:500;padding:2px 9px;border-radius:4px;background:${acc};color:#fff;}
        .nav-group{color:rgba(255,255,255,0.5);font-size:12px;}
        .nav-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);padding:5px 11px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;}
        .ph{background:#fff;border-bottom:1px solid #e5e7eb;padding:18px 24px 0;}
        .bc{font-size:11px;color:#9ca3af;margin-bottom:7px;}
        .ph-title{color:#111827;font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:2px;}
        .ph-sub{color:#6b7280;font-size:12px;margin-bottom:14px;}
        .tabs{display:flex;}
        .tab{padding:9px 18px;font-size:12px;color:#6b7280;border-bottom:2px solid transparent;cursor:pointer;font-weight:500;}
        .tab.on{color:#111827;border-bottom-color:${acc};}
        .body{max-width:1040px;margin:0 auto;padding:20px 24px 60px;}

        /* Stats */
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}
        .stat{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;}
        .stat-val{font-size:26px;font-weight:700;color:#111827;line-height:1;}
        .stat-label{font-size:11px;color:#6b7280;margin-top:4px;}
        .stat-sub{font-size:10px;color:#9ca3af;margin-top:2px;}

        /* Sub-tabs */
        .sub-tabs{display:flex;gap:6px;margin-bottom:14px;}
        .sub-tab{font-size:12px;padding:6px 14px;border-radius:20px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;cursor:pointer;font-weight:500;transition:all 0.15s;}
        .sub-tab.on{background:${acc};border-color:${acc};color:#fff;}

        /* Member list */
        .card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:14px;}
        .card-head{padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;}
        .card-title{font-size:13px;font-weight:600;color:#111827;}
        .btn-pri{font-size:12px;padding:5px 12px;border-radius:6px;border:none;background:${acc};color:#fff;cursor:pointer;font-family:inherit;font-weight:500;}
        .btn-sec{font-size:12px;padding:5px 12px;border-radius:6px;border:1px solid #d1d5db;background:#fff;color:#374151;cursor:pointer;font-family:inherit;}
        .btn-sm{font-size:11px;padding:3px 8px;border-radius:4px;border:1px solid #d1d5db;background:#fff;color:#6b7280;cursor:pointer;font-family:inherit;}
        .btn-sm:hover{border-color:${acc};color:${acc};}
        .btn-danger{font-size:11px;padding:3px 8px;border-radius:4px;border:1px solid transparent;background:transparent;color:#d1d5db;cursor:pointer;font-family:inherit;}
        .btn-danger:hover{color:#ef4444;border-color:#fca5a5;}

        .member-row{display:grid;grid-template-columns:40px 1fr 80px 100px 120px 80px 80px;align-items:center;padding:10px 14px;border-bottom:1px solid #f3f4f6;gap:8px;transition:background 0.15s;}
        .member-row:last-child{border-bottom:none;}
        .member-row:hover{background:#fafaf8;}
        .member-header{display:grid;grid-template-columns:40px 1fr 80px 100px 120px 80px 80px;padding:6px 14px;gap:8px;background:#f9fafb;border-bottom:1px solid #f3f4f6;}
        .col-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;}
        .avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;flex-shrink:0;}
        .m-name{font-size:13px;font-weight:500;color:#111827;}
        .m-meta{font-size:11px;color:#9ca3af;margin-top:1px;}
        .attend-wrap{display:flex;flex-direction:column;gap:3px;}
        .attend-pct{font-size:12px;font-weight:600;}
        .attend-bar{height:3px;background:#f3f4f6;border-radius:2px;overflow:hidden;}
        .attend-fill{height:100%;border-radius:2px;}
        .oas-mini{display:flex;gap:2px;flex-wrap:wrap;}
        .oas-dot{width:7px;height:7px;border-radius:50%;}
        .sia-count{font-size:12px;color:#6b7280;}
        .view-btn{font-size:11px;padding:4px 10px;border-radius:5px;border:1px solid ${acc};color:${acc};background:transparent;cursor:pointer;font-family:inherit;font-weight:500;white-space:nowrap;}
        .view-btn:hover{background:${pale};}

        /* Add member form */
        .add-form{background:#f9fafb;border-top:1px solid #f3f4f6;padding:14px 16px;}
        .add-grid{display:grid;grid-template-columns:1fr 1fr 80px 100px;gap:8px;margin-bottom:10px;}
        .af-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-bottom:3px;}
        .af-input{width:100%;border:1px solid #d1d5db;border-radius:5px;padding:6px 9px;font-size:12.5px;color:#111827;font-family:inherit;outline:none;}
        .af-input:focus{border-color:${acc};}
        .af-actions{display:flex;gap:6px;}

        /* Attendance grid */
        .att-wrap{overflow-x:auto;}
        .att-table{border-collapse:collapse;font-size:12px;min-width:600px;}
        .att-table th{padding:7px 10px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#fff;background:${acc};white-space:nowrap;}
        .att-table th.dark{background:${NAVY};}
        .att-table td{padding:8px 10px;border-bottom:1px solid #f3f4f6;vertical-align:middle;}
        .att-table tr:last-child td{border-bottom:none;}
        .att-table tr:hover td{background:#fafaf8;}
        .check-box{width:18px;height:18px;border:1.5px solid #d1d5db;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;font-size:11px;flex-shrink:0;}
        .check-box.on{background:${acc};border-color:${acc};color:#fff;}
        .check-box:hover{border-color:${acc};}
        .att-total{font-weight:600;font-size:12px;}
        .m-name-cell{font-weight:500;color:#111827;white-space:nowrap;}
        .m-meta-cell{font-size:10px;color:#9ca3af;}

        /* Profile view */
        .profile-head{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:14px;display:flex;align-items:center;gap:16px;}
        .profile-avatar{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:700;flex-shrink:0;}
        .profile-name{font-size:18px;font-weight:700;color:#111827;letter-spacing:-0.01em;}
        .profile-meta{font-size:12px;color:#6b7280;margin-top:2px;}
        .profile-stats{display:flex;gap:20px;margin-top:8px;}
        .ps-item{font-size:12px;color:#6b7280;}
        .ps-val{font-weight:600;color:#111827;}
        .back-link{font-size:12px;color:${acc};cursor:pointer;background:none;border:none;font-family:inherit;display:flex;align-items:center;gap:4px;margin-bottom:12px;padding:0;}

        /* OAS tracker */
        .oas-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px;}
        .oas-stream{border:1px solid #e5e7eb;border-radius:8px;padding:11px 13px;}
        .oas-stream-name{font-size:12px;font-weight:600;color:#111827;margin-bottom:7px;}
        .oas-stages{display:flex;gap:4px;}
        .stage-btn{width:26px;height:26px;border-radius:5px;border:1.5px solid #e5e7eb;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#9ca3af;cursor:pointer;transition:all 0.15s;background:#fff;}
        .stage-btn:hover{border-color:${acc};color:${acc};}
        .stage-btn.earned{background:${acc};border-color:${acc};color:#fff;}

        /* SIA */
        .sia-list{padding:10px 14px;}
        .sia-item{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid #f3f4f6;}
        .sia-item:last-child{border-bottom:none;}
        .sia-icon{font-size:16px;flex-shrink:0;margin-top:1px;}
        .sia-body{flex:1;}
        .sia-name{font-size:13px;font-weight:500;color:#111827;}
        .sia-cat{font-size:10px;color:#9ca3af;margin-top:1px;}
        .sia-status{font-size:10px;padding:2px 7px;border-radius:10px;font-weight:500;margin-left:6px;}
        .sia-status.planning{background:#f3f4f6;color:#6b7280;}
        .sia-status.in-progress{background:#fef3e0;color:#92600a;}
        .sia-status.complete{background:#e8f4e8;color:#2a6e2a;}
        .sia-notes{font-size:11px;color:#9ca3af;margin-top:3px;}
        .sia-actions{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;}
        .sia-form{background:#f9fafb;border-top:1px solid #f3f4f6;padding:12px 14px;}
        .sia-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}
        select.af-input{cursor:pointer;}

        /* Milestone */
        .milestone-list{padding:12px 14px;}
        .milestone-item{border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-bottom:10px;}
        .milestone-item:last-child{margin-bottom:0;}
        .mil-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
        .mil-label{font-size:13px;font-weight:600;color:#111827;}
        .mil-awarded{display:flex;align-items:center;gap:6px;font-size:11px;color:#2a6e2a;}
        .mil-check{width:16px;height:16px;border:1.5px solid #d1d5db;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:10px;}
        .mil-check.on{background:#2a6e2a;border-color:#2a6e2a;color:#fff;}
        .mil-bars{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
        .mil-bar-label{font-size:10px;color:#6b7280;margin-bottom:4px;font-weight:500;}
        .mil-progress{display:flex;align-items:center;gap:6px;}
        .mil-track{flex:1;height:6px;background:#f3f4f6;border-radius:3px;overflow:hidden;}
        .mil-fill{height:100%;border-radius:3px;}
        .mil-count{font-size:11px;font-weight:600;white-space:nowrap;}
        .mil-acts{margin-top:10px;}
        .mil-act-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
        .mil-act-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;}
        .mil-act-row{display:flex;align-items:center;gap:8px;font-size:11px;color:#374151;padding:3px 0;}
        .type-tag{font-size:9px;padding:1px 6px;border-radius:3px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;}
        .type-tag.participate{background:#e8f4e8;color:#2a6e2a;}
        .type-tag.assist{background:#eef1f9;color:${NAVY};}
        .type-tag.lead{background:#fef3e0;color:#92600a;}
        .peak-card{border:2px solid ${acc};border-radius:10px;padding:14px;margin-top:14px;background:${pale};}
        .peak-title{font-size:14px;font-weight:700;color:#111827;margin-bottom:4px;}
        .peak-req{font-size:12px;color:#6b7280;margin-bottom:8px;line-height:1.5;}
        .peak-check-row{display:flex;align-items:center;gap:7px;font-size:12px;color:#374151;margin-bottom:4px;}
        .peak-check{width:15px;height:15px;border-radius:50%;border:1.5px solid;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;}
        .peak-check.done{background:#2a6e2a;border-color:#2a6e2a;color:#fff;}
        .peak-check.pending{border-color:#d1d5db;color:transparent;}

        /* Mil form */
        .mil-form{background:#f9fafb;border-top:1px solid #f3f4f6;padding:10px 14px;}
        .mil-form-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;}

        /* Empty states */
        .empty{text-align:center;padding:32px;color:#9ca3af;}
        .empty-icon{font-size:28px;margin-bottom:8px;}
        .empty-title{font-size:14px;font-weight:500;color:#374151;margin-bottom:4px;}
        .empty-desc{font-size:12px;}

        @media(max-width:640px){
          .stats{grid-template-columns:repeat(2,1fr);}
          .member-row,.member-header{grid-template-columns:34px 1fr 70px auto;}
          .oas-grid{grid-template-columns:repeat(2,1fr);}
          .mil-bars{grid-template-columns:1fr;}
          .add-grid{grid-template-columns:1fr 1fr;}
          .sia-form-grid{grid-template-columns:1fr;}
          .mil-form-grid{grid-template-columns:1fr 1fr;}
        }
      `}</style>

      <nav className="nav">
        <div className="nav-l">
          <div className="nav-dot">⚜</div>
          <span className="nav-title">Scout Program Builder</span>
        </div>
        <div className="nav-l" style={{gap:'8px'}}>
          {config && <span className="nav-tag">{config.section}</span>}
          {config && <span className="nav-group">{config.groupName}</span>}
        </div>
        <button className="nav-btn" onClick={()=>router.push('/setup')}>⚙ Settings</button>
      </nav>

      <div className="ph">
        <div className="bc">Home › Members</div>
        <div className="ph-title">Members</div>
        <div className="ph-sub">{config?.groupName} · {section}</div>
        <div className="tabs">
          <div className="tab" onClick={()=>router.push('/term')}>Term plan</div>
          <div className="tab" onClick={()=>router.push('/term')}>Run sheets</div>
          <div className="tab on">Members</div>
        </div>
      </div>

      <div className="body">

        {/* Stats */}
        <div className="stats">
          <div className="stat">
            <div className="stat-val">{members.length}</div>
            <div className="stat-label">Total members</div>
          </div>
          <div className="stat">
            <div className="stat-val">{avgAttendance}%</div>
            <div className="stat-label">Avg attendance</div>
            <div className="stat-sub">{sessions.length} sessions this term</div>
          </div>
          <div className="stat">
            <div className="stat-val">{totalOAS}</div>
            <div className="stat-label">OAS stages earned</div>
            <div className="stat-sub">across all members</div>
          </div>
          <div className="stat">
            <div className="stat-val">{totalSIA}</div>
            <div className="stat-label">SIA projects complete</div>
          </div>
        </div>

        {/* Sub-tabs */}
        {view !== 'profile' && (
          <div className="sub-tabs">
            <button className={`sub-tab ${view==='list'?'on':''}`} onClick={()=>setView('list')}>
              👥 Members
            </button>
            <button className={`sub-tab ${view==='attendance'?'on':''}`} onClick={()=>setView('attendance')}>
              ✓ Attendance
            </button>
          </div>
        )}

        {/* ── MEMBER LIST ── */}
        {view === 'list' && (
          <div className="card">
            <div className="card-head">
              <div className="card-title">Members — {section}</div>
              <button className="btn-pri" onClick={()=>setShowAddForm(s=>!s)}>
                {showAddForm ? 'Cancel' : '+ Add member'}
              </button>
            </div>

            {showAddForm && (
              <div className="add-form">
                <div className="add-grid">
                  <div>
                    <div className="af-label">First name</div>
                    <input className="af-input" value={addDraft.firstName} onChange={e=>setAddDraft(d=>({...d,firstName:e.target.value}))} placeholder="e.g. Lily"/>
                  </div>
                  <div>
                    <div className="af-label">Last name</div>
                    <input className="af-input" value={addDraft.lastName} onChange={e=>setAddDraft(d=>({...d,lastName:e.target.value}))} placeholder="e.g. Mitchell"/>
                  </div>
                  <div>
                    <div className="af-label">Age</div>
                    <input className="af-input" type="number" min="4" max="18" value={addDraft.age} onChange={e=>setAddDraft(d=>({...d,age:e.target.value}))} placeholder="7"/>
                  </div>
                  <div>
                    <div className="af-label">Year joined</div>
                    <input className="af-input" type="number" min="2000" max="2030" value={addDraft.yearJoined} onChange={e=>setAddDraft(d=>({...d,yearJoined:e.target.value}))}/>
                  </div>
                </div>
                <div className="af-actions">
                  <button className="btn-pri" onClick={addMember}>Add member</button>
                  <button className="btn-sec" onClick={()=>setShowAddForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {members.length === 0 && !showAddForm && (
              <div className="empty">
                <div className="empty-icon">👥</div>
                <div className="empty-title">No members yet</div>
                <div className="empty-desc">Add your {section} members to track attendance and OAS progress</div>
              </div>
            )}

            {members.length > 0 && (
              <>
                <div className="member-header">
                  <div/>
                  <div className="col-label">Name</div>
                  <div className="col-label">Attendance</div>
                  <div className="col-label">Milestones</div>
                  <div className="col-label">OAS / SIA</div>
                  <div className="col-label">Profile</div>
                  <div/>
                </div>
                {members.map((m,idx)=>{
                  const pct = calcAttendancePct(m, rows);
                  const pctColour = pct>=80?'#6BBF5A':pct>=60?'#C17F24':'#B5485E';
                  const oasEarned = Object.values(m.oas).filter(v=>v>0).length;
                  const siaComplete = m.sia.filter(s=>s.status==='complete').length;
                  const milestonesCount = m.milestonesAwarded.length;
                  return (
                    <div key={m.id} className="member-row">
                      <div className="avatar" style={{background:avatarColour(idx,acc)}}>{initials(m)}</div>
                      <div>
                        <div className="m-name">{m.firstName} {m.lastName}</div>
                        <div className="m-meta">Age {m.age} · Joined {m.yearJoined}</div>
                      </div>
                      <div className="attend-wrap">
                        <div className="attend-pct" style={{color:pctColour}}>{pct}%</div>
                        <div className="attend-bar">
                          <div className="attend-fill" style={{width:`${pct}%`,background:pctColour}}/>
                        </div>
                      </div>
                      <div>
                        {milestonesCount > 0
                          ? <span style={{fontSize:'12px',color:acc,fontWeight:500}}>M{milestonesCount} {m.peakAwarded?'+ Peak':''}</span>
                          : <span style={{fontSize:'12px',color:'#d1d5db'}}>None yet</span>
                        }
                      </div>
                      <div>
                        <div className="oas-mini" style={{marginBottom:'3px'}}>
                          {OAS_STREAMS.slice(0,6).map(s=>(
                            <div key={s} className="oas-dot" style={{background:m.oas[s]>0?acc:'#e5e7eb'}} title={`${s}: Stage ${m.oas[s]||0}`}/>
                          ))}
                        </div>
                        <div className="sia-count">{oasEarned} OAS · {siaComplete} SIA</div>
                      </div>
                      <button className="view-btn" onClick={()=>{setSelectedId(m.id);setView('profile');}}>View →</button>
                      <button className="btn-danger" onClick={()=>deleteMember(m.id)}>🗑</button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── ATTENDANCE GRID ── */}
        {view === 'attendance' && (
          <div className="card">
            <div className="card-head">
              <div className="card-title">Attendance — {config?.groupName}</div>
              <span style={{fontSize:'11px',color:'#9ca3af'}}>{sessions.length} sessions · click to mark present</span>
            </div>
            {sessions.length === 0 && (
              <div className="empty">
                <div className="empty-icon">📅</div>
                <div className="empty-title">No sessions yet</div>
                <div className="empty-desc">Generate dates on the term plan page first</div>
              </div>
            )}
            {members.length === 0 && sessions.length > 0 && (
              <div className="empty">
                <div className="empty-icon">👥</div>
                <div className="empty-title">No members added yet</div>
                <div className="empty-desc">Add members in the Members tab first</div>
              </div>
            )}
            {members.length > 0 && sessions.length > 0 && (
              <div className="att-wrap">
                <table className="att-table" style={{width:'100%'}}>
                  <thead>
                    <tr>
                      <th style={{width:'130px'}}>Member</th>
                      {sessions.map(s=>(
                        <th key={s.id} style={{textAlign:'center',minWidth:'70px'}}>
                          {s.date.split(' ').slice(1).join(' ')}
                        </th>
                      ))}
                      <th className="dark" style={{textAlign:'center'}}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m,idx)=>{
                      const attended = sessions.filter(s=>m.attendance[s.id]).length;
                      const pct = sessions.length ? Math.round((attended/sessions.length)*100) : 0;
                      const pctColour = pct>=80?'#6BBF5A':pct>=60?'#C17F24':'#B5485E';
                      return (
                        <tr key={m.id}>
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                              <div className="avatar" style={{width:'26px',height:'26px',fontSize:'10px',background:avatarColour(idx,acc)}}>{initials(m)}</div>
                              <div>
                                <div className="m-name-cell">{m.firstName} {m.lastName[0]}.</div>
                              </div>
                            </div>
                          </td>
                          {sessions.map(s=>(
                            <td key={s.id} style={{textAlign:'center'}}>
                              <div
                                className={`check-box ${m.attendance[s.id]?'on':''}`}
                                style={{margin:'0 auto'}}
                                onClick={()=>toggleAttendance(m.id, s.id)}
                              >
                                {m.attendance[s.id]?'✓':''}
                              </div>
                            </td>
                          ))}
                          <td style={{textAlign:'center'}}>
                            <div className="att-total" style={{color:pctColour}}>{attended}/{sessions.length}</div>
                            <div style={{fontSize:'10px',color:pctColour}}>{pct}%</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE VIEW ── */}
        {view === 'profile' && selected && (
          <>
            <button className="back-link" onClick={()=>{setView('list');setSelectedId(null);}}>
              ← Back to members
            </button>

            {/* Profile header */}
            <div className="profile-head">
              <div className="profile-avatar" style={{background:avatarColour(members.indexOf(selected),acc)}}>
                {initials(selected)}
              </div>
              <div style={{flex:1}}>
                <div className="profile-name">{selected.firstName} {selected.lastName}</div>
                <div className="profile-meta">Age {selected.age} · Joined {selected.yearJoined} · {section}</div>
                <div className="profile-stats">
                  {[
                    {label:'Attendance', val:`${calcAttendancePct(selected,rows)}%`},
                    {label:'OAS stages', val:Object.values(selected.oas).filter(v=>v>0).length},
                    {label:'SIA complete', val:selected.sia.filter(s=>s.status==='complete').length},
                    {label:'Milestones', val:selected.milestonesAwarded.length},
                  ].map(s=>(
                    <div key={s.label} className="ps-item">
                      <span className="ps-val">{s.val}</span> {s.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* OAS Tracker */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">OAS — Outdoor Adventure Skills</div>
                <span style={{fontSize:'11px',color:'#9ca3af'}}>Click stages to mark earned</span>
              </div>
              <div className="oas-grid">
                {OAS_STREAMS.map(stream=>(
                  <div key={stream} className="oas-stream">
                    <div className="oas-stream-name">{stream}</div>
                    <div className="oas-stages">
                      {[1,2,3,4,5].map(stage=>(
                        <button
                          key={stage}
                          className={`stage-btn ${(selected.oas[stream]||0)>=stage?'earned':''}`}
                          onClick={()=>toggleOAS(selected.id, stream, stage)}
                          title={`Stage ${stage}`}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SIA Log */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">SIA — Special Interest Areas</div>
                <button className="btn-pri" onClick={()=>setShowSIAForm(s=>!s)}>
                  {showSIAForm ? 'Cancel' : '+ Add project'}
                </button>
              </div>
              {showSIAForm && (
                <div className="sia-form">
                  <div className="sia-form-grid">
                    <div>
                      <div className="af-label">Category</div>
                      <select className="af-input" value={addSIA.category} onChange={e=>setAddSIA(d=>({...d,category:e.target.value}))}>
                        {SIA_CATEGORIES.map(c=>(
                          <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="af-label">Project name</div>
                      <input className="af-input" value={addSIA.projectName} onChange={e=>setAddSIA(d=>({...d,projectName:e.target.value}))} placeholder="e.g. Learn to ride a bike"/>
                    </div>
                    <div>
                      <div className="af-label">Status</div>
                      <select className="af-input" value={addSIA.status} onChange={e=>setAddSIA(d=>({...d,status:e.target.value}))}>
                        <option value="planning">Planning</option>
                        <option value="in-progress">In progress</option>
                        <option value="complete">Complete</option>
                      </select>
                    </div>
                    <div>
                      <div className="af-label">Notes</div>
                      <input className="af-input" value={addSIA.notes} onChange={e=>setAddSIA(d=>({...d,notes:e.target.value}))} placeholder="Any notes..."/>
                    </div>
                  </div>
                  <div className="af-actions">
                    <button className="btn-pri" onClick={()=>addSIAEntry(selected.id)}>Add project</button>
                    <button className="btn-sec" onClick={()=>setShowSIAForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <div className="sia-list">
                {selected.sia.length === 0 && (
                  <div className="empty">
                    <div className="empty-icon">🌟</div>
                    <div className="empty-title">No SIA projects yet</div>
                    <div className="empty-desc">Add special interest projects for {selected.firstName}</div>
                  </div>
                )}
                {selected.sia.map((s,i)=>{
                  const cat = SIA_CATEGORIES.find(c=>c.id===s.category);
                  return (
                    <div key={i} className="sia-item">
                      <div className="sia-icon">{cat?.icon||'⭐'}</div>
                      <div className="sia-body">
                        <div>
                          <span className="sia-name">{s.projectName}</span>
                          <span className={`sia-status ${s.status}`}>{s.status.replace('-',' ')}</span>
                        </div>
                        <div className="sia-cat">{cat?.label}</div>
                        {s.notes && <div className="sia-notes">{s.notes}</div>}
                        {s.dateCompleted && <div className="sia-notes">Completed: {s.dateCompleted}</div>}
                        <div className="sia-actions">
                          {s.status!=='complete' && <button className="btn-sm" onClick={()=>updateSIAStatus(selected.id,i,'in-progress')}>In progress</button>}
                          {s.status!=='complete' && <button className="btn-sm" style={{borderColor:acc,color:acc}} onClick={()=>updateSIAStatus(selected.id,i,'complete')}>Mark complete</button>}
                          <button className="btn-danger" onClick={()=>deleteSIA(selected.id,i)}>🗑</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestone Tracker */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Milestones</div>
                <button className="btn-pri" onClick={()=>setShowMilForm(s=>!s)}>
                  {showMilForm ? 'Cancel' : '+ Log activity'}
                </button>
              </div>
              {showMilForm && (
                <div className="mil-form">
                  <div className="mil-form-grid">
                    <div>
                      <div className="af-label">Session</div>
                      <select className="af-input" value={addMilAct.sessionId} onChange={e=>setAddMilAct(d=>({...d,sessionId:e.target.value}))}>
                        <option value="">Select session…</option>
                        {sessions.map(s=>(
                          <option key={s.id} value={s.id}>{s.date} — {s.topic||'No topic'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="af-label">Challenge area</div>
                      <select className="af-input" value={addMilAct.challengeArea} onChange={e=>setAddMilAct(d=>({...d,challengeArea:e.target.value}))}>
                        {CHALLENGE_AREAS.map(a=><option key={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="af-label">Type</div>
                      <select className="af-input" value={addMilAct.type} onChange={e=>setAddMilAct(d=>({...d,type:e.target.value}))}>
                        <option value="participate">Participate</option>
                        <option value="assist">Assist</option>
                        <option value="lead">Lead</option>
                      </select>
                    </div>
                  </div>
                  <div className="af-actions">
                    <button className="btn-pri" onClick={()=>addMilestoneActivity(selected.id)}>Log activity</button>
                    <button className="btn-sec" onClick={()=>setShowMilForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <div className="milestone-list">
                {MILESTONES.map(mil=>{
                  const prog = calcMilestoneProgress(selected, mil.id);
                  const awarded = selected.milestonesAwarded.includes(mil.id);
                  const acts = selected.milestoneActivities;
                  return (
                    <div key={mil.id} className="milestone-item" style={awarded?{borderColor:acc,background:pale}:{}}>
                      <div className="mil-head">
                        <div className="mil-label">{mil.label}</div>
                        <label className="mil-awarded" style={{cursor:'pointer'}}>
                          <div className={`mil-check ${awarded?'on':''}`} onClick={()=>toggleMilestone(selected.id,mil.id)}>
                            {awarded?'✓':''}
                          </div>
                          {awarded ? 'Awarded ✓' : 'Mark as awarded'}
                        </label>
                      </div>
                      <div className="mil-bars">
                        {[
                          {label:`Participate (${mil.participate}× each area)`, val:prog.participate, max:mil.participate, colour:'#6BBF5A'},
                          {label:`Assist (${mil.assist}× any 2 areas)`, val:prog.assist, max:mil.assist, colour:'#2C3E6B'},
                          {label:`Lead (${mil.lead}× any area)`, val:prog.lead, max:mil.lead, colour:acc},
                        ].map(b=>(
                          <div key={b.label}>
                            <div className="mil-bar-label">{b.label}</div>
                            <div className="mil-progress">
                              <div className="mil-track">
                                <div className="mil-fill" style={{width:`${Math.min(100,(b.val/b.max)*100)}%`,background:b.colour}}/>
                              </div>
                              <div className="mil-count" style={{color:b.val>=b.max?b.colour:'#9ca3af'}}>{b.val}/{b.max}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {acts.length > 0 && (
                        <div className="mil-acts">
                          <div className="mil-act-label">Logged activities</div>
                          {acts.slice(-5).map((a,i)=>(
                            <div key={i} className="mil-act-row">
                              <span className={`type-tag ${a.type}`}>{a.type}</span>
                              <span>{a.challengeArea}</span>
                              <span style={{color:'#9ca3af'}}>· {a.sessionDate}</span>
                            </div>
                          ))}
                          {acts.length > 5 && <div style={{fontSize:'11px',color:'#9ca3af',marginTop:'3px'}}>+{acts.length-5} more</div>}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Peak award */}
                <div className="peak-card">
                  <div className="peak-title">⭐ {peakAward}</div>
                  <div className="peak-req">
                    Complete all three milestones plus the following requirements:
                  </div>
                  {[
                    {label:'Milestone 3 complete', done: selected.milestonesAwarded.includes('m3')},
                    {label:'OAS Stage 1 — Bushcraft', done: (selected.oas['Bushcraft']||0)>=1},
                    {label:'OAS Stage 1 — Bushwalking', done: (selected.oas['Bushwalking']||0)>=1},
                    {label:'OAS Stage 1 — Camping', done: (selected.oas['Camping']||0)>=1},
                    {label:'6 SIA projects complete', done: selected.sia.filter(s=>s.status==='complete').length>=6},
                    {label:'Adventurous Journey', done: false},
                    {label:'Personal Reflection', done: false},
                  ].map((req,i)=>(
                    <div key={i} className="peak-check-row">
                      <div className={`peak-check ${req.done?'done':'pending'}`}>{req.done?'✓':''}</div>
                      <span style={{color:req.done?'#2a6e2a':'#374151',textDecoration:req.done?'none':'none'}}>{req.label}</span>
                    </div>
                  ))}
                  <div style={{marginTop:'10px'}}>
                    <label style={{display:'flex',alignItems:'center',gap:'7px',cursor:'pointer',fontSize:'12px',fontWeight:500,color:selected.peakAwarded?'#2a6e2a':'#374151'}}>
                      <div className={`mil-check ${selected.peakAwarded?'on':''}`}
                        style={selected.peakAwarded?{background:acc,borderColor:acc}:{}}
                        onClick={()=>saveMembers(members.map(m=>m.id===selected.id?{...m,peakAwarded:!m.peakAwarded}:m))}>
                        {selected.peakAwarded?'✓':''}
                      </div>
                      {peakAward} awarded
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
