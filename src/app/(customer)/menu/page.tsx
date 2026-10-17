/**
 * src/app/(customer)/menu/page.tsx
 * Public menu and QR table ordering page for Shree Kripa Family Restaurant & Banquet.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Leaf, Phone, MapPin } from 'lucide-react';
import { verifyTableToken } from '@/server/actions/tables';
import {
  getCachedPublicMenuCategories,
  getCachedRestaurantSettings,
} from '@/server/queries/publicMenu';
import { PublicMenuClient } from './PublicMenuClient';

export const metadata: Metadata = {
  title: 'Menu & Table Ordering | Shree Kripa Family Restaurant & Banquet',
  description:
    'Explore our 100% pure vegetarian menu and order directly from your table at Shree Kripa, Akhari Bypass, Varanasi.',
};

export const dynamic = 'force-dynamic';

interface PublicMenuPageProps {
  searchParams?: Promise<{ table?: string }>;
}

export default async function PublicMenuPage(props: PublicMenuPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const rawTableToken = searchParams?.table;

  // Verify table token if present
  let verifiedTable: {
    id: string;
    tableNumber: string;
    capacity: number;
    qrToken: string;
  } | null = null;

  let isInvalidTableToken = false;

  if (rawTableToken) {
    try {
      verifiedTable = await verifyTableToken(rawTableToken);
      if (!verifiedTable) {
        isInvalidTableToken = true;
      }
    } catch (err) {
      console.error('[PublicMenuPage] Error verifying table token:', err);
      isInvalidTableToken = true;
    }
  }

  // Fetch cached settings and menu categories in parallel
  let settings = {
    taxRate: 5,
    taxLabel: 'GST',
    phone1: '9415268463',
    phone2: '9125669366',
    address: 'Akhari Bypass, Near Flyover, Varanasi',
    googleMapsUrl: 'https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA',
  };
  let serializedCategories: typeof import('@/server/queries/publicMenu').getCachedPublicMenuCategories extends () => Promise<infer T> ? T : never = [];
  let dbErrorMessage: string | null = null;

  try {
    const [fetchedSettings, fetchedCategories] = await Promise.all([
      getCachedRestaurantSettings(),
      getCachedPublicMenuCategories(),
    ]);
    settings = fetchedSettings;
    serializedCategories = fetchedCategories;
  } catch (err: unknown) {
    dbErrorMessage = err instanceof Error ? err.message : String(err);
    console.error('[PublicMenuPage] Database query error:', dbErrorMessage);
  }

  const taxRate = settings.taxRate;
  const taxLabel = settings.taxLabel;

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-32">
      {/* Hero / Header Introduction */}
      <section className="bg-[var(--color-primary)] text-white pt-24 pb-14 px-4 border-b border-[var(--color-accent)]/20 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container-restaurant relative z-10 text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 border border-[var(--color-accent-light)]/50 text-xs font-bold text-[var(--color-accent-light)] shadow-xs">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            100% Pure Vegetarian Family Dining
          </div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Restaurant Menu
          </h1>

          <p className="text-[var(--color-accent-light)] font-semibold text-base sm:text-lg tracking-wide" lang="hi">
            श्री कृपा फैमिली रेस्टोरेंट एंड बैंक्वेट
          </p>

          <p className="text-white/95 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-medium">
            Traditional flavours and modern delights prepared fresh with pure ingredients.
            Order directly to your table or browse our menu.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-white/90 font-medium">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[var(--color-accent-light)]" />
              Akhari Bypass, Varanasi
            </span>
            <span>•</span>
            <a
              href="tel:+919415268463"
              className="flex items-center gap-1.5 text-[var(--color-accent-light)] hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4 text-[var(--color-accent-light)]" />
              9415268463 / 9125669366
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container-restaurant py-6 space-y-6">
        {dbErrorMessage && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs max-w-3xl mx-auto space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              Database Connection Notice
            </div>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Unable to connect to the database from Vercel:
            </p>
            <ul className="text-xs list-disc list-inside space-y-1 text-amber-900 font-medium">
              <li>
                <strong>Vercel Environment Variables:</strong> Ensure <code className="bg-amber-100 px-1 py-0.5 rounded">DATABASE_URL</code> is added in Vercel Project Settings &gt; Environment Variables.
              </li>
              <li>
                <strong>cPanel Remote MySQL:</strong> In your cPanel hosting under <em>Remote MySQL</em>, add <code className="bg-amber-100 px-1 py-0.5 rounded">%</code> to allow Vercel&apos;s dynamic serverless IPs.
              </li>
            </ul>
            <p className="text-xs text-amber-700 pt-1">
              Check live status at <a href="/api/health" className="underline font-bold text-amber-900" target="_blank" rel="noopener noreferrer">/api/health</a>.
            </p>
          </div>
        )}

        <PublicMenuClient
          categories={serializedCategories}
          verifiedTable={verifiedTable}
          isInvalidTableToken={isInvalidTableToken}
          taxRate={taxRate}
          taxLabel={taxLabel}
        />
      </main>
    </div>
  );
}
