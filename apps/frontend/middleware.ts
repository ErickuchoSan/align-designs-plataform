import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Progressive Enhancement
 *
 * Handles server-side route protection and redirects.
 * This improves PE by:
 * 1. Redirecting unauthenticated users BEFORE page load
 * 2. Reducing unnecessary client-side checks
 * 3. Providing faster navigation for authenticated users
 *
 * Note: Full SSR auth requires HttpOnly cookies (future enhancement)
 * Currently checks for auth token in cookies as fallback
 */

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/reset-password'];

// Public routes (no auth check needed)
const publicRoutes = ['/', '/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth token in cookies (HttpOnly cookies set by backend)
  const accessToken = request.cookies.get('access_token')?.value;
  const hasAuth = !!accessToken;

  // Protected routes - redirect to login if not authenticated
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !hasAuth) {
    // Store the intended destination
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Auth routes - redirect to dashboard if already authenticated
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && hasAuth) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    String.raw`/((?!_next/static|_next/image|favicon.ico|.*\..*|api).*)`,
  ],
};
