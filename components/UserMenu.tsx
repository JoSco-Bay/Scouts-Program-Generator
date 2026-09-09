"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
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

  const changePassword = () => { setOpen(false); router.push('/auth/set-password?mode=change'); };
  const logOut = () => { setOpen(false); signOut(); };

  return (
    <div style={{ position: 'relative' }} ref={rootRef}>
      <style>{`
        .um-trigger{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);border-radius:6px;padding:6px 12px;cursor:pointer;font-family:inherit;color:#fff;font-size:12px;font-weight:600;white-space:nowrap;}
        .um-trigger-caret{opacity:0.7;font-size:10px;}
        .um-avatar{display:none;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.18);align-items:center;justify-content:center;font-size:12px;font-weight:700;}
        @media (max-width:640px){
          .um-trigger-email{display:none;}
          .um-trigger-caret{display:none;}
          .um-trigger{background:none;border:none;padding:0;}
          .um-avatar{display:flex;}
        }
        .um-dropdown{position:absolute;top:38px;right:0;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.14);padding:10px;min-width:190px;z-index:50;}
        .um-dropdown-email{font-size:12px;color:#374151;word-break:break-all;margin-bottom:8px;}
        .um-dropdown-btn{width:100%;font-size:12px;font-weight:600;color:#374151;background:#f3f4f6;border:none;border-radius:6px;padding:7px 0;cursor:pointer;font-family:inherit;margin-bottom:6px;}
        .um-dropdown-btn:last-child{margin-bottom:0;}
        .um-dropdown-btn:hover{background:#e5e7eb;}
        .um-dropdown-btn.danger{color:#fff;background:#374151;}
        .um-dropdown-btn.danger:hover{opacity:0.9;}
      `}</style>

      <button className="um-trigger" onClick={() => setOpen(o => !o)}>
        <span className="um-trigger-email">{user.email}</span>
        <span className="um-avatar">{initial}</span>
        <span className="um-trigger-caret">▾</span>
      </button>

      {open && (
        <div className="um-dropdown">
          <div className="um-dropdown-email">{user.email}</div>
          <button className="um-dropdown-btn" onClick={changePassword}>Change password</button>
          <button className="um-dropdown-btn danger" onClick={logOut}>Log out</button>
        </div>
      )}
    </div>
  );
}
