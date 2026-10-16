'use server';

/**
 * src/server/actions/menu.ts
 * Server Actions for MenuItem CRUD, availability toggle, and publishing toggle.
 */

import { revalidatePath } from 'next/cache';
import { Prisma, Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { logAdminAction } from '@/lib/audit';
import { menuItemSchema } from '@/lib/validations/menu';
import { serializeMenuItemDTO, MenuItemDTO } from '@/lib/dto/menu';

export type MenuActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully ignore when called outside Next.js request context
  }
}

/**
 * Create a new menu item with optional variants and add-ons.
 */
export async function createMenuItemAction(
  rawInput: Record<string, unknown>
): Promise<MenuActionResult> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  const parsed = menuItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    name,
    categoryId,
    slug,
    description,
    basePrice,
    imageUrl,
    isVeg,
    isAvailable,
    isPublished,
    displayOrder,
    variants,
    addOns,
  } = parsed.data;

  // Verify category exists
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return {
      success: false,
      error: 'The selected category does not exist.',
      fieldErrors: { categoryId: ['Please select a valid category.'] },
    };
  }

  // Verify slug uniqueness
  const existingSlug = await db.menuItem.findUnique({ where: { slug } });
  if (existingSlug) {
    return {
      success: false,
      error: `A menu item with the slug "${slug}" already exists.`,
      fieldErrors: { slug: ['This slug is already in use.'] },
    };
  }

  try {
    const item = await db.menuItem.create({
      data: {
        name,
        categoryId,
        slug,
        description,
        basePrice: new Prisma.Decimal(basePrice.toFixed(2)),
        imageUrl,
        isVeg,
        isAvailable,
        isPublished,
        displayOrder,
        variants: {
          create: variants.map((v) => ({
            name: v.name,
            priceModifier: new Prisma.Decimal(v.priceModifier.toFixed(2)),
            isDefault: v.isDefault,
            isAvailable: v.isAvailable,
          })),
        },
        addOns: {
          create: addOns.map((a) => ({
            name: a.name,
            price: new Prisma.Decimal(a.price.toFixed(2)),
            isAvailable: a.isAvailable,
          })),
        },
      },
      include: {
        variants: true,
        addOns: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    await logAdminAction({
      userId: user.id,
      action: 'MENU_ITEM_CREATE',
      entity: 'MenuItem',
      entityId: item.id,
      detail: {
        name: item.name,
        slug: item.slug,
        basePrice: item.basePrice.toString(),
        isPublished: item.isPublished,
        isAvailable: item.isAvailable,
      },
    });

    safeRevalidatePath('/dashboard/menu');
    safeRevalidatePath(`/dashboard/menu/${item.id}/edit`);
    safeRevalidatePath('/menu');

    return { success: true, data: serializeMenuItemDTO(item) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[MenuAction:Create] Prisma error ${err.code}:`, err.message);
      if (err.code === 'P2002') {
        return {
          success: false,
          error: `A menu item with the slug "${slug}" already exists.`,
          fieldErrors: { slug: ['This slug is already in use.'] },
        };
      }
      if (err.code === 'P2003') {
        return {
          success: false,
          error: 'The selected category is invalid or does not exist.',
          fieldErrors: { categoryId: ['Please select a valid category.'] },
        };
      }
      if (err.code === 'P2028') {
        return {
          success: false,
          error: 'The database operation timed out. Please try again.',
        };
      }
    }
    console.error('[MenuAction:Create] Unexpected error:', err);
    return {
      success: false,
      error: 'An unexpected database error occurred while creating the menu item. Please try again.',
    };
  }
}

/**
 * Update an existing menu item, including its variants and add-ons.
 */
export async function updateMenuItemAction(
  id: string,
  rawInput: Record<string, unknown>
): Promise<MenuActionResult> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  const parsed = menuItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    name,
    categoryId,
    slug,
    description,
    basePrice,
    imageUrl,
    isVeg,
    isAvailable,
    isPublished,
    displayOrder,
    variants,
    addOns,
  } = parsed.data;

  // Verify item exists
  const current = await db.menuItem.findUnique({ where: { id } });
  if (!current) {
    return { success: false, error: 'Menu item not found.' };
  }

  // Verify category exists
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return {
      success: false,
      error: 'The selected category does not exist.',
      fieldErrors: { categoryId: ['Please select a valid category.'] },
    };
  }

  // Check slug uniqueness
  if (slug !== current.slug) {
    const slugInUse = await db.menuItem.findUnique({ where: { slug } });
    if (slugInUse && slugInUse.id !== id) {
      return {
        success: false,
        error: `Another menu item is already using the slug "${slug}".`,
        fieldErrors: { slug: ['This slug is already in use by another item.'] },
      };
    }
  }

  try {
    const updated = await db.$transaction(
      async (tx) => {
        // 1. Delete existing variants and addOns for replacement
        await tx.menuVariant.deleteMany({ where: { menuItemId: id } });
        await tx.menuAddOn.deleteMany({ where: { menuItemId: id } });

        // 2. Update menuItem and insert new variants and addOns
        const item = await tx.menuItem.update({
          where: { id },
          data: {
            name,
            categoryId,
            slug,
            description,
            basePrice: new Prisma.Decimal(basePrice.toFixed(2)),
            imageUrl,
            isVeg,
            isAvailable,
            isPublished,
            displayOrder,
            variants: {
              create: variants.map((v) => ({
                name: v.name,
                priceModifier: new Prisma.Decimal(v.priceModifier.toFixed(2)),
                isDefault: v.isDefault,
                isAvailable: v.isAvailable,
              })),
            },
            addOns: {
              create: addOns.map((a) => ({
                name: a.name,
                price: new Prisma.Decimal(a.price.toFixed(2)),
                isAvailable: a.isAvailable,
              })),
            },
          },
          include: {
            variants: true,
            addOns: true,
            category: { select: { id: true, name: true, slug: true } },
          },
        });

        return item;
      },
      { maxWait: 10000, timeout: 30000 }
    );

    await logAdminAction({
      userId: user.id,
      action: 'MENU_ITEM_UPDATE',
      entity: 'MenuItem',
      entityId: id,
      detail: {
        name: updated.name,
        slug: updated.slug,
        basePrice: updated.basePrice.toString(),
        isPublished: updated.isPublished,
        isAvailable: updated.isAvailable,
      },
    });

    safeRevalidatePath('/dashboard/menu');
    safeRevalidatePath(`/dashboard/menu/${id}/edit`);
    safeRevalidatePath('/menu');

    return { success: true, data: serializeMenuItemDTO(updated) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[MenuAction:Update] Prisma error ${err.code}:`, err.message);
      if (err.code === 'P2002') {
        return {
          success: false,
          error: `Another menu item is already using the slug "${slug}".`,
          fieldErrors: { slug: ['This slug is already in use by another item.'] },
        };
      }
      if (err.code === 'P2003') {
        return {
          success: false,
          error: 'The selected category is invalid or does not exist.',
          fieldErrors: { categoryId: ['Please select a valid category.'] },
        };
      }
      if (err.code === 'P2028') {
        return {
          success: false,
          error: 'The database operation timed out. Please try again.',
        };
      }
    }
    console.error('[MenuAction:Update] Unexpected error:', err);
    return {
      success: false,
      error: 'An unexpected database error occurred while updating the menu item. Please try again.',
    };
  }
}

/**
 * Toggle menu item availability (can be performed by staff or kitchen).
 */
export async function toggleMenuItemAvailabilityAction(
  id: string,
  isAvailable: boolean
): Promise<MenuActionResult> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER, Role.STAFF, Role.KITCHEN]);

  try {
    const updated = await db.menuItem.update({
      where: { id },
      data: { isAvailable },
    });

    await logAdminAction({
      userId: user.id,
      action: 'MENU_ITEM_TOGGLE_AVAILABILITY',
      entity: 'MenuItem',
      entityId: id,
      detail: { isAvailable },
    });

    safeRevalidatePath('/dashboard/menu');
    safeRevalidatePath(`/dashboard/menu/${id}/edit`);
    safeRevalidatePath('/menu');

    return { success: true, data: serializeMenuItemDTO(updated) };
  } catch (err) {
    console.error('Failed to toggle availability:', err);
    return { success: false, error: 'Failed to update item availability.' };
  }
}

/**
 * Toggle menu item published state (restricted to Admin & Manager).
 */
export async function toggleMenuItemPublishedAction(
  id: string,
  isPublished: boolean
): Promise<MenuActionResult<MenuItemDTO>> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  try {
    const updated = await db.menuItem.update({
      where: { id },
      data: { isPublished },
    });

    await logAdminAction({
      userId: user.id,
      action: 'MENU_ITEM_TOGGLE_PUBLISHED',
      entity: 'MenuItem',
      entityId: id,
      detail: { isPublished },
    });

    safeRevalidatePath('/dashboard/menu');
    safeRevalidatePath(`/dashboard/menu/${id}/edit`);
    safeRevalidatePath('/menu');

    return { success: true, data: serializeMenuItemDTO(updated) };
  } catch (err) {
    console.error('Failed to toggle published state:', err);
    return { success: false, error: 'Failed to update publication status.' };
  }
}

/**
 * Delete a menu item. If historical order items reference it, prevent deletion and advise unpublishing.
 */
export async function deleteMenuItemAction(id: string): Promise<MenuActionResult<MenuItemDTO>> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  // Check for historical order items
  const orderCount = await db.orderItem.count({ where: { menuItemId: id } });
  if (orderCount > 0) {
    return {
      success: false,
      error: `Cannot delete this menu item because it is referenced in ${orderCount} historical order(s). Please unpublish or mark it unavailable instead to preserve audit records.`,
    };
  }

  try {
    const deleted = await db.menuItem.delete({ where: { id } });

    await logAdminAction({
      userId: user.id,
      action: 'MENU_ITEM_DELETE',
      entity: 'MenuItem',
      entityId: id,
      detail: { name: deleted.name, slug: deleted.slug },
    });

    safeRevalidatePath('/dashboard/menu');
    safeRevalidatePath('/menu');

    return { success: true, data: serializeMenuItemDTO(deleted) };
  } catch (err) {
    console.error('Failed to delete menu item:', err);
    return { success: false, error: 'Failed to delete menu item.' };
  }
}
