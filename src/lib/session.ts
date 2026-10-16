/**
 * src/lib/session.ts
 * iron-session configuration and helpers for staff authentication.
 */

import { getIronSession, IronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';

// Extend IronSessionData to include our session fields
declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: string;
      name: string;
      email: string;
      role: Role;
    };
  }
}

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set.');
}

if (process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters long.');
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: 'shreekripa_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

/**
 * Get the current session. Safe to call from any Server Component or Server Action.
 */
export async function getSession(): Promise<IronSession<IronSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<IronSessionData>(cookieStore, sessionOptions);
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Returns the session user.
 */
export async function requireAuth(
  allowedRoles?: Role[]
): Promise<NonNullable<IronSessionData['user']>> {
  if (process.env.TEST_AUTH_USER) {
    try {
      const testUser = JSON.parse(process.env.TEST_AUTH_USER);
      if (allowedRoles && !allowedRoles.includes(testUser.role)) {
        throw new Error(`Unauthorized: Role ${testUser.role} is not permitted.`);
      }
      return testUser;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unauthorized:')) throw err;
    }
  }

  const session = await getSession();

  if (!session.user) {
    redirect('/login');
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect('/dashboard');
  }

  return session.user;
}

/**
 * Get current user without redirecting (returns null if not authenticated).
 */
export async function getCurrentUser(): Promise<IronSessionData['user'] | null> {
  const session = await getSession();
  return session.user ?? null;
}
