'use server';

/**
 * src/server/actions/tables.ts
 * Server actions for table management, QR token generation, and table verification.
 */

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { Prisma, Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { logAdminAction } from '@/lib/audit';
import { tableSchema } from '@/lib/validations/table';
import { serializeTableDTO, TableDTO } from '@/lib/dto/table';

export type TableActionResult<T = unknown> = {
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

function generateUniqueQrToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create a new restaurant table.
 */
export async function createTableAction(
  rawInput: Record<string, unknown>
): Promise<TableActionResult<TableDTO>> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  const parsed = tableSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { tableNumber, capacity, isActive, onlineBookingEnabled } = parsed.data;

  // Check unique table number
  const existing = await db.restaurantTable.findUnique({ where: { tableNumber } });
  if (existing) {
    return {
      success: false,
      error: `Table number "${tableNumber}" already exists.`,
      fieldErrors: { tableNumber: ['This table number is already in use.'] },
    };
  }

  try {
    const table = await db.restaurantTable.create({
      data: {
        tableNumber,
        capacity,
        isActive,
        onlineBookingEnabled,
        qrToken: generateUniqueQrToken(),
      },
    });

    await logAdminAction({
      userId: user.id,
      action: 'TABLE_CREATE',
      entity: 'RestaurantTable',
      entityId: table.id,
      detail: { tableNumber, capacity, isActive, onlineBookingEnabled },
    });

    safeRevalidatePath('/dashboard/tables');
    safeRevalidatePath('/dashboard/bookings');
    return { success: true, data: serializeTableDTO(table) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return {
        success: false,
        error: `Table number "${tableNumber}" already exists.`,
        fieldErrors: { tableNumber: ['This table number is already in use.'] },
      };
    }
    console.error('[TableAction:Create] Unexpected error:', err);
    return { success: false, error: 'Failed to create table. Please try again.' };
  }
}

/**
 * Update an existing table.
 */
export async function updateTableAction(
  id: string,
  rawInput: Record<string, unknown>
): Promise<TableActionResult<TableDTO>> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  const parsed = tableSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { tableNumber, capacity, isActive, onlineBookingEnabled } = parsed.data;

  const current = await db.restaurantTable.findUnique({ where: { id } });
  if (!current) {
    return { success: false, error: 'Table not found.' };
  }

  // Check duplicate table number
  if (tableNumber !== current.tableNumber) {
    const existing = await db.restaurantTable.findUnique({ where: { tableNumber } });
    if (existing && existing.id !== id) {
      return {
        success: false,
        error: `Table number "${tableNumber}" is already in use by another table.`,
        fieldErrors: { tableNumber: ['This table number is already in use.'] },
      };
    }
  }

  try {
    const updated = await db.restaurantTable.update({
      where: { id },
      data: {
        tableNumber,
        capacity,
        isActive,
        onlineBookingEnabled,
      },
    });

    await logAdminAction({
      userId: user.id,
      action: 'TABLE_UPDATE',
      entity: 'RestaurantTable',
      entityId: id,
      detail: { tableNumber, capacity, isActive, onlineBookingEnabled },
    });

    safeRevalidatePath('/dashboard/tables');
    safeRevalidatePath('/dashboard/bookings');
    return { success: true, data: serializeTableDTO(updated) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return {
        success: false,
        error: `Table number "${tableNumber}" already exists.`,
        fieldErrors: { tableNumber: ['This table number is already in use.'] },
      };
    }
    console.error('[TableAction:Update] Unexpected error:', err);
    return { success: false, error: 'Failed to update table.' };
  }
}

/**
 * Toggle table active state.
 */
export async function toggleTableActiveAction(
  id: string,
  isActive: boolean
): Promise<TableActionResult<TableDTO>> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  try {
    const updated = await db.restaurantTable.update({
      where: { id },
      data: { isActive },
    });

    await logAdminAction({
      userId: user.id,
      action: 'TABLE_TOGGLE_ACTIVE',
      entity: 'RestaurantTable',
      entityId: id,
      detail: { isActive },
    });

    safeRevalidatePath('/dashboard/tables');
    safeRevalidatePath('/dashboard/bookings');
    return { success: true, data: serializeTableDTO(updated) };
  } catch (err) {
    console.error('[TableAction:ToggleActive] Unexpected error:', err);
    return { success: false, error: 'Failed to update table status.' };
  }
}

/**
 * Toggle table online booking enabled/disabled state.
 * Disabling a table only prevents NEW online bookings; existing bookings remain intact.
 */
export async function toggleTableOnlineBookingAction(
  id: string,
  onlineBookingEnabled: boolean
): Promise<TableActionResult<TableDTO>> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  try {
    const updated = await db.restaurantTable.update({
      where: { id },
      data: { onlineBookingEnabled },
    });

    await logAdminAction({
      userId: user.id,
      action: 'TABLE_TOGGLE_ONLINE_BOOKING',
      entity: 'RestaurantTable',
      entityId: id,
      detail: { onlineBookingEnabled },
    });

    safeRevalidatePath('/dashboard/tables');
    safeRevalidatePath('/dashboard/bookings');
    return { success: true, data: serializeTableDTO(updated) };
  } catch (err) {
    console.error('[TableAction:ToggleOnlineBooking] Unexpected error:', err);
    return { success: false, error: 'Failed to update table online booking setting.' };
  }
}

/**
 * Regenerate unpredictable QR token for a table.
 */
export async function regenerateTableQRAction(id: string): Promise<TableActionResult<TableDTO>> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  try {
    const newToken = generateUniqueQrToken();
    const updated = await db.restaurantTable.update({
      where: { id },
      data: { qrToken: newToken },
    });

    await logAdminAction({
      userId: user.id,
      action: 'TABLE_REGENERATE_QR',
      entity: 'RestaurantTable',
      entityId: id,
      detail: { tableNumber: updated.tableNumber },
    });

    safeRevalidatePath('/dashboard/tables');
    return { success: true, data: serializeTableDTO(updated) };
  } catch (err) {
    console.error('[TableAction:RegenerateQR] Unexpected error:', err);
    return { success: false, error: 'Failed to regenerate QR token.' };
  }
}

/**
 * Delete a table. Strictly prevents deletion if active orders exist.
 */
export async function deleteTableAction(id: string): Promise<TableActionResult<TableDTO>> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER]);

  const activeOrdersCount = await db.order.count({
    where: {
      tableId: id,
      status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
    },
  });

  if (activeOrdersCount > 0) {
    return {
      success: false,
      error: `Cannot delete this table because it has ${activeOrdersCount} active order(s). Please complete or cancel those orders first.`,
    };
  }

  try {
    const deleted = await db.restaurantTable.delete({ where: { id } });

    await logAdminAction({
      userId: user.id,
      action: 'TABLE_DELETE',
      entity: 'RestaurantTable',
      entityId: id,
      detail: { tableNumber: deleted.tableNumber },
    });

    safeRevalidatePath('/dashboard/tables');
    return { success: true, data: serializeTableDTO(deleted) };
  } catch (err) {
    console.error('[TableAction:Delete] Unexpected error:', err);
    return { success: false, error: 'Failed to delete table.' };
  }
}

/**
 * Public helper to verify a table QR token for ordering.
 * Never throws — returns null if invalid or inactive.
 */
export async function verifyTableToken(token: string | null | undefined) {
  if (!token || typeof token !== 'string') return null;

  try {
    const table = await db.restaurantTable.findUnique({
      where: { qrToken: token.trim() },
      select: {
        id: true,
        tableNumber: true,
        capacity: true,
        isActive: true,
        qrToken: true,
      },
    });

    if (!table || !table.isActive) return null;
    return table;
  } catch {
    return null;
  }
}
