"use client";
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!user) return null;

  const initial = (user.email || '?').charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        .um-full{display:flex;align-items:center;gap:10px;}
        .um-compact{display:none;}
        @media (max-width:640px){
          .um-full{display:none;}
          .um-compact{display:inline-block;}
        }
        .um-avatar-btn{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.32);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;padding:0;}
        .um-dropdown{position:absolute;top:38px;right:0;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.14);padding:10px;min-width:190px;z-index:50;}
        .um-dropdown-email{font-size:12px;color:#374151;word-break:break-all;margin-bottom:8px;}
        .um-dropdown-btn{width:100%;font-size:12px;font-weight:600;color:#fff;background:#374151;border:none;border-radius:6px;padding:7px 0;cursor:pointer;font-family:inherit;}
      `}</style>

      <div className="um-full">
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{user.email}</span>
        <button
          onClick={() => signOut()}
          style={{
            fontSize: '12px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.22)', borderRadius: '6px', padding: '6px 12px',
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}
        >
          Log out
        </button>
      </div>

      <div className="um-compact" style={{ position: 'relative' }} ref={rootRef}>
        <button className="um-avatar-btn" onClick={() => setOpen(o => !o)}>{initial}</button>
        {open && (
          <div className="um-dropdown">
            <div className="um-dropdown-email">{user.email}</div>
            <button className="um-dropdown-btn" onClick={() => { setOpen(false); signOut(); }}>Log out</button>
          </div>
        )}
      </div>
    </>
  );
}
