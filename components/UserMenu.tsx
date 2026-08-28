"use client";
import { useAuth } from '@/lib/auth-context';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
      <span style={{fontSize:'12px',color:'rgba(255,255,255,0.65)'}}>{user.email}</span>
      <button
        onClick={() => signOut()}
        style={{
          fontSize:'12px',fontWeight:600,color:'#fff',background:'rgba(255,255,255,0.12)',
          border:'1px solid rgba(255,255,255,0.22)',borderRadius:'6px',padding:'6px 12px',
          cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',
        }}
      >
        Log out
      </button>
    </div>
  );
}
