/**
 * src/app/(admin)/dashboard/menu/page.tsx
 * Admin Menu Management listing page.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { serializeMenuItemDTO } from '@/lib/dto/menu';
import { MenuListClient } from './MenuListClient';

export const metadata: Metadata = {
  title: 'Menu Management | Shree Kripa Admin',
  description: 'Manage dishes, prices, portion sizes, dietary tags, and live menu publishing.',
};

export default async function AdminMenuPage() {
  await requireAuth([Role.ADMIN, Role.MANAGER]);

  // Fetch categories for filter dropdown
  const categories = await db.category.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  // Fetch all menu items with category, variants, and add-ons
  const items = await db.menuItem.findMany({
    orderBy: [
      { category: { displayOrder: 'asc' } },
      { displayOrder: 'asc' },
      { name: 'asc' },
    ],
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      variants: {
        select: { id: true, menuItemId: true, name: true, priceModifier: true, isDefault: true, isAvailable: true, createdAt: true, updatedAt: true },
      },
      addOns: {
        select: { id: true, menuItemId: true, name: true, price: true, isAvailable: true, createdAt: true, updatedAt: true },
      },
    },
  });

  // Explicitly serialize every Prisma Decimal and Date to primitive strings
  const serializedItems = items.map(serializeMenuItemDTO);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[var(--color-border)]">
        <h1
          className="text-2xl font-bold text-[var(--color-text-primary)]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Menu Management
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Create, edit, and organize restaurant dishes. Control live publishing and kitchen availability in real time.
        </p>
      </div>

      <MenuListClient
        initialItems={serializedItems}
        categories={categories}
      />
    </div>
  );
}
