/**
 * src/lib/validations/menu.ts
 * Zod validation schemas for categories and menu items.
 */

import { z } from 'zod';
import { slugify } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Category Schemas
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required.')
    .max(100, 'Category name cannot exceed 100 characters.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required.')
    .max(100, 'Slug cannot exceed 100 characters.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase letters, numbers, and hyphens.')
    .transform((val) => slugify(val)),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters.')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  imageUrl: z
    .string()
    .trim()
    .url('Image URL must be a valid URL.')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val && val.length > 0 ? val : null)),
  displayOrder: z.coerce
    .number()
    .int('Display order must be an integer.')
    .min(0, 'Display order cannot be negative.')
    .default(0),
  active: z.coerce.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const reorderCategoriesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      displayOrder: z.number().int().min(0),
    })
  ),
});

// ---------------------------------------------------------------------------
// Menu Variant & AddOn Schemas
// ---------------------------------------------------------------------------

export const menuVariantSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Variant name is required.')
    .max(100, 'Variant name cannot exceed 100 characters.'),
  priceModifier: z.coerce
    .number({ invalid_type_error: 'Price modifier must be a number.' })
    .finite('Price modifier must be a finite number.')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Price modifier can have at most 2 decimal places.',
    })
    .default(0),
  isDefault: z.coerce.boolean().default(false),
  isAvailable: z.coerce.boolean().default(true),
});

export const menuAddOnSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Add-on name is required.')
    .max(100, 'Add-on name cannot exceed 100 characters.'),
  price: z.coerce
    .number({ invalid_type_error: 'Add-on price must be a number.' })
    .min(0, 'Add-on price cannot be negative.')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Add-on price can have at most 2 decimal places.',
    }),
  isAvailable: z.coerce.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Menu Item Schema
// ---------------------------------------------------------------------------

export const menuItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Item name is required.')
    .max(200, 'Item name cannot exceed 200 characters.'),
  categoryId: z.string().min(1, 'Category is required.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required.')
    .max(200, 'Slug cannot exceed 200 characters.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase letters, numbers, and hyphens.')
    .transform((val) => slugify(val)),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters.')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  basePrice: z.coerce
    .number({ invalid_type_error: 'Base price must be a valid number.' })
    .min(0, 'Base price cannot be negative.')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Price can have at most 2 decimal places.',
    }),
  imageUrl: z
    .string()
    .trim()
    .url('Image URL must be a valid URL.')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val && val.length > 0 ? val : null)),
  isVeg: z.coerce.boolean().default(true),
  isAvailable: z.coerce.boolean().default(true),
  isPublished: z.coerce.boolean().default(false),
  displayOrder: z.coerce
    .number()
    .int('Display order must be an integer.')
    .min(0, 'Display order cannot be negative.')
    .default(0),
  variants: z.array(menuVariantSchema).optional().default([]),
  addOns: z.array(menuAddOnSchema).optional().default([]),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;
