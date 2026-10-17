'use client';

/**
 * src/app/(customer)/menu/error.tsx
 * Graceful error boundary for the customer menu page.
 */

import React, { useEffect } from 'react';
import Link from 'next/link';
import { UtensilsCrossed, RefreshCw, Phone, Home } from 'lucide-react';

export default function MenuError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[MenuErrorBoundary] Uncaught menu error:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#FFFDF9]">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-[#C9A84C]/30 shadow-lg space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#7B1D1D]/10 text-[#7B1D1D] mx-auto flex items-center justify-center">
          <UtensilsCrossed className="w-8 h-8 stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <h2
            className="text-2xl font-bold text-[#7B1D1D]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Unable to Load Menu
          </h2>
          <p className="text-sm text-[#5C4540] leading-relaxed">
            We are having a temporary issue connecting to our kitchen servers. Please refresh or contact our restaurant directly to place your order.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7B1D1D] text-white text-sm font-bold shadow-md hover:bg-[#5D1616] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-all"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-xs text-gray-500 font-medium">Or order directly via phone:</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#7B1D1D]">
            <a
              href="tel:+919415268463"
              className="flex items-center gap-1.5 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              9415268463
            </a>
            <span>•</span>
            <a
              href="tel:+919125669366"
              className="flex items-center gap-1.5 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              9125669366
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
