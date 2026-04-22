import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/survey', '/training', '/issues'];
// Routes that should redirect TO dashboard if already logged in
const AUTH_ROUTES = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    // Skip middleware if Supabase is not configured (allows build to succeed)
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
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

    // Use getSession() instead of getUser() to avoid network round-trips
    // that cause MIDDLEWARE_INVOCATION_TIMEOUT on Vercel Edge.
    // getSession() reads the JWT from cookies locally (no network call).
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const pathname = request.nextUrl.pathname;

    // If user is NOT logged in and trying to access protected route → redirect to login
    if (!session && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(url);
    }

    // If user IS logged in and trying to access auth routes → redirect to dashboard
    if (session && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public folder files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
    ],
};
