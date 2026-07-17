"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SECTION_COLOURS, NAVY } from "@/lib/colours";
import type { GroupConfig } from "@/lib/types";
import { loadGroupRecord, loadRunSheets } from "@/lib/db";
import type { RunSheetEntry } from "@/lib/db";

export default function RunSheetsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<GroupConfig|null>(null);
  const [sheets, setSheets] = useState<RunSheetEntry[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [grp, sheetData] = await Promise.all([
        loadGroupRecord(''),
        loadRunSheets(''),
      ]);
      if (grp) setConfig(grp.config);
      setSheets(
        sheetData.sort((a, b) => {
          const parts = (d: string) => d.split(' ').slice(-2).join(' ') + ' 2026';
          return Date.parse(parts(a.entry.row?.date || '')) - Date.parse(parts(b.entry.row?.date || ''));
        })
      );
      setDbLoading(false);
    }
    load();
  }, []);

  const acc  = config ? SECTION_COLOURS[config.section]?.accent||'#C17F24' : '#C17F24';
  const pale = config ? SECTION_COLOURS[config.section]?.pale||'rgba(193,127,36,0.07)' : 'rgba(193,127,36,0.07)';

  const viewSheet = (sheet: RunSheetEntry) => {
    localStorage.setItem('runSheetSource', JSON.stringify({
      row:          sheet.entry.row,
      config:       sheet.entry.config,
      runSheetDbId: sheet.dbId,
    }));
    router.push('/runsheet');
  };

  if (dbLoading) return null;

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
        .body{max-width:820px;margin:0 auto;padding:20px 24px 60px;}
        .rs-list{display:flex;flex-direction:column;gap:10px;}
        .rs-card{background:#fff;border-radius:10px;border:1px solid #e5e7eb;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;transition:box-shadow 0.15s;}
        .rs-card:hover{box-shadow:0 2px 10px rgba(0,0,0,0.06);}
        .rs-date{font-size:12px;color:#6b7280;margin-bottom:3px;}
        .rs-topic{font-size:15px;font-weight:600;color:#111827;margin-bottom:5px;}
        .rs-oas{display:inline-flex;align-items:center;gap:4px;font-size:11px;background:#eef1f9;color:${NAVY};border:1px solid #c5cedf;border-radius:3px;padding:2px 7px;}
        .view-btn{font-size:12px;padding:7px 16px;border-radius:6px;border:1px solid ${acc};color:${acc};background:transparent;cursor:pointer;font-family:inherit;font-weight:600;white-space:nowrap;flex-shrink:0;}
        .view-btn:hover{background:${pale};}
        .empty-state{text-align:center;padding:64px 0;color:#9ca3af;}
        .empty-icon{font-size:40px;margin-bottom:14px;}
        .empty-title{font-size:16px;font-weight:600;color:#374151;margin-bottom:6px;}
        .empty-desc{font-size:13px;line-height:1.6;}
        .empty-link{display:inline-block;margin-top:16px;font-size:13px;color:${acc};cursor:pointer;background:none;border:none;font-family:inherit;font-weight:500;}
        .empty-link:hover{text-decoration:underline;}
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
        <button className="nav-btn" onClick={()=>router.push('/help')}>? Help</button>
        <button className="nav-btn" onClick={()=>router.push('/term')}>← Term plan</button>
      </nav>

      <div className="ph">
        <div className="bc">Home › Term Plans › Run Sheets</div>
        <div className="ph-title">Run Sheets</div>
        <div className="ph-sub">{config?.meetingDay}s · {config?.groupName}</div>
        <div className="tabs">
          <div className="tab" onClick={()=>router.push('/term')}>Term plan</div>
          <div className="tab on">Run sheets</div>
          <div className="tab" onClick={()=>router.push('/members')}>Members</div>
        </div>
      </div>

      <div className="body">
        {sheets.length===0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No run sheets saved yet</div>
            <div className="empty-desc">Generate a run sheet from the Term plan to see it here.</div>
            <button className="empty-link" onClick={()=>router.push('/term')}>← Go to Term plan</button>
          </div>
        ) : (
          <div className="rs-list">
            {sheets.map(sheet=>(
              <div key={sheet.dbId} className="rs-card">
                <div>
                  <div className="rs-date">{sheet.entry.row?.date}{sheet.entry.row?.time?` · ${sheet.entry.row.time}`:''}</div>
                  <div className="rs-topic">{sheet.entry.row?.topic||'Untitled session'}</div>
                  {sheet.entry.row?.oasFocus&&<span className="rs-oas">⚜ {sheet.entry.row.oasFocus}</span>}
                </div>
                <button className="view-btn" onClick={()=>viewSheet(sheet)}>View →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
