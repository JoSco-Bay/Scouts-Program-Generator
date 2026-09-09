import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require a signed-in user. Matches the client-side auth guards in
// each of these page.tsx files (see CLAUDE.md "Auth pattern — protected pages"),
// plus /auth/set-password, which also requires an active session.
const PROTECTED_PATHS = ['/setup', '/term', '/members', '/runsheet', '/runsheets', '/events', '/auth/set-password'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function proxy(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Mirrors lib/supabase.ts: if env vars are missing, don't block navigation here —
  // fall through to the client-side guard, which already handles this case.
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() (not getSession()) actually revalidates the token against the
  // Supabase Auth server on every navigation — this is what makes the check
  // real re-verification instead of trusting a possibly-stale cached session.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/setup/:path*', '/term/:path*', '/members/:path*', '/runsheet/:path*', '/runsheets/:path*', '/events/:path*', '/auth/set-password'],
};
