'use client';
/**
 * src/app/login/LoginForm.tsx
 * Client component for the login form with loading/error states.
 * Uses useActionState (React 19) with a server action.
 */

import React, { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginAction, type ActionResult } from '@/server/actions/auth';

const initialState: ActionResult = { success: false };

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);

  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
      const result = await loginAction(formData);
      if (result.success) {
        router.push('/dashboard');
      }
      return result;
    },
    initialState
  );

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 shadow-[var(--shadow-xl)]">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 mb-4">
          <UtensilsCrossed className="w-7 h-7 text-[var(--color-accent)]" />
        </div>
        <h1
          className="text-white text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Staff Login
        </h1>
        <p className="text-white/85 text-sm mt-1 font-medium">Shree Kripa Restaurant</p>
      </div>

      {/* Error alert */}
      {state.error && !state.success && (
        <div
          role="alert"
          className="mb-6 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm font-medium"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} noValidate>
        <div className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-semibold text-white/95 mb-1.5"
            >
              Email address <span className="text-red-300" aria-hidden="true">*</span>
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@shreekripa.in"
              className="w-full h-11 rounded-lg border border-white/30 bg-white/10 px-3 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-colors"
              aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
              aria-invalid={!!state.fieldErrors?.email}
            />
            {state.fieldErrors?.email && (
              <p id="email-error" className="mt-1 text-xs text-red-300 font-medium" role="alert">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold text-white/95 mb-1.5"
            >
              Password <span className="text-red-300" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full h-11 rounded-lg border border-white/30 bg-white/10 px-3 pr-10 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-colors"
                aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
                aria-invalid={!!state.fieldErrors?.password}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {state.fieldErrors?.password && (
              <p id="password-error" className="mt-1 text-xs text-red-300 font-medium" role="alert">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            variant="accent"
            loading={isPending}
            className="w-full"
          >
            <LogIn className="w-4 h-4" />
            {isPending ? 'Signing in…' : 'Sign In'}
          </Button>
        </div>
      </form>

      <p className="text-center text-white/70 text-xs mt-6 font-medium">
        This area is restricted to authorized staff only.
      </p>
    </div>
  );
}
