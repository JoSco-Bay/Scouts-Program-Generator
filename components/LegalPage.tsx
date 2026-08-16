import Link from "next/link";
import { NAVY } from "@/lib/colours";

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        .legal-nav{background:${NAVY};height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
        .legal-nav-l{display:flex;align-items:center;gap:9px;text-decoration:none;}
        .legal-nav-dot{width:28px;height:28px;background:#C17F24;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0;}
        .legal-nav-title{color:#fff;font-size:15px;font-weight:500;}
        .legal-content{max-width:720px;margin:0 auto;padding:48px 24px 64px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#111827;}
        .legal-content h1{font-size:28px;font-weight:700;letter-spacing:-0.02em;margin-bottom:6px;}
        .legal-updated{font-size:12px;color:#9ca3af;margin-bottom:32px;}
        .legal-content h2{font-size:16px;font-weight:600;margin:28px 0 8px;}
        .legal-content p{font-size:14px;line-height:1.7;color:#374151;margin-bottom:12px;}
        .legal-content ul{margin:0 0 12px 20px;}
        .legal-content li{font-size:14px;line-height:1.7;color:#374151;margin-bottom:4px;}
        .legal-content a{color:#C17F24;}
      `}</style>
      <nav className="legal-nav">
        <Link href="/" className="legal-nav-l">
          <div className="legal-nav-dot">⚜</div>
          <span className="legal-nav-title">Scout Program Builder</span>
        </Link>
      </nav>
      <div className="legal-content">
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {updated}</p>
        {children}
      </div>
    </>
  );
}
