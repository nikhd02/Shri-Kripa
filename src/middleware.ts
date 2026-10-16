/**
 * src/middleware.ts
 * Protects admin routes at the middleware layer.
 * Redirects unauthenticated users from /dashboard/* and /kitchen to /login.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import type { IronSessionData } from 'iron-session';

const PROTECTED_PREFIXES = ['/dashboard', '/kitchen'];
const AUTH_PAGES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page);

  if (!isProtected && !isAuthPage) {
    return NextResponse.next();
  }

  // Read session from cookie
  const response = NextResponse.next();
  const session = await getIronSession<IronSessionData>(request, response, sessionOptions);

  if (isProtected && !session.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated, redirect away from login
  if (isAuthPage && session.user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/kitchen/:path*', '/login'],
};
