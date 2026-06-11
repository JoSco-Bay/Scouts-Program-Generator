"use client";

export default function HomePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .hp { min-height: 100vh; font-family: 'Source Serif 4', Georgia, serif; background: #2c1810; }

        /* ── NAV ── */
        .nav {
          max-width: 1100px; margin: 0 auto;
          padding: 24px 32px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Teko', sans-serif; font-size: 22px; font-weight: 600;
          letter-spacing: 0.06em; color: #fde68a; text-decoration: none;
        }
        .nav-cta {
          background: #fde68a; color: #1c0f00;
          font-family: 'Teko', sans-serif; font-size: 15px; letter-spacing: 0.12em;
          text-transform: uppercase; padding: 10px 22px; border-radius: 2px;
          text-decoration: none; transition: background 0.2s;
        }
        .nav-cta:hover { background: #fcd34d; }

        /* ── HERO ── */
        .hero {
          background: linear-gradient(160deg, #3d2010 0%, #2c1810 50%, #1a1208 100%);
          border-bottom: 1px solid rgba(253,230,138,0.12);
          padding: 80px 32px 72px;
          text-align: center;
        }
        .hero-inner { max-width: 760px; margin: 0 auto; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(253,230,138,0.1); border: 1px solid rgba(253,230,138,0.25);
          border-radius: 20px; padding: 6px 16px;
          font-family: 'Teko', sans-serif; font-size: 13px; letter-spacing: 0.2em;
          text-transform: uppercase; color: #fde68a; margin-bottom: 28px;
        }
        .hero-title {
          font-family: 'Teko', sans-serif;
          font-size: clamp(52px, 9vw, 96px);
          font-weight: 700; color: #fdf6e3;
          line-height: 0.9; letter-spacing: -0.02em;
          margin-bottom: 24px;
        }
        .hero-title em { font-style: italic; font-weight: 300; color: #d97706; display: block; }
        .hero-desc {
          font-size: 18px; line-height: 1.75;
          color: rgba(253,246,227,0.72); max-width: 560px;
          margin: 0 auto 40px;
        }
        .hero-buttons { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          background: #fde68a; color: #1c0f00;
          font-family: 'Teko', sans-serif; font-size: 20px;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 16px 36px; border-radius: 2px; text-decoration: none;
          transition: all 0.2s; font-weight: 600;
        }
        .btn-primary:hover { background: #fcd34d; transform: translateY(-2px); }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(253,230,138,0.35); color: rgba(253,230,138,0.8);
          font-family: 'Teko', sans-serif; font-size: 16px;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 16px 28px; border-radius: 2px; text-decoration: none;
          transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: rgba(253,230,138,0.7); color: #fde68a; }

        /* ── SECTIONS ── */
        .section { max-width: 1100px; margin: 0 auto; padding: 72px 32px; }
        .section-eyebrow {
          font-family: 'Teko', sans-serif; font-size: 12px; letter-spacing: 0.3em;
          text-transform: uppercase; color: #d97706; margin-bottom: 12px; display: block;
        }
        .section-title {
          font-family: 'Teko', sans-serif;
          font-size: clamp(36px, 5vw, 52px);
          font-weight: 600; color: #fdf6e3; line-height: 1; margin-bottom: 48px;
        }
        .section-title em { font-style: italic; font-weight: 300; color: #d97706; }

        /* ── HOW IT WORKS ── */
        .hiw-bg { background: #231409; border-top: 1px solid rgba(253,230,138,0.08); border-bottom: 1px solid rgba(253,230,138,0.08); }
        .steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .step {
          background: rgba(253,246,227,0.05);
          border: 1px solid rgba(253,230,138,0.15);
          border-radius: 4px; padding: 32px 28px;
          transition: border-color 0.2s, background 0.2s;
        }
        .step:hover { border-color: rgba(253,230,138,0.35); background: rgba(253,246,227,0.08); }
        .step-num {
          font-family: 'Teko', sans-serif; font-size: 56px; font-weight: 700;
          color: rgba(217,119,6,0.25); line-height: 1; margin-bottom: 16px;
        }
        .step-icon { font-size: 32px; display: block; margin-bottom: 14px; }
        .step-title {
          font-family: 'Teko', sans-serif; font-size: 22px;
          letter-spacing: 0.04em; color: #fdf6e3; margin-bottom: 10px;
        }
        .step-desc { font-size: 15px; line-height: 1.7; color: rgba(253,246,227,0.6); }

        /* ── SECTION COLOURS STRIP ── */
        .oas-bg { background: #1a1208; border-top: 1px solid rgba(253,230,138,0.08); border-bottom: 1px solid rgba(253,230,138,0.08); padding: 40px 0; }
        .oas-inner { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
        .oas-label {
          font-family: 'Teko', sans-serif; font-size: 13px; letter-spacing: 0.25em;
          text-transform: uppercase; color: rgba(253,230,138,0.5);
          margin-bottom: 20px; display: block;
        }
        .oas-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .oas-chip {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 3px;
          font-family: 'Teko', sans-serif; font-size: 15px;
          letter-spacing: 0.06em; transition: all 0.2s;
        }
        .oas-chip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .section-chip-joeys { background: rgba(193,127,36,0.15); border: 1px solid rgba(193,127,36,0.4); color: #fcd34d; }
        .section-chip-cubs { background: rgba(232,184,0,0.15); border: 1px solid rgba(232,184,0,0.4); color: #fcd34d; }
        .section-chip-scouts { background: rgba(107,191,90,0.15); border: 1px solid rgba(107,191,90,0.4); color: #86efac; }
        .section-chip-venturers { background: rgba(181,72,94,0.15); border: 1px solid rgba(181,72,94,0.4); color: #fca5a5; }

        /* ── FEATURES ── */
        .features-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
        .feat {
          background: rgba(253,246,227,0.04);
          border: 1px solid rgba(253,230,138,0.12);
          border-radius: 4px; padding: 28px 32px;
          transition: border-color 0.2s, background 0.2s;
        }
        .feat:hover { border-color: rgba(253,230,138,0.28); background: rgba(253,246,227,0.07); }
        .feat-wide { grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
        .feat-icon { font-size: 32px; margin-bottom: 14px; display: block; }
        .feat-title {
          font-family: 'Teko', sans-serif; font-size: 22px;
          letter-spacing: 0.04em; color: #fdf6e3; margin-bottom: 10px;
        }
        .feat-desc { font-size: 15px; line-height: 1.7; color: rgba(253,246,227,0.6); }
        .feat-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .feat-tag {
          padding: 5px 12px; border-radius: 3px;
          background: rgba(253,230,138,0.08); border: 1px solid rgba(253,230,138,0.2);
          font-family: 'Teko', sans-serif; font-size: 13px;
          letter-spacing: 0.1em; text-transform: uppercase; color: #fde68a;
        }

        /* ── SAMPLE OUTPUT ── */
        .sample-bg { background: #231409; border-top: 1px solid rgba(253,230,138,0.08); border-bottom: 1px solid rgba(253,230,138,0.08); }
        .sample-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
        .sample-card {
          background: #fdf6e3; border-radius: 3px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          overflow: hidden; position: relative;
        }
        .sample-card::before {
          content: ''; position: absolute; top: 0; bottom: 0; left: 40px;
          width: 1px; background: rgba(220,38,38,0.15);
        }
        .sample-card-head {
          padding: 20px 24px 16px 56px;
          border-bottom: 1px solid rgba(101,62,11,0.15);
          background: linear-gradient(to bottom, rgba(254,243,199,0.8), transparent);
        }
        .sample-card-eyebrow {
          font-family: 'Teko', sans-serif; font-size: 10px; letter-spacing: 0.25em;
          text-transform: uppercase; color: #a16207; margin-bottom: 4px;
        }
        .sample-card-title {
          font-family: 'Teko', sans-serif; font-size: 22px;
          font-weight: 600; color: #1c0f00; line-height: 1;
        }
        .sample-card-title em { font-style: italic; font-weight: 300; color: #78350f; }
        .sample-card-body { padding: 16px 24px 20px 56px; }
        .sample-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
        .sample-dot { width: 5px; height: 5px; border-radius: 50%; background: #a16207; opacity: 0.6; flex-shrink: 0; }
        .sample-line { height: 8px; border-radius: 1px; background: rgba(44,26,6,0.1); flex: 1; }
        .sample-table { margin-top: 12px; border: 1px solid rgba(101,62,11,0.15); border-radius: 2px; overflow: hidden; }
        .sample-table-head { background: #1c0f00; padding: 6px 10px; display: flex; gap: 8px; }
        .sample-table-hcell { height: 7px; border-radius: 1px; background: rgba(253,230,138,0.4); flex: 1; }
        .sample-table-row { display: flex; gap: 8px; padding: 6px 10px; border-bottom: 1px solid rgba(101,62,11,0.08); }
        .sample-table-row:last-child { border-bottom: none; }
        .sample-table-row:nth-child(even) { background: rgba(101,62,11,0.04); }
        .sample-table-cell { height: 7px; border-radius: 1px; background: rgba(44,26,6,0.1); flex: 1; }
        .sample-table-cell.b { background: rgba(44,26,6,0.2); max-width: 44px; }

        .sample-title { font-family: 'Teko', sans-serif; font-size: 28px; color: #fdf6e3; margin-bottom: 12px; }
        .sample-item { display: flex; gap: 10px; align-items: baseline; font-size: 15px; line-height: 1.7; color: rgba(253,246,227,0.65); padding: 6px 0; border-bottom: 1px solid rgba(253,246,227,0.07); }
        .sample-item::before { content: '✓'; color: #d97706; flex-shrink: 0; }

        /* ── CTA ── */
        .cta-section { padding: 80px 32px; }
        .cta-card {
          max-width: 1100px; margin: 0 auto;
          background: #fdf6e3; border-radius: 4px;
          padding: 56px 64px; display: flex;
          align-items: center; justify-content: space-between;
          gap: 32px; flex-wrap: wrap;
          position: relative; overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 32px 80px rgba(0,0,0,0.3);
        }
        .cta-card::before {
          content: ''; position: absolute; top: 0; bottom: 0; left: 44px;
          width: 1px; background: rgba(220,38,38,0.15);
        }
        .cta-left { padding-left: 28px; }
        .cta-eyebrow {
          font-family: 'Teko', sans-serif; font-size: 12px; letter-spacing: 0.28em;
          text-transform: uppercase; color: #a16207; margin-bottom: 8px;
        }
        .cta-title {
          font-family: 'Teko', sans-serif; font-size: clamp(32px,4vw,48px);
          font-weight: 600; color: #1c0f00; line-height: 1; margin-bottom: 12px;
        }
        .cta-title em { font-style: italic; font-weight: 300; color: #78350f; }
        .cta-desc { font-size: 15px; line-height: 1.65; color: #78350f; max-width: 380px; }
        .cta-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: #1c0f00; color: #fde68a;
          font-family: 'Teko', sans-serif; font-size: 20px;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 18px 36px; border-radius: 2px; text-decoration: none;
          flex-shrink: 0; transition: all 0.2s; position: relative; overflow: hidden;
        }
        .cta-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #92400e, #451a03); opacity: 0; transition: opacity 0.25s; }
        .cta-btn:hover::before { opacity: 1; }
        .cta-btn:hover { transform: translateY(-2px); }
        .cta-btn span, .cta-btn-arrow { position: relative; z-index: 1; }
        .cta-btn:hover .cta-btn-arrow { transform: translateX(4px); transition: transform 0.2s; }

        /* ── FOOTER ── */
        .footer {
          border-top: 1px solid rgba(253,230,138,0.1);
          padding: 28px 32px;
          background: #1a1208;
        }
        .footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
        }
        .footer-logo { font-family: 'Teko', sans-serif; font-size: 17px; letter-spacing: 0.06em; color: rgba(253,230,138,0.45); display: flex; align-items: center; gap: 8px; }
        .footer-copy { font-family: 'Teko', sans-serif; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(253,230,138,0.25); }

        @media (max-width: 768px) {
          .steps { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .feat-wide { grid-column: span 1; grid-template-columns: 1fr; }
          .sample-grid { grid-template-columns: 1fr; }
          .cta-card { padding: 36px 28px; }
          .cta-left { padding-left: 16px; }
          .hero { padding: 56px 24px 48px; }
          .section { padding: 56px 24px; }
        }
      `}</style>

      <div className="hp">

        {/* NAV */}
        <nav className="nav">
          <a href="/" className="nav-logo">⚜ Scout Program Builder</a>
          <a href="/setup" className="nav-cta">Set Up Your Group →</a>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-badge">
              <span>⚜</span>
              <span>Scouts Australia · Term Planner & Run Sheet Generator</span>
            </div>
            <h1 className="hero-title">
              Plan Every
              <em>Meeting.</em>
            </h1>
            <p className="hero-desc">
              Build a full term schedule and generate detailed, ready-to-run meeting programs —
              with timed activity sheets, OAS badge goals, equipment lists, and leader notes.
            </p>
            <div className="hero-buttons">
              <a href="/setup" className="btn-primary">
                Set Up Your Group <span>→</span>
              </a>
              <a href="#how" className="btn-secondary">See how it works ↓</a>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <div className="hiw-bg" id="how">
          <div className="section">
            <span className="section-eyebrow">How it works</span>
            <h2 className="section-title">Three steps to a <em>complete term</em></h2>
            <div className="steps">
              {[
                { n: "01", icon: "📋", title: "Set up your group", desc: "Enter your group name, section, meeting day and time, and leader names. Takes under a minute. Your setup is saved so you can come back any time." },
                { n: "02", icon: "🗓️", title: "Plan your term", desc: "Pick your term start and end dates. The planner builds your weekly schedule automatically, then lets you edit each row or click AI Suggest to fill in topics and OAS focus." },
                { n: "03", icon: "⚜️", title: "Generate run sheets", desc: "Click Create Run Sheet on any week to generate a detailed, timed meeting program. Edit activities, add equipment notes, and print when ready." },
              ].map(s => (
                <div key={s.n} className="step">
                  <span className="step-num">{s.n}</span>
                  <span className="step-icon">{s.icon}</span>
                  <div className="step-title">{s.title}</div>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION STRIP */}
        <div className="oas-bg">
          <div className="oas-inner">
            <span className="oas-label">Works for all Scouts Australia sections</span>
            <div className="oas-chips">
              {[
                { label: "Joeys · 5–8 yrs", cls: "section-chip-joeys", dot: "#C17F24" },
                { label: "Cubs · 8–11 yrs", cls: "section-chip-cubs", dot: "#E8B800" },
                { label: "Scouts · 11–15 yrs", cls: "section-chip-scouts", dot: "#6BBF5A" },
                { label: "Venturers · 15–18 yrs", cls: "section-chip-venturers", dot: "#B5485E" },
              ].map(c => (
                <span key={c.label} className={`oas-chip ${c.cls}`}>
                  <span className="oas-chip-dot" style={{ background: c.dot }} />
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="section">
          <span className="section-eyebrow">What you get</span>
          <h2 className="section-title">Everything a leader <em>needs</em></h2>
          <div className="features-grid">
            <div className="feat feat-wide">
              <div>
                <span className="feat-icon">🗓️</span>
                <div className="feat-title">Term Schedule Builder</div>
                <p className="feat-desc">Pick your term dates and your meeting day — the planner builds the full weekly schedule automatically. Edit any row inline: change the topic, location, OAS focus, equipment list, or assigned leader.</p>
                <div className="feat-tags">
                  <span className="feat-tag">Auto Dates</span>
                  <span className="feat-tag">Inline Edit</span>
                  <span className="feat-tag">Consent Flags</span>
                  <span className="feat-tag">Extra Events</span>
                </div>
              </div>
              <div>
                <span className="feat-icon">✨</span>
                <div className="feat-title">AI Theme Suggestions</div>
                <p className="feat-desc">Click AI Suggest Themes and the planner fills in a progressive sequence of topics and OAS focus areas for your whole term — tailored to your section, building skills week by week.</p>
                <div className="feat-tags">
                  <span className="feat-tag">OAS Linked</span>
                  <span className="feat-tag">Progressive</span>
                  <span className="feat-tag">Editable</span>
                  <span className="feat-tag">Section Aware</span>
                </div>
              </div>
            </div>
            {[
              { icon: "⏱️", title: "Timed Run Sheets", desc: "Click Create Run Sheet on any term row to generate a minute-by-minute activity schedule — opening parade, main activities, closing parade — ready to print and run." },
              { icon: "⚜️", title: "OAS Badge Integration", desc: "Every activity links to an OAS stream and stage so leaders can track badge progress across the term without extra paperwork." },
              { icon: "🎒", title: "Equipment Lists", desc: "Each run sheet includes what to bring, what to prep, and notes for the lead leader — so nothing gets forgotten on the night." },
              { icon: "✏️", title: "Fully Editable", desc: "Every field is editable inline. Change times, add notes, reorder activities, flag consent required — full control without starting over." },
            ].map(f => (
              <div key={f.title} className="feat">
                <span className="feat-icon">{f.icon}</span>
                <div className="feat-title">{f.title}</div>
                <p className="feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SAMPLE OUTPUT */}
        <div className="sample-bg">
          <div className="section">
            <span className="section-eyebrow">What it produces</span>
            <h2 className="section-title">A real run sheet, <em>not a summary</em></h2>
            <div className="sample-grid">
              <div className="sample-card">
                <div className="sample-card-head">
                  <div className="sample-card-eyebrow">⚜ Generated Run Sheet</div>
                  <div className="sample-card-title">Scout <em>Meeting Program</em></div>
                </div>
                <div className="sample-card-body">
                  {[1,0.85,0.7,1,0.6,0.8].map((w,i) => (
                    <div key={i} className="sample-row">
                      <div className="sample-dot"/>
                      <div className="sample-line" style={{maxWidth:`${w*100}%`}}/>
                    </div>
                  ))}
                  <div className="sample-table">
                    <div className="sample-table-head">
                      {[0.25,0.5,0.6,0.4].map((w,i)=><div key={i} className="sample-table-hcell" style={{flex:w}}/>)}
                    </div>
                    {[1,2,3,4,5].map(i=>(
                      <div key={i} className="sample-table-row">
                        <div className="sample-table-cell b"/>
                        {[0.6,0.9,0.7].map((w,j)=><div key={j} className="sample-table-cell" style={{flex:w}}/>)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="sample-title">Every run sheet includes:</div>
                {[
                  "Opening parade with flag ceremony notes",
                  "Coming-in activity with full instructions",
                  "Main activities timed to the minute",
                  "OAS badge stage linked to each activity",
                  "Equipment and items to bring",
                  "Leader notes for setup and debrief",
                  "Closing parade and reflection prompt",
                  "Fully editable before you print",
                ].map((item,i) => (
                  <div key={i} className="sample-item">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <div className="cta-card">
            <div className="cta-left">
              <div className="cta-eyebrow">Ready when you are</div>
              <h2 className="cta-title">Build your next<br /><em>term now</em></h2>
              <p className="cta-desc">Takes less than 2 minutes to set up. Your full term schedule generates instantly — then click any week to create a detailed run sheet.</p>
            </div>
            <a href="/setup" className="cta-btn">
              <span>Set Up Your Group</span>
              <span className="cta-btn-arrow">→</span>
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-logo">⚜ Scout Program Builder</div>
            <span className="footer-copy">For volunteer leaders · Not official Scouts Australia</span>
          </div>
        </footer>

      </div>
    </>
  );
}
