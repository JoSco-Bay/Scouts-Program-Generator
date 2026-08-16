"use client";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
        .nav{background:#2C3E6B;height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
        .nav-l{display:flex;align-items:center;gap:9px;text-decoration:none;}
        .nav-dot{width:28px;height:28px;background:#C17F24;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0;}
        .nav-title{color:#fff;font-size:15px;font-weight:500;}
        .nav-cta{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);color:#fff;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:500;text-decoration:none;transition:background 0.2s;}
        .nav-cta:hover{background:rgba(255,255,255,0.22);}
        .hero{background:#fff;border-bottom:1px solid #e5e7eb;padding:64px 24px 72px;text-align:center;}
        .hero-badge{display:inline-flex;align-items:center;gap:7px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:20px;padding:5px 16px;font-size:12px;color:#6b7280;margin-bottom:24px;letter-spacing:0.02em;}
        .hero-title{font-size:clamp(38px,7vw,64px);font-weight:700;color:#111827;line-height:1.0;letter-spacing:-0.03em;margin-bottom:18px;}
        .hero-title em{font-style:italic;font-weight:400;color:#C17F24;}
        .hero-desc{font-size:17px;color:#6b7280;max-width:500px;margin:0 auto 36px;line-height:1.7;}
        .hero-disclaimer{font-size:12px;color:#9ca3af;max-width:520px;margin:-24px auto 36px;line-height:1.6;}
        .hero-btns{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;}
        .btn-pri{display:inline-flex;align-items:center;gap:8px;background:#C17F24;color:#fff;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;transition:opacity 0.2s;}
        .btn-pri:hover{opacity:0.9;}
        .btn-sec{display:inline-flex;align-items:center;gap:6px;border:1px solid #d1d5db;color:#374151;padding:13px 22px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;transition:all 0.2s;background:#fff;}
        .btn-sec:hover{border-color:#C17F24;color:#C17F24;}
        .sec-strip{background:#f9fafb;border-bottom:1px solid #e5e7eb;padding:14px 24px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;}
        .sec-strip-label{font-size:12px;color:#9ca3af;margin-right:2px;}
        .sp{padding:5px 14px;border-radius:16px;font-size:13px;font-weight:500;}
        .content{max-width:960px;margin:0 auto;padding:56px 24px 64px;}
        .section-eyebrow{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#C17F24;margin-bottom:10px;}
        .section-title{font-size:clamp(26px,4vw,36px);font-weight:700;color:#111827;letter-spacing:-0.02em;margin-bottom:36px;line-height:1.1;}
        .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:56px;}
        .step{background:#fff;border-radius:10px;border:1px solid #e5e7eb;padding:26px;transition:border-color 0.2s,transform 0.2s;}
        .step:hover{border-color:#C17F24;transform:translateY(-2px);}
        .step-n{font-size:30px;font-weight:700;color:rgba(193,127,36,0.2);line-height:1;margin-bottom:10px;}
        .step-icon{font-size:24px;margin-bottom:10px;}
        .step-title{font-size:15px;font-weight:600;color:#111827;margin-bottom:6px;}
        .step-desc{font-size:13px;color:#6b7280;line-height:1.65;}
        .cta-strip{background:#2C3E6B;border-radius:12px;padding:44px 40px;text-align:center;margin:0 0 0;}
        .cta-strip h2{font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.02em;margin-bottom:8px;}
        .cta-strip p{color:rgba(255,255,255,0.6);font-size:15px;margin-bottom:24px;line-height:1.6;}
      `}</style>

      <nav className="nav">
        <Link href="/" className="nav-l">
          <div className="nav-dot">⚜</div>
          <span className="nav-title">Scout Program Builder</span>
        </Link>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <Link href="/help" className="nav-cta">? Help</Link>
          <Link href="/setup" className="nav-cta">Get started →</Link>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-badge">⚜ Youth Program Builder · Term Planner & Run Sheet Generator</div>
        <h1 className="hero-title">Plan every<br/><em>Scout meeting.</em></h1>
        <p className="hero-desc">Build a full term schedule and generate detailed, ready-to-run meeting programs — with timed activity sheets, OAS badge goals, equipment lists, and leader notes.</p>
        <p className="hero-disclaimer">Scout Program Builder is an independent planning tool and is not affiliated with, endorsed by, or associated with Scouts Australia or any official Scouts organisation. All Scouts Australia program framework references (OAS, milestones, challenge areas) are used for informational purposes only.</p>
        <div className="hero-btns">
          <Link href="/setup" className="btn-pri">Set up your group →</Link>
          <a href="#how" className="btn-sec">See how it works ↓</a>
        </div>
      </div>

      <div className="sec-strip">
        <span className="sec-strip-label">For all sections:</span>
        {[{l:'Joeys',bg:'#C17F24',c:'#fff'},{l:'Cubs',bg:'#E8B800',c:'#3d2800'},{l:'Scouts',bg:'#6BBF5A',c:'#fff'},{l:'Venturers',bg:'#B5485E',c:'#fff'}].map(s=>(
          <span key={s.l} className="sp" style={{background:s.bg,color:s.c}}>{s.l}</span>
        ))}
      </div>

      <div className="content" id="how">
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div className="section-eyebrow">How it works</div>
          <div className="section-title">Three steps to a complete term</div>
        </div>
        <div className="steps">
          {[
            {n:'01',icon:'⚙️',t:'Set up your group',d:'Enter your group name, section, meeting day and time, and leaders. Saved locally — ready for every plan you make.'},
            {n:'02',icon:'📅',t:'Build your term plan',d:'Enter your term dates and the app generates all your meeting dates. AI suggests themes and OAS goals, or type your own.'},
            {n:'03',icon:'📋',t:'Generate run sheets',d:'Click Create on any session to get a complete run sheet — timed activities, safety notes, equipment lists, and printable recipe or activity sheets.'},
          ].map(s=>(
            <div key={s.n} className="step">
              <div className="step-n">{s.n}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.t}</div>
              <p className="step-desc">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="cta-strip">
          <h2>Ready to plan your next term?</h2>
          <p>Set up your group and build your first term plan in under 5 minutes.</p>
          <Link href="/setup" className="btn-pri">Get started →</Link>
        </div>
      </div>
    </>
  );
}
