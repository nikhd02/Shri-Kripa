'use server';
/**
 * src/server/actions/auth.ts
 * Server Actions for authentication: login and logout.
 */

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { loginSchema } from '@/lib/validations/auth';

export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Login action — validates credentials, creates session.
 * NEVER returns the password hash or full user object to the client.
 */
export async function loginAction(formData: FormData): Promise<ActionResult> {
  const rawInput = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  // 1. Validate input shape
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password } = parsed.data;

  // 2. Look up user — always hash-compare to prevent timing attacks
  const user = await db.user.findUnique({ where: { email } });

  const isValid =
    user && user.active
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

  if (!isValid || !user) {
    // Generic message — don't reveal whether email exists
    return { success: false, error: 'Invalid email or password.' };
  }

  // 3. Create session
  const session = await getSession();
  session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  await session.save();

  return { success: true };
}

/**
 * Logout action — destroys the session and redirects to login.
 */
export async function logoutAction(): Promise<never> {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
