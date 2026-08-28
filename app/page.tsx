"use client";
import Link from "next/link";
import { SECTION_COLOURS, NAVY } from "@/lib/colours";
import { useAuth } from "@/lib/auth-context";
import UserMenu from "@/components/UserMenu";

const SECTIONS = Object.entries(SECTION_COLOURS).map(([id, v]) => ({ id, ...v }));

const FEATURES = [
  {
    key: 'term',
    title: 'Term Planner',
    desc: 'Generate every meeting date for the term, then fill it in with themes, OAS focus areas and locations — AI can suggest a full term of topics in seconds.',
  },
  {
    key: 'runsheet',
    title: 'AI Run Sheets',
    desc: 'Turn any session into a complete, timed run sheet — activities, equipment lists, and safety notes, structured around Plan, Do, Review.',
  },
  {
    key: 'members',
    title: 'Member Tracking',
    desc: 'Attendance, OAS badge progress, SIA projects and milestone awards for every young person — updated automatically as you run your program.',
  },
];

const STEPS = [
  { n: '01', icon: '⚙️', t: 'Set up your group', d: 'Enter your group name, section, meeting day and time, and your leaders. It only takes a minute.' },
  { n: '02', icon: '📅', t: 'Build your term plan', d: 'Set your term dates and YouthPath lays out every meeting. Add themes yourself or let AI suggest a full term.' },
  { n: '03', icon: '📋', t: 'Generate run sheets', d: 'Turn any session into a ready-to-run program — timed activities, equipment, and safety notes included.' },
];

function TermPreview() {
  const rows = [
    { date: 'Wed 14 Oct', time: '6:00pm', topic: 'Knot Tying Night', location: 'Hall', tag: 'Bushcraft S1' },
    { date: 'Wed 21 Oct', time: '6:00pm', topic: 'Night Hike Adventure', location: 'Irrawong Reserve', tag: 'Bushcraft S1', consent: true, special: true, notes: 'Walk to the waterfall and see what is around at night' },
    { date: 'Wed 28 Oct', time: '6:00pm', topic: 'Fire Safety & Campfire', location: 'Hall', tag: 'Bushcraft S1' },
    { date: 'Wed 4 Nov', time: '6:00pm', topic: 'Navigation & Compass', location: 'Local Park', tag: 'Bushcraft S1' },
    { date: 'Wed 11 Nov', time: '6:00pm', topic: 'End of Term Celebration', location: 'Hall', tag: null },
  ];
  return (
    <div className="term-mini">
      <div className="tm-head">Term 4, 2026 · Wade · Wednesdays 6:00pm</div>
      <table className="tm-table">
        <thead>
          <tr><th>Date</th><th>Topic/Theme</th><th>Location</th><th>Focus/Notes</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.date} className={r.special ? 'special' : ''}>
              <td><div className="tm-dm">{r.date}</div><div className="tm-dt">{r.time}</div></td>
              <td>
                {r.topic}
                {r.consent && <div className="tm-ctag">⚠ Consent</div>}
              </td>
              <td>{r.location}</td>
              <td>
                {r.tag ? <span className="tm-otag">{r.tag}</span> : '—'}
                {r.notes && <div className="tm-notes">{r.notes}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RunSheetPreview() {
  const activities = [
    { time: '5:50pm', name: 'Coming-in Activity', detail: 'Joeys sort rope pieces into piles by how thick they are as they arrive. It’s a fun way to get settled and start thinking about knots. No instructions needed — just let them dig in!', tag: 'Bushcraft S1' },
    { time: '6:00pm', name: 'Opening Parade', detail: 'Flag ceremony and a big welcome to start the night. Tell the Joeys tonight is all about tying knots. Remind everyone to be gentle and careful with the rope.', tag: 'Bushcraft S1' },
    { time: '6:15pm', name: 'Knot Relay Race', detail: 'Split into small teams and race to tie a reef knot. Each Joey has a turn, then tags the next teammate. Lots of cheering — first team to finish all their knots wins!', tag: 'Bushcraft S1' },
    { time: '6:35pm', name: 'Activity: Half Hitch Practice', detail: 'Each Joey ties a half hitch around a tent peg or chair leg. Leader shows the motion — rope over, under, and through. Joeys practise until they can do it independently. Use pre-cut rope lengths (60cm). A half hitch is used to tie things to posts and is a practical everyday knot for camping.', tag: 'Bushcraft S1' },
    { time: '7:00pm', name: 'Optional Game: Tug of War', detail: 'A fun, energetic game using the knots from earlier. Two teams pull on a rope tied with a half hitch at each end. Joeys who’d rather not pull can be the referee instead.', tag: 'Bushcraft S1' },
    { time: '7:15pm', name: 'Closing Parade', detail: 'Sit in a circle and ask each Joey what knot they learned tonight. Give a cheer for anyone who tried something new. Lower the flag and remind everyone about next week.', tag: 'Bushcraft S1' },
  ];
  return (
    <div className="rs-mini">
      <div className="rs-head">
        <div className="rs-title">Knot Tying Night</div>
        <div className="rs-tagline">Master the essential Scout knots</div>
        <div className="rs-meta">Knot Tying Night · 1st Bayview Sea Scouts · Joeys · Wed 14 Oct</div>
      </div>
      <div className="rs-ca-row">
        {['Community', 'Outdoor', 'Creative', 'Personal'].map(a => (
          <span key={a} className={`rs-ca${['Outdoor', 'Creative'].includes(a) ? ' on' : ''}`}>{a}</span>
        ))}
      </div>
      <div className="rs-bar">Plan</div>
      <div className="rs-list">
        <div className="rs-item">☐ Set up knot stations</div>
        <div className="rs-item">☐ Prepare rope pieces</div>
      </div>
      <div className="rs-bar">Do — Run Sheet</div>
      {activities.map(a => (
        <div className="rs-act" key={a.time}>
          <span className="rs-time">{a.time}</span>
          <div>
            <div className="rs-name">{a.name}</div>
            <div className="rs-detail">{a.detail}</div>
            <span className="rs-tag">⚜ {a.tag}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MemberPreview() {
  const acc = SECTION_COLOURS.Joeys.accent;
  const text = SECTION_COLOURS.Joeys.text;
  const pale = SECTION_COLOURS.Joeys.pale;
  const oas = [
    { stream: 'Bushcraft', pct: 35 },
    { stream: 'Bushwalking', pct: 20 },
    { stream: 'Camping', pct: 20 },
    { stream: 'Aquatics', pct: 0 },
    { stream: 'Community', pct: 0 },
  ];
  return (
    <div className="mm-mini">
      <div className="mm-head">
        <div className="mm-avatar" style={{ background: acc, color: text }}>M</div>
        <div>
          <div className="mm-name">Marcus</div>
          <div className="mm-meta">14/16 sessions · 87% attendance</div>
        </div>
      </div>
      <div className="mm-oas">
        {oas.map(o => (
          <div className="mm-oas-row" key={o.stream}>
            <div className="mm-oas-label">{o.stream}</div>
            <div className="mm-track"><div className="mm-fill" style={{ width: `${o.pct}%`, background: acc }} /></div>
          </div>
        ))}
      </div>
      <div className="mm-milestones">
        <span className="mm-pill on" style={{ background: pale, color: acc }}>M1 ✓</span>
        <span className="mm-pill">M2 2/3</span>
      </div>
      <div className="mm-sia">
        <span className="mm-sia-tag">Karate ✓</span>
        <span className="mm-sia-tag">Fishing ✓</span>
        <span className="mm-sia-tag">Recycled Boat ✓</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#111827;}

        .nav{background:${NAVY};height:56px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
        .nav-l{display:flex;align-items:center;gap:9px;text-decoration:none;}
        .nav-dot{width:28px;height:28px;background:#C17F24;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0;}
        .nav-title{color:#fff;font-size:16px;font-weight:600;letter-spacing:-0.01em;}
        .nav-r{display:flex;gap:14px;align-items:center;}
        .nav-login{color:rgba(255,255,255,0.75);font-size:13px;font-weight:500;text-decoration:none;}
        .nav-login:hover{color:#fff;}
        .nav-cta{background:#C17F24;color:#fff;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;transition:opacity 0.2s;}
        .nav-cta:hover{opacity:0.9;}

        .hero{background:#fff;padding:88px 24px 80px;text-align:center;}
        .hero-badge{display:inline-flex;align-items:center;gap:7px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:20px;padding:5px 16px;font-size:12px;color:#6b7280;margin-bottom:28px;letter-spacing:0.02em;}
        .hero-title{font-size:clamp(36px,6vw,58px);font-weight:700;color:#111827;line-height:1.08;letter-spacing:-0.03em;margin-bottom:20px;}
        .hero-desc{font-size:18px;color:#6b7280;max-width:600px;margin:0 auto 40px;line-height:1.65;}
        .hero-btns{display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;}
        .btn-pri{display:inline-flex;align-items:center;gap:8px;background:#C17F24;color:#fff;padding:14px 30px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;transition:opacity 0.2s;}
        .btn-pri:hover{opacity:0.9;}
        .link-sec{font-size:14px;font-weight:600;color:${NAVY};text-decoration:none;}
        .link-sec:hover{text-decoration:underline;}

        .section{padding:72px 24px;max-width:1080px;margin:0 auto;}
        .section-alt{background:#f9fafb;}
        .section-head{text-align:center;margin-bottom:48px;}
        .section-eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#C17F24;margin-bottom:10px;}
        .section-title{font-size:clamp(26px,4vw,36px);font-weight:700;color:#111827;letter-spacing:-0.02em;line-height:1.15;}
        .section-sub{font-size:15px;color:#6b7280;max-width:560px;margin:12px auto 0;line-height:1.6;}

        .showcase-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:28px;align-items:start;}
        .showcase-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:22px;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .showcase-title{font-size:16px;font-weight:700;color:#111827;margin:16px 0 6px;}
        .showcase-desc{font-size:13.5px;color:#6b7280;line-height:1.6;margin-bottom:16px;}

        .term-mini,.rs-mini,.mm-mini{border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff;}

        .tm-head{background:#fff;border-bottom:1px solid #e5e7eb;border-left:4px solid #C17F24;color:#111827;font-size:11px;font-weight:600;padding:9px 12px;}
        .tm-table{width:100%;border-collapse:collapse;font-size:10.5px;}
        .tm-table thead tr{background:#C17F24;}
        .tm-table th{padding:6px 8px;text-align:left;font-size:8px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#fff;white-space:nowrap;}
        .tm-table td{padding:7px 8px;border-bottom:1px solid rgba(0,0,0,0.04);vertical-align:top;color:#111827;background:#FEF3DC;}
        .tm-dm{font-weight:600;font-size:10.5px;}
        .tm-dt{font-size:9px;color:#9ca3af;margin-top:1px;}
        .tm-otag{display:inline-block;font-size:9px;background:#eef1f9;color:${NAVY};border:1px solid #c5cedf;border-radius:3px;padding:1px 5px;white-space:nowrap;}
        .tm-table tr.special td{background:#fff;}
        .tm-ctag{display:inline-flex;align-items:center;gap:2px;font-size:8px;background:#fef9ec;color:#92600a;border:1px solid #f0cf80;border-radius:3px;padding:1px 5px;margin-top:3px;}
        .tm-notes{font-size:8.5px;color:#6b7280;line-height:1.4;margin-top:3px;}

        .rs-head{background:${NAVY};padding:11px 12px;}
        .rs-title{color:#fff;font-size:13px;font-weight:700;letter-spacing:-0.01em;}
        .rs-tagline{color:rgba(255,255,255,0.65);font-size:10px;font-style:italic;margin:2px 0 5px;}
        .rs-meta{color:rgba(255,255,255,0.5);font-size:9px;}
        .rs-ca-row{display:flex;gap:5px;padding:8px 12px;border-bottom:1px solid #f3f4f6;flex-wrap:wrap;}
        .rs-ca{padding:3px 9px;border-radius:12px;border:1.2px solid #e5e7eb;font-size:8.5px;font-weight:500;color:#9ca3af;}
        .rs-ca.on{border-color:#C17F24;background:rgba(193,127,36,0.07);color:#111827;}
        .rs-bar{background:#C17F24;color:#fff;font-size:8.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:5px 12px;}
        .rs-list{padding:7px 12px;}
        .rs-item{font-size:9.5px;color:#374151;padding:2px 0;}
        .rs-act{display:grid;grid-template-columns:42px 1fr;padding:9px 12px;border-bottom:1px solid #f3f4f6;gap:4px;}
        .rs-act:last-child{border-bottom:none;}
        .rs-time{font-size:10px;font-weight:600;color:#C17F24;}
        .rs-name{font-size:10.5px;font-weight:700;color:#111;}
        .rs-detail{font-size:9px;color:#6b7280;margin:1px 0 4px;}
        .rs-tag{display:inline-block;font-size:8px;padding:1px 5px;border-radius:3px;background:#eef1f9;color:${NAVY};border:1px solid #c5cedf;}

        .mm-head{display:flex;align-items:center;gap:9px;padding:11px 12px;border-bottom:1px solid #f3f4f6;}
        .mm-avatar{width:30px;height:30px;border-radius:50%;background:${NAVY};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
        .mm-name{font-size:12px;font-weight:700;color:#111827;}
        .mm-meta{font-size:9.5px;color:#6b7280;margin-top:1px;}
        .mm-oas{padding:10px 12px;}
        .mm-oas-row{margin-bottom:7px;}
        .mm-oas-row:last-child{margin-bottom:0;}
        .mm-oas-label{font-size:9px;color:#6b7280;font-weight:500;margin-bottom:3px;}
        .mm-track{height:6px;background:#f3f4f6;border-radius:3px;overflow:hidden;}
        .mm-fill{height:100%;border-radius:3px;}
        .mm-milestones{display:flex;gap:5px;flex-wrap:wrap;padding:0 12px 8px;}
        .mm-pill{font-size:9px;font-weight:600;padding:3px 9px;border-radius:10px;background:#f3f4f6;color:#6b7280;}
        .mm-pill.on{font-weight:700;}
        .mm-sia{display:flex;gap:5px;flex-wrap:wrap;padding:0 12px 12px;}
        .mm-sia-tag{font-size:8.5px;font-weight:600;padding:2px 8px;border-radius:10px;background:#e8f4e8;color:#2a6e2a;}

        .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;}
        .step{background:#fff;border-radius:10px;border:1px solid #e5e7eb;padding:26px;transition:border-color 0.2s,transform 0.2s;}
        .step:hover{border-color:#C17F24;transform:translateY(-2px);}
        .step-n{font-size:30px;font-weight:700;color:rgba(193,127,36,0.2);line-height:1;margin-bottom:10px;}
        .step-icon{font-size:24px;margin-bottom:10px;}
        .step-title{font-size:15px;font-weight:600;color:#111827;margin-bottom:6px;}
        .step-desc{font-size:13px;color:#6b7280;line-height:1.65;}

        .who-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;}
        .who-card{border-radius:12px;padding:24px;text-align:center;}
        .who-label{font-size:17px;font-weight:700;margin-bottom:4px;}
        .who-age{font-size:13px;opacity:0.85;}
        .who-note{text-align:center;font-size:13px;color:#9ca3af;margin-top:28px;}

        .cta-strip{background:${NAVY};border-radius:16px;padding:52px 40px;text-align:center;}
        .cta-strip h2{font-size:30px;font-weight:700;color:#fff;letter-spacing:-0.02em;margin-bottom:10px;}
        .cta-strip p{color:rgba(255,255,255,0.65);font-size:15px;margin-bottom:28px;line-height:1.6;}
      `}</style>

      <nav className="nav">
        <Link href="/" className="nav-l">
          <div className="nav-dot">⚜</div>
          <span className="nav-title">YouthPath</span>
        </Link>
        <div className="nav-r">
          {user ? (
            <>
              <Link href="/term" className="nav-login">Dashboard</Link>
              <UserMenu />
            </>
          ) : (
            <>
              <Link href="/auth" className="nav-login">Login</Link>
              <Link href="/auth?mode=signup" className="nav-cta">Sign up free</Link>
            </>
          )}
        </div>
      </nav>

      <div className="hero">
        <div className="hero-badge">⚜ Built for youth group leaders</div>
        <h1 className="hero-title">Plan. Track.<br/>Develop your youth group.</h1>
        <p className="hero-desc">
          YouthPath helps leaders plan a full term, generate ready-to-run session plans, and
          track every young person&apos;s progress — all in one place.
        </p>
        <div className="hero-btns">
          {user ? (
            <Link href="/term" className="btn-pri">Go to dashboard →</Link>
          ) : (
            <Link href="/auth?mode=signup" className="btn-pri">Sign up free →</Link>
          )}
          <Link href="/auth" className="link-sec">Login</Link>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-eyebrow">What you get</div>
          <h2 className="section-title">Everything you need to run a term</h2>
          <p className="section-sub">Three tools that work together — plan the term, generate the sessions, and track the results.</p>
        </div>
        <div className="showcase-grid">
          {FEATURES.map(f => (
            <div className="showcase-card" key={f.key}>
              {f.key === 'term' && <TermPreview />}
              {f.key === 'runsheet' && <RunSheetPreview />}
              {f.key === 'members' && <MemberPreview />}
              <div className="showcase-title">{f.title}</div>
              <p className="showcase-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section section-alt" id="how">
        <div className="section-head">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-title">Three steps to a complete term</h2>
        </div>
        <div className="steps">
          {STEPS.map(s => (
            <div key={s.n} className="step">
              <div className="step-n">{s.n}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.t}</div>
              <p className="step-desc">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-eyebrow">Who it&apos;s for</div>
          <h2 className="section-title">Built for every section</h2>
        </div>
        <div className="who-grid">
          {SECTIONS.map(s => (
            <div key={s.id} className="who-card" style={{ background: s.pale }}>
              <div className="who-label" style={{ color: s.accent }}>{s.label}</div>
              <div className="who-age" style={{ color: s.accent }}>{s.age}</div>
            </div>
          ))}
        </div>
        <p className="who-note">More youth organisations coming soon.</p>
      </div>

      <div className="section">
        <div className="cta-strip">
          <h2>Ready to plan your next term?</h2>
          <p>Sign up free and build your first term plan in under 5 minutes.</p>
          <Link href="/auth?mode=signup" className="btn-pri">Sign up free →</Link>
        </div>
      </div>
    </>
  );
}
