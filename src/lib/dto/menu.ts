/**
 * src/lib/dto/menu.ts
 * Typed Data Transfer Objects (DTOs) and serialization helpers for Menu Items,
 * Variants, and Add-ons. Converts Prisma Decimals and Dates to serializable primitives.
 */

import { MenuItem, MenuVariant, MenuAddOn } from '@prisma/client';
import { toDecimalString } from './order';

export interface MenuVariantDTO {
  id: string;
  menuItemId: string;
  name: string;
  priceModifier: string;
  isDefault: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuAddOnDTO {
  id: string;
  menuItemId: string;
  name: string;
  price: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemDTO {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: string;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: MenuVariantDTO[];
  addOns: MenuAddOnDTO[];
}

export function serializeMenuVariantDTO(v: MenuVariant): MenuVariantDTO {
  return {
    id: v.id,
    menuItemId: v.menuItemId,
    name: v.name,
    priceModifier: toDecimalString(v.priceModifier),
    isDefault: v.isDefault,
    isAvailable: v.isAvailable,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

export function serializeMenuAddOnDTO(a: MenuAddOn): MenuAddOnDTO {
  return {
    id: a.id,
    menuItemId: a.menuItemId,
    name: a.name,
    price: toDecimalString(a.price),
    isAvailable: a.isAvailable,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function serializeMenuItemDTO(
  item: MenuItem & {
    variants?: MenuVariant[];
    addOns?: MenuAddOn[];
    category?: { id: string; name: string; slug: string } | null;
  }
): MenuItemDTO {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    slug: item.slug,
    description: item.description,
    basePrice: toDecimalString(item.basePrice),
    imageUrl: item.imageUrl,
    isVeg: item.isVeg,
    isAvailable: item.isAvailable,
    isPublished: item.isPublished,
    displayOrder: item.displayOrder,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    category: item.category
      ? { id: item.category.id, name: item.category.name, slug: item.category.slug }
      : { id: item.categoryId, name: '', slug: '' },
    variants: (item.variants || []).map(serializeMenuVariantDTO),
    addOns: (item.addOns || []).map(serializeMenuAddOnDTO),
  };
}
