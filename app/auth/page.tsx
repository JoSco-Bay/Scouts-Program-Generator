"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NAVY, SECTION_COLOURS } from '@/lib/colours';
import { useAuth } from '@/lib/auth-context';

const acc = SECTION_COLOURS.Joeys.accent;

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode]           = useState<'login' | 'signup'>('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [working, setWorking]     = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push('/term');
  }, [user, loading, router]);

  const submit = async () => {
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setWorking(true); setError('');
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) { setError(error); setWorking(false); return; }
      router.push('/term');
    } else {
      const { error } = await signUp(email, password);
      if (error) { setError(error); setWorking(false); return; }
      setSignupDone(true);
      setWorking(false);
    }
  };

  if (loading) return null;

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
        .toggle{font-size:13px;color:#6b7280;text-align:center;margin-top:18px;}
        .toggle span{color:${acc};cursor:pointer;font-weight:500;}
        .toggle span:hover{text-decoration:underline;}
        .divider{border:none;border-top:1px solid #f3f4f6;margin:18px 0;}
        .hint{font-size:11px;color:#9ca3af;text-align:center;margin-top:10px;line-height:1.5;}
      `}</style>

      <nav className="nav">
        <div className="nav-dot">⚜</div>
        <span className="nav-title">Scout Program Builder</span>
      </nav>

      <div className="wrap">
        <div className="card">
          {signupDone ? (
            <div className="success">
              <strong>Check your email!</strong><br/>
              We sent a confirmation link to <strong>{email}</strong>.<br/>
              Click it to activate your account, then sign in here.
            </div>
          ) : (
            <>
              <div className="title">{mode === 'login' ? 'Sign in' : 'Create account'}</div>
              <div className="sub">
                {mode === 'login'
                  ? 'Sign in to your Scout Program Builder account'
                  : 'Create your Scout Program Builder account to get started'}
              </div>
              <div className="field">
                <div className="lbl">Email</div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
              </div>
              <div className="field">
                <div className="lbl">Password</div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
              </div>
              <button className="btn" onClick={submit} disabled={working}>
                {working ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create account →'}
              </button>
              {error && <div className="err">⚠ {error}</div>}
              <hr className="divider"/>
              <div className="toggle">
                {mode === 'login'
                  ? <>Don&apos;t have an account? <span onClick={() => { setMode('signup'); setError(''); }}>Sign up</span></>
                  : <>Already have an account? <span onClick={() => { setMode('login'); setError(''); }}>Sign in</span></>
                }
              </div>
              {mode === 'signup' && (
                <div className="hint">
                  Tip: disable email confirmation in Supabase → Authentication → Settings if you want to skip the verify step.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
