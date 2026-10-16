/**
 * src/app/(admin)/dashboard/categories/page.tsx
 * Admin Category Management page.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { CategoryManagerClient } from './CategoryManagerClient';

export const metadata: Metadata = {
  title: 'Category Management | Shree Kripa Admin',
  description: 'Manage menu categories, reorder, and configure publication for Shree Kripa.',
};

export default async function CategoriesPage() {
  await requireAuth([Role.ADMIN, Role.MANAGER]);

  const categories = await db.category.findMany({
    orderBy: { displayOrder: 'asc' },
    include: {
      _count: {
        select: { menuItems: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1
            className="text-2xl font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Category Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Organize dishes into sections, manage display order, and activate categories for the public menu.
          </p>
        </div>
      </div>

      <CategoryManagerClient initialCategories={categories} />
    </div>
  );
}
