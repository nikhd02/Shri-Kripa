/**
 * src/app/(customer)/menu/loading.tsx
 * Instant luxury skeleton loading state for Shree Kripa Menu.
 */

import React from 'react';
import { Leaf } from 'lucide-react';

export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-32 animate-pulse">
      {/* Hero / Header Skeleton */}
      <section className="bg-[#7B1D1D] text-white pt-24 pb-14 px-4 border-b border-[#C9A84C]/20 relative overflow-hidden">
        <div className="container-restaurant relative z-10 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/20 border border-[#C9A84C]/30 text-xs font-bold text-[#E0C278]">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            100% Pure Vegetarian Family Dining
          </div>

          <div className="h-10 sm:h-12 w-64 mx-auto bg-white/20 rounded-xl" />
          <div className="h-5 w-48 mx-auto bg-[#C9A84C]/30 rounded-lg" />
          <div className="h-4 w-80 mx-auto bg-white/10 rounded-md" />
        </div>
      </section>

      {/* Main Container */}
      <main className="container-restaurant py-6 space-y-8">
        {/* Search Bar Skeleton */}
        <div className="space-y-4 max-w-5xl mx-auto">
          <div className="h-11 w-full bg-gray-200 rounded-xl" />
          {/* Category Pills Skeleton */}
          <div className="flex items-center gap-2 overflow-x-hidden pb-1">
            <div className="h-8 w-24 bg-gray-300 rounded-full shrink-0" />
            <div className="h-8 w-32 bg-gray-200 rounded-full shrink-0" />
            <div className="h-8 w-28 bg-gray-200 rounded-full shrink-0" />
            <div className="h-8 w-36 bg-gray-200 rounded-full shrink-0" />
            <div className="h-8 w-24 bg-gray-200 rounded-full shrink-0" />
            <div className="h-8 w-32 bg-gray-200 rounded-full shrink-0" />
          </div>
        </div>

        {/* Category Header Skeleton */}
        <div className="space-y-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 pb-2.5 border-b-2 border-[#C9A84C]/20">
            <div className="w-2.5 h-6 rounded-full bg-[#C9A84C]/50" />
            <div className="h-6 w-40 bg-gray-300 rounded-md" />
          </div>

          {/* Dishes Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-gray-200 rounded-md" />
                    <div className="h-3 w-5/6 bg-gray-100 rounded-md" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded-md" />
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-200 shrink-0" />
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="h-6 w-16 bg-gray-200 rounded-md" />
                  <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
