'use server';

/**
 * src/server/actions/categories.ts
 * Server Actions for Category CRUD, reordering, and active state toggling.
 */

import { revalidatePath } from 'next/cache';
import { Prisma, Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { logAdminAction } from '@/lib/audit';
import { categorySchema } from '@/lib/validations/menu';

export type CategoryActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Create a new menu category.
 */
export async function createCategoryAction(
  rawInput: Record<string, unknown>
): Promise<CategoryActionResult> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  const parsed = categorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, slug, description, imageUrl, displayOrder, active } = parsed.data;

  // Check unique slug before insert to avoid unnecessary constraint throw
  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) {
    return {
      success: false,
      error: `A category with the slug "${slug}" already exists. Please choose a different slug.`,
      fieldErrors: { slug: ['This slug is already in use.'] },
    };
  }

  try {
    const category = await db.category.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        displayOrder,
        active,
      },
    });

    await logAdminAction({
      userId: user.id,
      action: 'CATEGORY_CREATE',
      entity: 'Category',
      entityId: category.id,
      detail: { name, slug, active },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/menu');
    revalidatePath('/menu');

    return { success: true, data: category };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return {
        success: false,
        error: `A category with the slug "${slug}" already exists.`,
        fieldErrors: { slug: ['This slug is already in use.'] },
      };
    }
    console.error('Failed to create category:', err);
    return { success: false, error: 'An unexpected database error occurred while creating the category.' };
  }
}

/**
 * Update an existing menu category.
 */
export async function updateCategoryAction(
  id: string,
  rawInput: Record<string, unknown>
): Promise<CategoryActionResult> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  const parsed = categorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, slug, description, imageUrl, displayOrder, active } = parsed.data;

  // Verify category exists
  const current = await db.category.findUnique({ where: { id } });
  if (!current) {
    return { success: false, error: 'Category not found.' };
  }

  // Check if new slug collides with another category
  if (slug !== current.slug) {
    const slugInUse = await db.category.findUnique({ where: { slug } });
    if (slugInUse && slugInUse.id !== id) {
      return {
        success: false,
        error: `Another category is already using the slug "${slug}".`,
        fieldErrors: { slug: ['This slug is already in use by another category.'] },
      };
    }
  }

  try {
    const updated = await db.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        imageUrl,
        displayOrder,
        active,
      },
    });

    await logAdminAction({
      userId: user.id,
      action: 'CATEGORY_UPDATE',
      entity: 'Category',
      entityId: id,
      detail: { name, slug, active },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/menu');
    revalidatePath('/menu');

    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return {
        success: false,
        error: `Another category is already using the slug "${slug}".`,
        fieldErrors: { slug: ['This slug is already in use by another category.'] },
      };
    }
    console.error('Failed to update category:', err);
    return { success: false, error: 'An unexpected database error occurred while updating the category.' };
  }
}

/**
 * Toggle category active status.
 */
export async function toggleCategoryActiveAction(
  id: string,
  active: boolean
): Promise<CategoryActionResult> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  try {
    const updated = await db.category.update({
      where: { id },
      data: { active },
    });

    await logAdminAction({
      userId: user.id,
      action: 'CATEGORY_TOGGLE_ACTIVE',
      entity: 'Category',
      entityId: id,
      detail: { active },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/menu');
    revalidatePath('/menu');

    return { success: true, data: updated };
  } catch (err) {
    console.error('Failed to toggle category active status:', err);
    return { success: false, error: 'Failed to update category status.' };
  }
}

/**
 * Delete a category. Strictly prevents deletion if any menu items are assigned.
 */
export async function deleteCategoryAction(id: string): Promise<CategoryActionResult> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  // Check if any menu items are assigned to this category
  const itemCount = await db.menuItem.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    return {
      success: false,
      error: `Cannot delete this category because it contains ${itemCount} menu item(s). Reassign or delete those items first.`,
    };
  }

  try {
    const deleted = await db.category.delete({ where: { id } });

    await logAdminAction({
      userId: user.id,
      action: 'CATEGORY_DELETE',
      entity: 'Category',
      entityId: id,
      detail: { name: deleted.name, slug: deleted.slug },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/menu');
    revalidatePath('/menu');

    return { success: true, data: deleted };
  } catch (err) {
    console.error('Failed to delete category:', err);
    return { success: false, error: 'Failed to delete category. It may have associated records.' };
  }
}

/**
 * Reorder categories in bulk.
 */
export async function reorderCategoriesAction(
  items: { id: string; displayOrder: number }[]
): Promise<CategoryActionResult> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  try {
    await db.$transaction(
      items.map((item) =>
        db.category.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    await logAdminAction({
      userId: user.id,
      action: 'CATEGORY_REORDER',
      entity: 'Category',
      detail: { count: items.length },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/menu');
    revalidatePath('/menu');

    return { success: true };
  } catch (err) {
    console.error('Failed to reorder categories:', err);
    return { success: false, error: 'Failed to reorder categories.' };
  }
}
