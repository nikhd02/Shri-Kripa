'use server';
/**
 * src/server/actions/settings.ts
 * Server Actions for updating restaurant settings.
 * Restricted to ADMIN role only.
 */

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { Role, Prisma } from '@prisma/client';
import { updateSettingsSchema } from '@/lib/validations/settings';

export type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export interface SettingsDTO {
  id: string;
  restaurantName: string;
  taxRate: number;
  taxLabel: string;
  currency: string;
  timezone: string;
  openingHours: string | null;
  address: string | null;
  phone1: string | null;
  phone2: string | null;
  googleMapsUrl: string | null;
  updatedAt: string;
}

export async function updateRestaurantSettingsAction(
  rawData: unknown
): Promise<ActionResult<{ settings: SettingsDTO }>> {
  // 1. Authorize: only ADMIN
  const currentUser = await requireAuth([Role.ADMIN]);

  // 2. Validate input
  const parsed = updateSettingsSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    restaurantName,
    phone1,
    phone2,
    address,
    googleMapsUrl,
    openingHours,
    timezone,
    taxRate,
    taxLabel,
    currency,
  } = parsed.data;

  try {
    // 3. Find existing settings row
    let existing = await db.restaurantSettings.findFirst();

    let updated;
    if (existing) {
      updated = await db.restaurantSettings.update({
        where: { id: existing.id },
        data: {
          restaurantName,
          phone1,
          phone2: phone2?.trim() || null,
          address,
          googleMapsUrl: googleMapsUrl?.trim() || null,
          openingHours: openingHours?.trim() || null,
          timezone,
          taxRate: new Prisma.Decimal(taxRate),
          taxLabel,
          currency,
        },
      });
    } else {
      updated = await db.restaurantSettings.create({
        data: {
          restaurantName,
          phone1,
          phone2: phone2?.trim() || null,
          address,
          googleMapsUrl: googleMapsUrl?.trim() || null,
          openingHours: openingHours?.trim() || null,
          timezone,
          taxRate: new Prisma.Decimal(taxRate),
          taxLabel,
          currency,
        },
      });
    }

    // 4. Record audit log
    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_SETTINGS',
        entity: 'RestaurantSettings',
        entityId: updated.id,
        detail: `Updated restaurant settings (Tax: ${taxRate}% ${taxLabel}, Name: ${restaurantName})`,
      },
    });

    // 5. Invalidate caches
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/reports');
    revalidatePath('/menu');
    revalidatePath('/');
    revalidatePath('/contact');
    revalidatePath('/banquet');

    return {
      success: true,
      data: {
        settings: {
          id: updated.id,
          restaurantName: updated.restaurantName,
          taxRate: Number(updated.taxRate),
          taxLabel: updated.taxLabel,
          currency: updated.currency,
          timezone: updated.timezone,
          openingHours: updated.openingHours,
          address: updated.address,
          phone1: updated.phone1,
          phone2: updated.phone2,
          googleMapsUrl: updated.googleMapsUrl,
          updatedAt: updated.updatedAt.toISOString(),
        },
      },
    };
  } catch (error) {
    console.error('[updateRestaurantSettingsAction] Error updating settings:', error);
    return {
      success: false,
      error: 'An unexpected database error occurred while updating settings.',
    };
  }
}
