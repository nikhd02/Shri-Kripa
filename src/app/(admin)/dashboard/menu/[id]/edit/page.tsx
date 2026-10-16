/**
 * src/app/(admin)/dashboard/menu/[id]/edit/page.tsx
 * Admin page to edit an existing menu item.
 */

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { MenuItemForm, type InitialMenuItemData } from '@/components/admin/MenuItemForm';

export const metadata: Metadata = {
  title: 'Edit Menu Item | Shree Kripa Admin',
  description: 'Modify dish details, pricing, variants, and availability.',
};

interface EditMenuItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMenuItemPage({ params }: EditMenuItemPageProps) {
  await requireAuth([Role.ADMIN, Role.MANAGER]);
  const { id } = await params;

  // Fetch menu item
  const item = await db.menuItem.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { createdAt: 'asc' },
      },
      addOns: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!item) {
    notFound();
  }

  // Fetch categories
  const categories = await db.category.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  const initialData: InitialMenuItemData = {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    slug: item.slug,
    description: item.description,
    basePrice: item.basePrice.toString(),
    imageUrl: item.imageUrl,
    isVeg: item.isVeg,
    isAvailable: item.isAvailable,
    isPublished: item.isPublished,
    displayOrder: item.displayOrder,
    variants: item.variants.map((v) => ({
      id: v.id,
      name: v.name,
      priceModifier: Number(v.priceModifier),
      isDefault: v.isDefault,
      isAvailable: v.isAvailable,
    })),
    addOns: item.addOns.map((a) => ({
      id: a.id,
      name: a.name,
      price: Number(a.price),
      isAvailable: a.isAvailable,
    })),
  };

  return (
    <div className="space-y-6">
      <MenuItemForm categories={categories} initialData={initialData} />
    </div>
  );
}
