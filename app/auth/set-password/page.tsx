"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NAVY, SECTION_COLOURS } from '@/lib/colours';
import { useAuth } from '@/lib/auth-context';
import UserMenu from '@/components/UserMenu';

const acc = SECTION_COLOURS.Joeys.accent;

export default function SetPasswordPage() {
  const router = useRouter();
  const { user, loading, updatePassword } = useAuth();
  const [isChangeMode] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'change'
  );
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [working, setWorking]   = useState(false);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  const submit = async () => {
    if (!password || !confirm) { setError('Enter and confirm your password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setWorking(true); setError('');
    const { error } = await updatePassword(password);
    if (error) { setError(error); setWorking(false); return; }
    if (isChangeMode) {
      setDone(true);
      setWorking(false);
    } else {
      router.push('/term');
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#f4f5f7;color:#111827;}
        .nav{background:${NAVY};height:52px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:10px;}
        .nav-l{display:flex;align-items:center;gap:10px;}
        .nav-dot{width:26px;height:26px;border-radius:50%;background:${acc};display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;}
        .nav-title{color:#fff;font-size:15px;font-weight:500;}
        .wrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 52px);padding:24px;}
        .card{background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;width:100%;max-width:380px;box-shadow:0 4px 16px rgba(0,0,0,0.06);}
        .title{font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.02em;margin-bottom:4px;}
        .sub{font-size:13px;color:#6b7280;margin-bottom:24px;line-height:1.5;}
        .field{margin-bottom:14px;}
        .lbl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;margin-bottom:5px;}
        input{width:100%;border:1px solid #d1d5db;border-radius:6px;padding:10px 12px;font-size:14px;color:#111827;font-family:inherit;outline:none;background:#fff;}
        input:focus{border-color:${acc};box-shadow:0 0 0 3px ${acc}18;}
        .btn{width:100%;padding:12px;border-radius:8px;border:none;background:${acc};color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity 0.2s;margin-top:6px;}
        .btn:hover{opacity:0.9;}
        .btn:disabled{opacity:0.6;cursor:not-allowed;}
        .err{background:#fef2f2;border:1px solid #fca5a5;color:#b91c1c;font-size:12px;padding:8px 12px;border-radius:6px;margin-top:12px;line-height:1.5;}
        .success{background:#f0fdf4;border:1px solid #86efac;color:#166534;font-size:13px;padding:16px;border-radius:8px;line-height:1.7;}
      `}</style>

      <nav className="nav">
        <div className="nav-l">
          <div className="nav-dot">⚜</div>
          <span className="nav-title">Scout Program Builder</span>
        </div>
        <UserMenu />
      </nav>

      <div className="wrap">
        <div className="card">
          {done ? (
            <div className="success">
              <strong>Password updated!</strong><br/>
              You can now log in with your new password any time.
            </div>
          ) : (
            <>
              <div className="title">{isChangeMode ? 'Change password' : 'Set your password'}</div>
              <div className="sub">
                {isChangeMode
                  ? 'Choose a new password for your account.'
                  : 'Welcome! Set a password for your account so you can log in easily next time.'}
              </div>
              <div className="field">
                <div className="lbl">New password</div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
              </div>
              <div className="field">
                <div className="lbl">Confirm password</div>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
              </div>
              <button className="btn" onClick={submit} disabled={working}>
                {working ? 'Saving…' : 'Save password →'}
              </button>
              {error && <div className="err">⚠ {error}</div>}
            </>
          )}
        </div>
      </div>
    </>
  );
}
