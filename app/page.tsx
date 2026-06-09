import Link from "next/link";

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .hp {
          min-height: 100vh;
          background-color: #1a1208;
          background-image:
            radial-gradient(ellipse 100% 55% at 50% -8%, rgba(101,62,11,0.6) 0%, transparent 65%),
            radial-gradient(ellipse 40% 25% at 85% 55%, rgba(101,62,11,0.1) 0%, transparent 50%);
          padding: 44px 20px 88px;
          font-family: 'Source Serif 4', Georgia, serif;
        }

        /* ── top badge ── */
        .hp-badge { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:52px; opacity:0.5; }
        .hp-badge-line { height:1px; width:64px; }
        .hp-badge span { font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.26em; text-transform:uppercase; color:#a16207; }

        /* ── hero ── */
        .hero { max-width:620px; margin:0 auto 72px; text-align:center; }
        .hero-eye {
          display:inline-flex; align-items:center; gap:7px; margin-bottom:22px;
          font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.3em; text-transform:uppercase; color:#a16207;
          border:1px solid rgba(161,98,7,0.3); border-radius:2px; padding:4px 12px;
        }
        .hero-title {
          font-family:'Teko',sans-serif; font-size:clamp(52px,10vw,96px);
          font-weight:600; color:#fdf6e3; line-height:0.88; letter-spacing:-0.015em;
          margin-bottom:26px;
        }
        .hero-title em { font-style:italic; font-weight:300; color:#d97706; display:block; }
        .hero-sub {
          font-size:16px; line-height:1.72; color:#b59060; font-style:italic;
          max-width:460px; margin:0 auto 36px;
        }
        .hero-cta {
          display:inline-flex; align-items:center; justify-content:center;
          padding:16px 36px; background:#1c0f00; border-radius:2px;
          text-decoration:none; position:relative; overflow:hidden; transition:transform 0.15s;
        }
        .hero-cta:hover { transform:translateY(-2px); }
        .hero-cta::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,#92400e 0%,#451a03 50%,#1c0f00 100%);
          opacity:0; transition:opacity 0.3s;
        }
        .hero-cta:hover::before { opacity:1; }
        .hero-cta-inner { position:relative; z-index:1; display:flex; align-items:center; gap:10px; }
        .hero-cta-text { font-family:'Teko',sans-serif; font-size:22px; letter-spacing:0.16em; text-transform:uppercase; color:#fde68a; }
        .hero-cta-arrow { font-size:18px; color:#fde68a; transition:transform 0.3s; }
        .hero-cta:hover .hero-cta-arrow { transform:translateX(5px); }
        .hero-pills { display:flex; justify-content:center; gap:8px; margin-top:22px; flex-wrap:wrap; }
        .hero-pill {
          font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.16em; text-transform:uppercase;
          color:#78350f; background:rgba(253,246,227,0.06);
          border:1px solid rgba(161,98,7,0.2); border-radius:2px; padding:3px 10px;
        }

        /* ── divider ── */
        .divider { display:flex; align-items:center; gap:12px; max-width:760px; margin:0 auto 32px; }
        .divider-line { flex:1; height:1px; background:rgba(161,98,7,0.18); }
        .divider-text { font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.26em; text-transform:uppercase; color:#a16207; opacity:0.7; white-space:nowrap; }

        /* ── paper card ── */
        .card {
          max-width:760px; margin:0 auto 44px; background:#fdf6e3; border-radius:3px;
          box-shadow:0 0 0 1px rgba(101,62,11,0.2),0 4px 6px rgba(0,0,0,0.35),0 24px 64px rgba(0,0,0,0.55);
          position:relative; overflow:hidden;
        }
        .card-inner { padding:36px 44px; position:relative; z-index:1; }
        .co { position:absolute; width:22px; height:22px; opacity:0.18; }
        .co.tl { top:8px; left:8px; border-top:2px solid #78350f; border-left:2px solid #78350f; }
        .co.tr { top:8px; right:8px; border-top:2px solid #78350f; border-right:2px solid #78350f; }
        .co.bl { bottom:8px; left:8px; border-bottom:2px solid #78350f; border-left:2px solid #78350f; }
        .co.br { bottom:8px; right:8px; border-bottom:2px solid #78350f; border-right:2px solid #78350f; }
        .card-label {
          font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.25em; text-transform:uppercase;
          color:#a16207; margin-bottom:24px; display:flex; align-items:center; gap:8px;
        }
        .card-label::after { content:''; flex:1; height:1px; background:rgba(161,98,7,0.2); }

        /* ── steps ── */
        .step { display:flex; align-items:flex-start; gap:20px; padding:22px 0; border-bottom:1px dashed rgba(101,62,11,0.15); }
        .step:first-child { padding-top:0; }
        .step:last-child { border-bottom:none; padding-bottom:0; }
        .step-num {
          flex-shrink:0; width:42px; height:42px; background:#1c0f00; border-radius:2px;
          display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;
        }
        .step-num::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,#92400e,#1c0f00); opacity:0.85;
        }
        .step-num span { font-family:'Teko',sans-serif; font-size:20px; font-weight:600; color:#fde68a; position:relative; z-index:1; line-height:1; }
        .step-body { flex:1; padding-top:5px; }
        .step-title { font-family:'Teko',sans-serif; font-size:21px; font-weight:500; letter-spacing:0.04em; color:#1c0f00; margin-bottom:7px; }
        .step-desc { font-size:14px; line-height:1.72; color:#78350f; }

        /* ── features grid ── */
        .feat-grid {
          max-width:760px; margin:0 auto 64px;
          display:grid; grid-template-columns:repeat(2,1fr);
          background:rgba(101,62,11,0.15); border-radius:3px;
          box-shadow:0 0 0 1px rgba(101,62,11,0.2),0 4px 6px rgba(0,0,0,0.3),0 20px 50px rgba(0,0,0,0.45);
          overflow:hidden; gap:1px;
        }
        .feat { background:#fdf6e3; padding:28px 32px; transition:background 0.2s; }
        .feat:hover { background:#fffbf0; }
        .feat-icon { font-size:26px; margin-bottom:11px; line-height:1; }
        .feat-title { font-family:'Teko',sans-serif; font-size:21px; font-weight:500; letter-spacing:0.04em; color:#1c0f00; margin-bottom:8px; }
        .feat-desc { font-size:13.5px; line-height:1.68; color:#78350f; }
        .feat-tag {
          display:inline-block; margin-top:12px;
          font-family:'Teko',sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase;
          color:#a16207; background:rgba(161,98,7,0.1); border:1px solid rgba(161,98,7,0.2);
          border-radius:2px; padding:2px 8px;
        }

        /* ── final cta ── */
        .final { max-width:760px; margin:0 auto; text-align:center; }
        .final-rule { height:1px; background:linear-gradient(to right,transparent,rgba(161,98,7,0.3),transparent); margin-bottom:48px; }
        .final-eye { font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.3em; text-transform:uppercase; color:#a16207; opacity:0.65; margin-bottom:14px; }
        .final-title { font-family:'Teko',sans-serif; font-size:clamp(32px,6vw,54px); font-weight:600; color:#fdf6e3; line-height:0.9; margin-bottom:14px; }
        .final-title em { font-style:italic; font-weight:300; color:#d97706; }
        .final-sub { font-size:14px; color:#b59060; font-style:italic; margin-bottom:28px; }

        @media (max-width:540px) {
          .card-inner { padding:28px 24px; }
          .feat-grid { grid-template-columns:1fr; }
          .hero-title { font-size:58px; }
        }
      `}</style>

      <div className="hp">

        {/* Top badge */}
        <div className="hp-badge">
          <div className="hp-badge-line" style={{ background: "linear-gradient(to right,transparent,#a16207)" }} />
          <span>Scouts Australia · Program Builder</span>
          <div className="hp-badge-line" style={{ background: "linear-gradient(to left,transparent,#a16207)" }} />
        </div>

        {/* Hero */}
        <div className="hero">
          <div className="hero-eye">⚜ Field Manual</div>
          <h1 className="hero-title">
            Scout Programs
            <em>Done Right</em>
          </h1>
          <p className="hero-sub">
            Complete session plans, term overviews, and multi-year progressions —
            tailored to your section, OAS badge goals, and group size.
          </p>
          <Link href="/builder" className="hero-cta">
            <div className="hero-cta-inner">
              <span className="hero-cta-text">Start Building</span>
              <span className="hero-cta-arrow">→</span>
            </div>
          </Link>
          <div className="hero-pills">
            <span className="hero-pill">Joeys · Cubs</span>
            <span className="hero-pill">Scouts · Venturers</span>
            <span className="hero-pill">OAS Integrated</span>
            <span className="hero-pill">Session to Multi-Year</span>
          </div>
        </div>

        {/* How it works */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">How It Works</span>
          <div className="divider-line" />
        </div>

        <div className="card" style={{ marginBottom: 48 }}>
          <div className="co tl" /><div className="co tr" /><div className="co bl" /><div className="co br" />
          <div className="card-inner">
            <div className="card-label">Three steps to a complete program</div>

            <div className="step">
              <div className="step-num"><span>01</span></div>
              <div className="step-body">
                <div className="step-title">Choose Your Section & Planning Horizon</div>
                <p className="step-desc">
                  Pick Joeys, Cubs, Scouts, or Venturers and set your group size and typical session length.
                  Then choose your planning scale — a single session, a full term, an annual program, or a multi-year progression.
                  Select OAS badge streams and stages to weave throughout.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-num"><span>02</span></div>
              <div className="step-body">
                <div className="step-title">Add a Theme, Goal & History</div>
                <p className="step-desc">
                  Give the program a theme and a learning goal. Paste in what you've run before so the AI
                  builds progressively, avoids repetition, and picks up exactly where your Scouts left off.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-num"><span>03</span></div>
              <div className="step-body">
                <div className="step-title">Generate, Expand & Print</div>
                <p className="step-desc">
                  Get a formatted, print-ready document with run sheets, parade scripts, activity instructions,
                  and OAS linkages in seconds. Click any bolded activity name to instantly expand it into a full
                  resource with equipment lists, safety notes, a leader script, and a printable where needed.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* What you get */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">What You Get</span>
          <div className="divider-line" />
        </div>

        <div className="feat-grid" style={{ marginBottom: 64 }}>
          <div className="feat">
            <div className="feat-icon">🗺️</div>
            <div className="feat-title">OAS Badge Integration</div>
            <p className="feat-desc">
              Select streams and stages from Core and Specialist Areas. Every activity is mapped
              to your chosen OAS progression — no manual cross-referencing required.
            </p>
            <span className="feat-tag">9 streams · 9 stages each</span>
          </div>

          <div className="feat">
            <div className="feat-icon">📋</div>
            <div className="feat-title">Run Sheets & Leader Scripts</div>
            <p className="feat-desc">
              Every session includes a minute-by-minute run sheet, opening and closing parade
              scripts, and word-for-word leader cues — formatted and ready to hand out.
            </p>
            <span className="feat-tag">Print-ready format</span>
          </div>

          <div className="feat">
            <div className="feat-icon">🗓️</div>
            <div className="feat-title">Session to Multi-Year Scale</div>
            <p className="feat-desc">
              Plan a single 60-minute session or a 3-year Scouting journey across all four
              school terms. Year and multi-year plans generate expandable term cards on demand.
            </p>
            <span className="feat-tag">Session · Term · Year · Multi-Year</span>
          </div>

          <div className="feat">
            <div className="feat-icon">⚙️</div>
            <div className="feat-title">Full Activity Resources</div>
            <p className="feat-desc">
              Click any activity to generate a complete resource — setup guide, equipment list
              with shed vs. bring breakdown, safety notes, variations, and a printable if the
              activity needs one.
            </p>
            <span className="feat-tag">Powered by GPT-4o</span>
          </div>
        </div>

        {/* Final CTA */}
        <div className="final">
          <div className="final-rule" />
          <div className="final-eye">⚜ Ready to start?</div>
          <h2 className="final-title">
            Plan Your<br /><em>Next Adventure</em>
          </h2>
          <p className="final-sub">Takes less than a minute. No account required.</p>
          <Link href="/builder" className="hero-cta">
            <div className="hero-cta-inner">
              <span className="hero-cta-text">Open the Builder</span>
              <span className="hero-cta-arrow">→</span>
            </div>
          </Link>
        </div>

      </div>
    </>
  );
}
