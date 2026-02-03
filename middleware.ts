import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Only refresh session for page navigation, not API calls
  // This reduces Supabase API calls to avoid rate limiting
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api/');

  let user = null;
  if (!isApiRoute) {
    // Refresh session only for page requests
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // Admin routes use custom cookie-based auth
  if (pathname.startsWith('/admin')) {
    // Allow login page without auth
    if (pathname === '/admin/login') {
      return supabaseResponse;
    }

    // Check for admin session cookie
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return supabaseResponse;
  }

  // Other protected routes use Supabase auth
  // if (!user && pathname.startsWith('/protected')) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
