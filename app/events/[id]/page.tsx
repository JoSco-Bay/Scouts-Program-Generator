"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SECTION_COLOURS, NAVY } from "@/lib/colours";
import type { GroupConfig, EventData, EventDayDetails, TermRow } from "@/lib/types";
import { loadGroupRecord } from "@/lib/db";
import { loadEvent, saveEvent } from "@/lib/events";

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'long'});
}

function getDaysBetween(startIso: string, endIso: string): {date:Date; label:string}[] {
  const days: {date:Date; label:string}[] = [];
  const cur = new Date(startIso);
  const end = new Date(endIso);
  while (cur <= end) {
    days.push({ date: new Date(cur), label: formatDayLabel(cur) });
    cur.setDate(cur.getDate()+1);
  }
  return days;
}

function defaultDayDetails(event: EventData, dayNumber: number): EventDayDetails {
  return {
    topic: `${event.eventName} — Day ${dayNumber}`,
    location: event.location,
    oasFocus: event.oasFocus,
    sessionNotes: event.notes,
    time: '',
    bring: '',
  };
}

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('en-AU',{month:'short'});
  const endMonth = end.toLocaleDateString('en-AU',{month:'short'});
  if (startIso === endIso) return `${startDay} ${startMonth}`;
  if (startMonth === endMonth) return `${startDay}–${endDay} ${endMonth}`;
  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

export default function EventPlannerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id as string;

  const [config, setConfig]   = useState<GroupConfig|null>(null);
  const [event, setEvent]     = useState<EventData|null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    async function load() {
      const grp = await loadGroupRecord('');
      if (grp) {
        setConfig(grp.config);
      } else {
        const cached = localStorage.getItem('groupConfig');
        if (cached) try { setConfig(JSON.parse(cached)); } catch {}
      }
      setEvent(loadEvent(id));
      setDbLoading(false);
    }
    load();
  }, [id]);

  const sc  = config ? SECTION_COLOURS[config.section] || SECTION_COLOURS.Joeys : SECTION_COLOURS.Joeys;
  const acc = sc.accent;

  const updateField = (field: keyof EventData, value: string) => {
    setEvent(e => {
      if (!e) return e;
      const next = {...e, [field]: value};
      saveEvent(next);
      return next;
    });
  };

  const days = event ? getDaysBetween(event.startDate, event.endDate) : [];
  const dayDetails = event ? (event.days?.[activeDay+1] ?? defaultDayDetails(event, activeDay+1)) : null;

  // Updates local state immediately (so typing feels responsive) without persisting —
  // persistence happens on blur via commitDay, matching the term plan's edit pattern.
  const updateDayField = (dayNumber: number, field: keyof EventDayDetails, value: string) => {
    setEvent(e => {
      if (!e) return e;
      const current = e.days?.[dayNumber] ?? defaultDayDetails(e, dayNumber);
      return {...e, days: {...(e.days||{}), [dayNumber]: {...current, [field]: value}}};
    });
  };
  const commitDay = () => { if (event) saveEvent(event); };

  const openDayRunSheet = (dayNumber: number, dayDate: Date) => {
    if (!event) return;
    const details = event.days?.[dayNumber] ?? defaultDayDetails(event, dayNumber);
    const dayRow: TermRow = {
      id: `${event.id}-day-${dayNumber}`,
      date: formatDayLabel(dayDate),
      time: details.time,
      topic: details.topic,
      location: details.location,
      oasFocus: details.oasFocus,
      sessionNotes: details.sessionNotes,
      bring: details.bring,
      leader: event.leader,
      assistantPatrol: '',
      coLeaders: event.coLeaders,
      guestLeaders: event.guestLeaders,
      helperParents: event.helperParents,
      consentRequired: event.consentRequired,
      rowType: 'extra',
    };
    const multiDayInfo = { eventName: event.eventName, dayNumber, totalDays: days.length, location: details.location || event.location };
    localStorage.setItem('runSheetSource', JSON.stringify({ row: dayRow, config, isTermRow: false, multiDayInfo }));
    router.push('/runsheet');
  };

  if (dbLoading) return null;

  if (!event) {
    return (
      <>
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
          body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
          .empty-wrap{max-width:480px;margin:80px auto;text-align:center;padding:0 24px;}
          .empty-icon{font-size:36px;margin-bottom:12px;}
          .empty-title{font-size:16px;font-weight:600;margin-bottom:6px;}
          .empty-desc{font-size:13px;color:#6b7280;margin-bottom:18px;line-height:1.5;}
          .back-link{font-size:13px;padding:8px 16px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;font-family:inherit;color:#374151;}
        `}</style>
        <div className="empty-wrap">
          <div className="empty-icon">🏕</div>
          <div className="empty-title">Event not found</div>
          <div className="empty-desc">This event may have been deleted, or you&apos;re on a different device that doesn&apos;t have it saved locally.</div>
          <button className="back-link" onClick={()=>router.push('/term')}>← Back to term plan</button>
        </div>
      </>
    );
  }

  return (
    <>
      <style key={acc}>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
        .nav{background:${NAVY};height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
        .nav-l{display:flex;align-items:center;gap:10px;}
        .nav-dot{width:28px;height:28px;border-radius:50%;background:${acc};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;}
        .nav-title{color:#fff;font-size:15px;font-weight:500;}
        .nav-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);padding:5px 11px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;}
        .ph{background:#fff;border-bottom:1px solid #e5e7eb;padding:18px 24px;}
        .bc{font-size:11px;color:#9ca3af;margin-bottom:7px;}
        .ph-title{color:#111827;font-size:22px;font-weight:700;letter-spacing:-0.02em;margin-bottom:3px;}
        .ph-sub{color:#6b7280;font-size:13px;}
        .body{max-width:820px;margin:0 auto;padding:20px 24px 60px;}
        .card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:16px;overflow:hidden;}
        .card-head{padding:13px 18px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#111827;}
        .card-body{padding:16px 18px;}
        .staff-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .field{display:flex;flex-direction:column;gap:4px;}
        .field label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;}
        .field input,.field textarea{border:1px solid #d1d5db;border-radius:6px;padding:8px 10px;font-size:13px;color:#111827;font-family:inherit;outline:none;}
        .field input:focus,.field textarea:focus{border-color:${acc};}
        .field textarea{resize:vertical;min-height:70px;line-height:1.5;}
        .day-tabs{display:flex;flex-wrap:wrap;gap:4px;padding:12px 14px;border-bottom:1px solid #f3f4f6;background:#fafaf9;}
        .day-tab{font-size:12px;padding:7px 14px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;cursor:pointer;font-family:inherit;font-weight:500;}
        .day-tab:hover{border-color:${acc};color:${acc};}
        .day-tab.on{background:${acc};border-color:${acc};color:#fff;}
        .day-panel{padding:20px 18px;}
        .day-panel-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;}
        .day-panel-date{font-size:14px;font-weight:600;color:#111827;}
        .day-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;}
        .create-btn{font-size:13px;padding:9px 20px;border-radius:6px;border:none;background:${acc};color:#fff;cursor:pointer;font-family:inherit;font-weight:600;white-space:nowrap;}
        .create-btn:hover{opacity:0.9;}
        @media (max-width:640px){ .staff-grid{grid-template-columns:1fr;} .day-fields{grid-template-columns:1fr;} }
      `}</style>

      <nav className="nav">
        <div className="nav-l">
          <div className="nav-dot">⚜</div>
          <span className="nav-title">Scout Program Builder</span>
        </div>
        <button className="nav-btn" onClick={()=>router.push('/term')}>← Term plan</button>
      </nav>

      <div className="ph">
        <div className="bc">Home › Term Plans › {event.eventName}</div>
        <div className="ph-title">{event.eventName}</div>
        <div className="ph-sub">{formatDateRange(event.startDate, event.endDate)}{event.location ? ` · ${event.location}` : ''}{event.consentRequired ? ' · ⚠ Consent required' : ''}</div>
      </div>

      <div className="body">
        <div className="card">
          <div className="card-head">Staffing</div>
          <div className="card-body">
            <div className="staff-grid">
              <div className="field">
                <label>Leader</label>
                <input value={event.leader} onChange={e=>updateField('leader', e.target.value)} placeholder="Event leader"/>
              </div>
              <div className="field">
                <label>Co-leaders</label>
                <input value={event.coLeaders} onChange={e=>updateField('coLeaders', e.target.value)} placeholder="Names, comma-separated"/>
              </div>
              <div className="field">
                <label>Guest / Region leaders</label>
                <input value={event.guestLeaders} onChange={e=>updateField('guestLeaders', e.target.value)} placeholder="Names not in the regular leader list"/>
              </div>
              <div className="field">
                <label>Helper parents</label>
                <input value={event.helperParents} onChange={e=>updateField('helperParents', e.target.value)} placeholder="Names of parents helping out"/>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="day-tabs">
            {days.map((d,i)=>(
              <button key={i} className={`day-tab ${activeDay===i?'on':''}`} onClick={()=>setActiveDay(i)}>
                Day {i+1} · {d.label}
              </button>
            ))}
          </div>
          {days[activeDay] && dayDetails && (
            <div className="day-panel">
              <div className="day-panel-head">
                <div className="day-panel-date">Day {activeDay+1} — {days[activeDay].label}</div>
                <button className="create-btn" onClick={()=>openDayRunSheet(activeDay+1, days[activeDay].date)}>Create run sheet</button>
              </div>
              <div className="day-fields">
                <div className="field">
                  <label>Topic / theme</label>
                  <input value={dayDetails.topic} onChange={e=>updateDayField(activeDay+1,'topic',e.target.value)} onBlur={commitDay}/>
                </div>
                <div className="field">
                  <label>Location (within event)</label>
                  <input value={dayDetails.location} onChange={e=>updateDayField(activeDay+1,'location',e.target.value)} onBlur={commitDay} placeholder="e.g. Main campsite"/>
                </div>
                <div className="field">
                  <label>Start time</label>
                  <input value={dayDetails.time} onChange={e=>updateDayField(activeDay+1,'time',e.target.value)} onBlur={commitDay} placeholder="e.g. 7:00am"/>
                </div>
              </div>
              <div className="day-fields">
                <div className="field">
                  <label>OAS focus</label>
                  <input value={dayDetails.oasFocus} onChange={e=>updateDayField(activeDay+1,'oasFocus',e.target.value)} onBlur={commitDay} placeholder="e.g. Camping S2"/>
                </div>
                <div className="field" style={{gridColumn:'span 2'}}>
                  <label>Bring items</label>
                  <input value={dayDetails.bring} onChange={e=>updateDayField(activeDay+1,'bring',e.target.value)} onBlur={commitDay} placeholder="e.g. Swimmers, sunscreen, water bottle"/>
                </div>
              </div>
              <div className="field">
                <label>Session notes — context for AI run sheet generation</label>
                <textarea value={dayDetails.sessionNotes} onChange={e=>updateDayField(activeDay+1,'sessionNotes',e.target.value)} onBlur={commitDay}
                  placeholder="e.g. Focus on knot-tying in the morning, free swim after lunch."/>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
