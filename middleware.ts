import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database, UserRole } from '@/lib/supabase/types';

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });

  if (!hasSupabaseEnv()) {
    return res;
  }

  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const protectedRoute = path.startsWith('/app') || path.startsWith('/supervisor');

  if (!user && protectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (user && protectedRoute) {
    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const profile = profileData as { role: UserRole } | null;

    if (path.startsWith('/app') && profile?.role === 'supervisor') {
      return NextResponse.redirect(new URL('/supervisor', req.url));
    }

    if (path.startsWith('/supervisor') && profile?.role === 'chw') {
      return NextResponse.redirect(new URL('/app', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/app/:path*', '/supervisor/:path*'],
};