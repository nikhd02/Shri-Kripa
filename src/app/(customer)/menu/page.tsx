/**
 * src/app/(customer)/menu/page.tsx
 * Public menu and QR table ordering page for Shree Kripa Family Restaurant & Banquet.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Leaf, Phone, MapPin } from 'lucide-react';
import { db } from '@/lib/db';
import { verifyTableToken } from '@/server/actions/tables';
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
    verifiedTable = await verifyTableToken(rawTableToken);
    if (!verifiedTable) {
      isInvalidTableToken = true;
    }
  }

  // Fetch restaurant settings for tax calculations
  const settings = await db.restaurantSettings.findFirst();
  const taxRate = settings?.taxRate ? Number(settings.taxRate) : 0;
  const taxLabel = settings?.taxLabel || 'GST';

  // Fetch only ACTIVE categories and only PUBLISHED items within them
  const activeCategories = await db.category.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
    include: {
      menuItems: {
        where: { isPublished: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          variants: {
            where: { isAvailable: true },
            orderBy: { createdAt: 'asc' },
          },
          addOns: {
            where: { isAvailable: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  // Serialize Decimals for Client Component
  const serializedCategories = activeCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    items: cat.menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      basePrice: item.basePrice.toString(),
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      displayOrder: item.displayOrder,
      variants: item.variants.map((v) => ({
        id: v.id,
        name: v.name,
        priceModifier: v.priceModifier.toString(),
        isDefault: v.isDefault,
        isAvailable: v.isAvailable,
      })),
      addOns: item.addOns.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price.toString(),
        isAvailable: a.isAvailable,
      })),
    })),
  }));

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
      <main className="container-restaurant py-6">
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
