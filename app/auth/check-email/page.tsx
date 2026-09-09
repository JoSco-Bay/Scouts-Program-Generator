"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NAVY, SECTION_COLOURS } from '@/lib/colours';

const acc = SECTION_COLOURS.Joeys.accent;

export default function CheckEmailPage() {
  const router = useRouter();
  const [email] = useState(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('email') || '' : ''
  );

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
        .nav{background:${NAVY};height:52px;padding:0 24px;display:flex;align-items:center;gap:10px;}
        .nav-dot{width:26px;height:26px;border-radius:50%;background:${acc};display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;}
        .nav-title{color:#fff;font-size:15px;font-weight:500;}
        .wrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 52px);padding:24px;}
        .card{background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;width:100%;max-width:380px;box-shadow:0 4px 16px rgba(0,0,0,0.06);}
        .success{background:#f0fdf4;border:1px solid #86efac;color:#166534;font-size:13px;padding:16px;border-radius:8px;line-height:1.7;}
        .toggle{font-size:13px;color:#6b7280;text-align:center;margin-top:18px;}
        .toggle span{color:${acc};cursor:pointer;font-weight:500;}
        .toggle span:hover{text-decoration:underline;}
      `}</style>

      <nav className="nav">
        <div className="nav-dot">⚜</div>
        <span className="nav-title">Scout Program Builder</span>
      </nav>

      <div className="wrap">
        <div className="card">
          <div className="success">
            <strong>Check your email!</strong><br/>
            We sent a sign-in link{email ? <> to <strong>{email}</strong></> : ''}.<br/>
            Click it to sign in — no password needed.
          </div>
          <div className="toggle">
            Wrong email or didn&apos;t get it? <span onClick={() => router.push('/auth')}>Try again</span>
          </div>
        </div>
      </div>
    </>
  );
}
