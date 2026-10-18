'use server';
/**
 * src/server/actions/staff.ts
 * Server Actions for staff account management.
 * Strictly restricted to ADMIN role.
 */

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { createUserSchema, updateUserSchema } from '@/lib/validations/auth';

export type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export interface StaffDTO {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'KITCHEN';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new staff account.
 */
export async function createStaffAction(
  rawData: unknown
): Promise<ActionResult<{ user: StaffDTO }>> {
  // 1. Authorize: only ADMIN can manage staff
  const currentUser = await requireAuth(['ADMIN']);

  // 2. Validate input
  const parsed = createUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password, role } = parsed.data;

  try {
    // 3. Check for duplicate email
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return {
        success: false,
        fieldErrors: {
          email: ['A staff member with this email already exists.'],
        },
      };
    }

    // 4. Hash password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Create user in database
    const newUser = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        active: true,
      },
    });

    // 6. Record audit log
    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_STAFF',
        entity: 'User',
        entityId: newUser.id,
        detail: `Created ${role} account for ${name} (${email})`,
      },
    });

    revalidatePath('/dashboard/staff');

    return {
      success: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          active: newUser.active,
          createdAt: newUser.createdAt.toISOString(),
          updatedAt: newUser.updatedAt.toISOString(),
        },
      },
    };
  } catch (error) {
    console.error('[createStaffAction] Error creating staff account:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while creating the staff account.',
    };
  }
}

/**
 * Update an existing staff account details.
 */
export async function updateStaffAction(
  rawData: unknown
): Promise<ActionResult<{ user: StaffDTO }>> {
  // 1. Authorize: only ADMIN can manage staff
  const currentUser = await requireAuth(['ADMIN']);

  // 2. Validate input
  const parsed = updateUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, name, email, role, active, password } = parsed.data;

  try {
    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { success: false, error: 'Staff member not found.' };
    }

    // Protection: Prevent admin from deactivating themselves
    if (currentUser.id === id && active === false) {
      return {
        success: false,
        error: 'You cannot deactivate your own administrative account.',
      };
    }

    // Protection: If changing role away from ADMIN, ensure at least one other active ADMIN exists
    if (targetUser.role === 'ADMIN' && role !== 'ADMIN') {
      const activeAdminCount = await db.user.count({
        where: { role: 'ADMIN', active: true },
      });
      if (activeAdminCount <= 1) {
        return {
          success: false,
          error: 'Cannot demote the only remaining active Administrator in the system.',
        };
      }
    }

    // Check email uniqueness if email changed
    if (email !== targetUser.email) {
      const emailConflict = await db.user.findUnique({ where: { email } });
      if (emailConflict && emailConflict.id !== id) {
        return {
          success: false,
          fieldErrors: {
            email: ['Another staff account already uses this email address.'],
          },
        };
      }
    }

    // Prepare update data
    const updateData: {
      name: string;
      email: string;
      role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'KITCHEN';
      active?: boolean;
      passwordHash?: string;
    } = {
      name,
      email,
      role,
    };

    if (active !== undefined) {
      updateData.active = active;
    }

    if (password && password.trim().length >= 8) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
    });

    // Record audit log
    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_STAFF',
        entity: 'User',
        entityId: id,
        detail: `Updated details for ${name} (${role}, active: ${updated.active})`,
      },
    });

    revalidatePath('/dashboard/staff');

    return {
      success: true,
      data: {
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          active: updated.active,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      },
    };
  } catch (error) {
    console.error('[updateStaffAction] Error updating staff account:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while updating the staff account.',
    };
  }
}

/**
 * Toggle staff active/inactive status.
 */
export async function toggleStaffStatusAction(
  id: string,
  active: boolean
): Promise<ActionResult> {
  const currentUser = await requireAuth(['ADMIN']);

  if (currentUser.id === id && !active) {
    return {
      success: false,
      error: 'You cannot deactivate your own administrative account.',
    };
  }

  try {
    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { success: false, error: 'Staff member not found.' };
    }

    if (targetUser.role === 'ADMIN' && !active) {
      const activeAdminCount = await db.user.count({
        where: { role: 'ADMIN', active: true },
      });
      if (activeAdminCount <= 1) {
        return {
          success: false,
          error: 'Cannot deactivate the only active Administrator in the system.',
        };
      }
    }

    await db.user.update({
      where: { id },
      data: { active },
    });

    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: active ? 'ACTIVATE_STAFF' : 'DEACTIVATE_STAFF',
        entity: 'User',
        entityId: id,
        detail: `${active ? 'Activated' : 'Deactivated'} staff account ${targetUser.email}`,
      },
    });

    revalidatePath('/dashboard/staff');
    return { success: true };
  } catch (error) {
    console.error('[toggleStaffStatusAction] Error toggling staff status:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while changing account status.',
    };
  }
}

/**
 * Delete a staff account permanently.
 */
export async function deleteStaffAction(id: string): Promise<ActionResult> {
  const currentUser = await requireAuth(['ADMIN']);

  if (currentUser.id === id) {
    return {
      success: false,
      error: 'You cannot delete your own administrative account.',
    };
  }

  try {
    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { success: false, error: 'Staff member not found.' };
    }

    if (targetUser.role === 'ADMIN') {
      const activeAdminCount = await db.user.count({
        where: { role: 'ADMIN', active: true },
      });
      if (activeAdminCount <= 1) {
        return {
          success: false,
          error: 'Cannot delete the only remaining Administrator.',
        };
      }
    }

    // Set null on related audit logs and delete user
    await db.user.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_STAFF',
        entity: 'User',
        entityId: id,
        detail: `Deleted staff account ${targetUser.name} (${targetUser.email})`,
      },
    });

    revalidatePath('/dashboard/staff');
    return { success: true };
  } catch (error) {
    console.error('[deleteStaffAction] Error deleting staff account:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the staff account.',
    };
  }
}
