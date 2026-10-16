/**
 * src/app/(admin)/dashboard/menu/new/page.tsx
 * Admin page to create a new menu item.
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { MenuItemForm } from '@/components/admin/MenuItemForm';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'New Menu Item | Shree Kripa Admin',
  description: 'Add a new dish to the Shree Kripa restaurant menu.',
};

export default async function NewMenuItemPage() {
  await requireAuth([Role.ADMIN, Role.MANAGER]);

  const categories = await db.category.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  if (categories.length === 0) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white rounded-xl border border-[var(--color-border)] shadow-sm">
        <Layers className="w-12 h-12 text-[var(--color-accent)] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          No Categories Available
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          Before creating dishes, you must have at least one category configured in the system.
        </p>
        <div className="mt-6">
          <Button asChild variant="accent">
            <Link href="/dashboard/categories">Create a Category</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MenuItemForm categories={categories} />
    </div>
  );
}
