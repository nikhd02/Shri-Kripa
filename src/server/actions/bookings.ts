/**
 * src/server/actions/bookings.ts
 *
 * Server actions for online table booking, capacity validation,
 * concurrency locking, and staff management of reservations.
 */

'use server';

import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { Role, BookingStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
  createBookingSchema,
  updateBookingStatusSchema,
} from '@/lib/validations/booking';
import { sendTableBookingEmail } from '@/lib/email';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully ignore when called outside Next.js request context
  }
}

export interface BookingSlot {
  time: string; // e.g. "12:30"
  label: string; // e.g. "12:30 PM"
  available: boolean;
  isPast?: boolean;
  reason?: string;
  remainingCapacity: number;
}

export interface BookingDTO {
  id: string;
  bookingReference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  guestCount: number;
  bookingDate: string;
  timeSlot: string;
  durationMinutes: number;
  status: BookingStatus;
  specialRequest: string | null;
  staffNotes: string | null;
  tableId: string | null;
  tableNumber: string | null;
  tableOnlineBookingEnabled: boolean | null;
  createdAt: string;
}

function parseDateAsUtc(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }
  const fallback = new Date(dateStr);
  fallback.setUTCHours(0, 0, 0, 0);
  return fallback;
}

/**
 * Parses restaurant operating hours text (e.g. "11:00 AM - 11:00 PM" or "10:00 - 22:30")
 */
function parseOperatingHours(hoursStr?: string | null): {
  valid: boolean;
  openMinutes: number;
  closeMinutes: number;
  text: string;
} {
  const defaultText = '11:00 AM - 11:00 PM';
  const str = hoursStr?.trim() || defaultText;

  // Match e.g. "11:00 AM - 11:00 PM" or "11:00 - 23:00"
  const match12 = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12) {
    const [, h1, m1, p1, h2, m2, p2] = match12;
    let openH = parseInt(h1, 10);
    if (p1.toUpperCase() === 'PM' && openH < 12) openH += 12;
    if (p1.toUpperCase() === 'AM' && openH === 12) openH = 0;

    let closeH = parseInt(h2, 10);
    if (p2.toUpperCase() === 'PM' && closeH < 12) closeH += 12;
    if (p2.toUpperCase() === 'AM' && closeH === 12) closeH = 0;

    return {
      valid: true,
      openMinutes: openH * 60 + parseInt(m1, 10),
      closeMinutes: closeH * 60 + parseInt(m2, 10),
      text: str,
    };
  }

  const match24 = str.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (match24) {
    const [, h1, m1, h2, m2] = match24;
    return {
      valid: true,
      openMinutes: parseInt(h1, 10) * 60 + parseInt(m1, 10),
      closeMinutes: parseInt(h2, 10) * 60 + parseInt(m2, 10),
      text: str,
    };
  }

  return { valid: false, openMinutes: 0, closeMinutes: 0, text: str };
}

function minutesToTimeString(minutes: number): { time: string; label: string } {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const label = `${displayH}:${String(m).padStart(2, '0')} ${period}`;

  return { time, label };
}

function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function generateBookingReference(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `TB-${year}${month}${day}-${random4}`;
}

/**
 * Returns the current date (YYYY-MM-DD) and minute of the day (0-1439)
 * strictly in Indian Standard Time (IST - Asia/Kolkata, UTC+05:30).
 */
export function getIndianStandardTime(): {
  dateStr: string;
  currentMinutes: number;
} {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const timeStr = now.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
  });
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  return {
    dateStr,
    currentMinutes: (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m),
  };
}

/**
 * Public Action: Query available booking slots for a requested date & party size
 */
export async function getAvailableBookingSlotsAction(
  dateString: string,
  guestCount: number
): Promise<{
  success: boolean;
  slots?: BookingSlot[];
  operatingHoursText?: string;
  error?: string;
  noOnlineTables?: boolean;
}> {
  try {
    if (!dateString || isNaN(Date.parse(dateString))) {
      return { success: false, error: 'Please select a valid reservation date.' };
    }
    if (guestCount < 1 || guestCount > 30) {
      return { success: false, error: 'Party size must be between 1 and 30 guests.' };
    }

    const settings = await db.restaurantSettings.findFirst();
    const hours = parseOperatingHours(settings?.openingHours);

    if (!hours.valid) {
      return {
        success: false,
        error:
          'Restaurant operating hours are not configured. Please contact the restaurant directly at +91 94152 68463 to reserve your table.',
      };
    }

    // Fetch active tables enabled for online booking
    const onlineTables = await db.restaurantTable.findMany({
      where: {
        isActive: true,
        onlineBookingEnabled: true,
      },
      orderBy: { capacity: 'asc' },
    });

    if (onlineTables.length === 0) {
      return {
        success: true,
        slots: [],
        noOnlineTables: true,
        error:
          'Online reservations are currently unavailable. Please contact the restaurant for assistance or try another time.',
        operatingHoursText: hours.text,
      };
    }

    const targetDate = parseDateAsUtc(dateString);

    // Fetch existing active bookings (PENDING & CONFIRMED) that occupy tables on that date
    const existingBookings = await db.tableBooking.findMany({
      where: {
        bookingDate: targetDate,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      },
    });

    // Filter tables capable of accommodating this party size
    const eligibleTables = onlineTables.filter((t) => t.capacity >= guestCount);

    // Generate slots at 30-min intervals. Last slot must leave at least 60 mins before close.
    const slots: BookingSlot[] = [];
    const DURATION = 90; // minutes

    // Evaluate current time in Indian Standard Time (Asia/Kolkata, UTC+05:30)
    const { dateStr: todayIST, currentMinutes: currentMinuteOfDay } = getIndianStandardTime();
    const isToday = dateString === todayIST;
    const isPastDate = dateString < todayIST;

    for (let minute = hours.openMinutes; minute <= hours.closeMinutes - 60; minute += 30) {
      const { time, label } = minutesToTimeString(minute);

      // If the reservation date is entirely in the past
      if (isPastDate) {
        slots.push({
          time,
          label,
          available: false,
          isPast: true,
          reason: 'This date has already passed.',
          remainingCapacity: 0,
        });
        continue;
      }

      // If booking for today, any slot before the current time is past and disabled
      // (e.g. if current time is 12:00 PM, 11:00 AM and 11:30 AM are disabled)
      if (isToday && minute < currentMinuteOfDay) {
        slots.push({
          time,
          label,
          available: false,
          isPast: true,
          reason: 'This time slot has already passed for today.',
          remainingCapacity: 0,
        });
        continue;
      }

      // If no online table has enough capacity for this party size
      if (eligibleTables.length === 0) {
        slots.push({
          time,
          label,
          available: false,
          reason:
            'Sorry, no tables are available for this time slot. Please contact the restaurant for assistance or try another time.',
          remainingCapacity: 0,
        });
        continue;
      }

      // Check which tables are occupied in the interval [minute - 89, minute + 89]
      const overlappingBookings = existingBookings.filter((b) => {
        const bMin = timeStringToMinutes(b.timeSlot);
        const bDur = b.durationMinutes || DURATION;
        return Math.abs(bMin - minute) < Math.min(DURATION, bDur);
      });

      const bookedTableIds = new Set(
        overlappingBookings.map((b) => b.tableId).filter(Boolean) as string[]
      );

      // Free eligible tables that can accommodate this party size and are not booked
      const freeEligibleTables = eligibleTables.filter((t) => !bookedTableIds.has(t.id));

      const isAvailable = freeEligibleTables.length > 0;
      const remainingCapacity = freeEligibleTables.reduce((sum, t) => sum + t.capacity, 0);

      slots.push({
        time,
        label,
        available: isAvailable,
        reason: !isAvailable
          ? 'Sorry, no tables are available for this time slot. Please contact the restaurant for assistance or try another time.'
          : undefined,
        remainingCapacity,
      });
    }

    return {
      success: true,
      slots,
      operatingHoursText: hours.text,
    };
  } catch (err) {
    console.error('[Bookings:GetSlots] Error:', err);
    return { success: false, error: 'Failed to retrieve available reservation slots.' };
  }
}

// In-process concurrency lock to serialize simultaneous table allocations
let lockPromise: Promise<void> = Promise.resolve();

async function acquireBookingLock(): Promise<() => void> {
  let release!: () => void;
  const newLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const currentLock = lockPromise;
  lockPromise = currentLock.then(() => newLock);
  await currentLock;
  return () => {
    release();
  };
}

/**
 * Public Action: Create a Table Booking
 */
export async function createTableBookingAction(rawInput: unknown): Promise<{
  success: boolean;
  booking?: BookingDTO;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  const releaseLock = await acquireBookingLock();
  try {
    const parsed = createBookingSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Please check the booking details entered.',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

  const {
    customerName,
    customerPhone,
    customerEmail,
    guestCount,
    bookingDate,
    timeSlot,
    specialRequest,
  } = parsed.data;

  const targetDate = parseDateAsUtc(bookingDate);

  const { dateStr: todayIST, currentMinutes: currentMinuteOfDay } = getIndianStandardTime();

  if (bookingDate < todayIST) {
    return { success: false, error: 'Cannot book a table for a past date.' };
  }

  const slotMinutes = timeStringToMinutes(timeSlot);
  if (bookingDate === todayIST && slotMinutes < currentMinuteOfDay) {
    return {
      success: false,
      error: 'This time slot has already passed for today. Please select an upcoming slot.',
    };
  }

  // Execute atomic transaction with concurrency check
  const newBooking = await db.$transaction(
    async (tx) => {
        // 1. Verify operating hours and acquire row lock on settings to serialize concurrent reservations
        const settings = await tx.restaurantSettings.findFirst();
        if (settings) {
          await tx.$queryRaw`SELECT id FROM restaurant_settings WHERE id = ${settings.id} FOR UPDATE`;
        }

        const hours = parseOperatingHours(settings?.openingHours);

        if (!hours.valid) {
          throw new Error('Restaurant operating hours are not configured.');
        }

        const slotMinutes = timeStringToMinutes(timeSlot);
        if (slotMinutes < hours.openMinutes || slotMinutes > hours.closeMinutes - 60) {
          throw new Error(`The selected time slot is outside operating hours (${hours.text}).`);
        }

        // 2. Fetch active tables enabled for online booking with capacity >= guestCount
        const eligibleTables = await tx.restaurantTable.findMany({
          where: {
            isActive: true,
            onlineBookingEnabled: true,
            capacity: { gte: guestCount },
          },
          orderBy: { capacity: 'asc' },
        });

        if (eligibleTables.length === 0) {
          throw new Error(
            'Sorry, no tables are available for this time slot. Please contact the restaurant for assistance or try another time.'
          );
        }

        // 3. Find overlapping bookings for this time window (90 mins duration)
        const DURATION = 90;
        const existingBookings = await tx.tableBooking.findMany({
          where: {
            bookingDate: targetDate,
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
          },
        });

        const overlappingBookings = existingBookings.filter((b) => {
          const bMin = timeStringToMinutes(b.timeSlot);
          const bDur = b.durationMinutes || DURATION;
          return Math.abs(bMin - slotMinutes) < Math.min(DURATION, bDur);
        });

        const bookedTableIds = new Set(
          overlappingBookings.map((b) => b.tableId).filter(Boolean) as string[]
        );

        // 4. Select the best available table (smallest capacity that fits the party)
        const freeTable = eligibleTables.find((t) => !bookedTableIds.has(t.id));

        if (!freeTable) {
          throw new Error(
            'Sorry, no tables are available for this time slot. Please contact the restaurant for assistance or try another time.'
          );
        }

        // Acquire exclusive row lock on the chosen table to serialize concurrent bookings
        await tx.restaurantTable.update({
          where: { id: freeTable.id },
          data: { updatedAt: new Date() },
        });

        // Re-verify with a Current Read (LOCK IN SHARE MODE) so InnoDB reads latest committed bookings
        const recentOverlaps = await tx.$queryRaw<{ id: string; timeSlot: string; durationMinutes: number }[]>`
          SELECT id, timeSlot, durationMinutes FROM table_bookings
          WHERE bookingDate = ${targetDate}
            AND tableId = ${freeTable.id}
            AND status IN ('CONFIRMED', 'PENDING')
          LOCK IN SHARE MODE
        `;

        if (recentOverlaps && recentOverlaps.length > 0) {
          for (const overlap of recentOverlaps) {
            const rMin = timeStringToMinutes(overlap.timeSlot);
            const rDur = overlap.durationMinutes || DURATION;
            if (Math.abs(rMin - slotMinutes) < Math.min(DURATION, rDur)) {
              throw new Error(
                'Sorry, no tables are available for this time slot. Please contact the restaurant for assistance or try another time.'
              );
            }
          }
        }

        // 5. Generate unique booking reference
        let bookingReference = generateBookingReference();
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
          const found = await tx.tableBooking.findUnique({ where: { bookingReference } });
          if (!found) {
            isUnique = true;
          } else {
            bookingReference = generateBookingReference();
            attempts++;
          }
        }

        // 6. Create booking with assigned table
        const created = await tx.tableBooking.create({
          data: {
            bookingReference,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail?.trim().toLowerCase() || null,
            guestCount,
            bookingDate: targetDate,
            timeSlot,
            durationMinutes: DURATION,
            status: BookingStatus.PENDING,
            specialRequest: specialRequest?.trim() || null,
            tableId: freeTable.id,
          },
          include: { table: true },
        });

        return created;
      },
      { maxWait: 10000, timeout: 20000 }
    );

    // Send confirmation/receipt email if email is provided
    if (customerEmail?.trim()) {
      try {
        await sendTableBookingEmail({
          bookingReference: newBooking.bookingReference,
          customerName: newBooking.customerName,
          customerEmail: customerEmail.trim().toLowerCase(),
          customerPhone: newBooking.customerPhone,
          bookingDate: targetDate.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          timeSlot: newBooking.timeSlot,
          guestCount: newBooking.guestCount,
          tableNumber: newBooking.table?.tableNumber,
          specialRequest: newBooking.specialRequest,
          isConfirmed: false,
        });
      } catch (emailErr) {
        console.error('[Bookings:Email] Error sending receipt email:', emailErr);
      }
    }

    safeRevalidatePath('/dashboard/bookings');

    return {
      success: true,
      booking: {
        id: newBooking.id,
        bookingReference: newBooking.bookingReference,
        customerName: newBooking.customerName,
        customerPhone: newBooking.customerPhone,
        customerEmail: newBooking.customerEmail,
        guestCount: newBooking.guestCount,
        bookingDate: newBooking.bookingDate.toISOString().split('T')[0],
        timeSlot: newBooking.timeSlot,
        durationMinutes: newBooking.durationMinutes,
        status: newBooking.status,
        specialRequest: newBooking.specialRequest,
        staffNotes: newBooking.staffNotes,
        tableId: newBooking.tableId,
        tableNumber: newBooking.table?.tableNumber || null,
        tableOnlineBookingEnabled: newBooking.table?.onlineBookingEnabled ?? null,
        createdAt: newBooking.createdAt.toISOString(),
      },
    };
  } catch (err: unknown) {
    console.error('[Bookings:Create] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to complete your reservation. Please try again.';
    return {
      success: false,
      error: message,
    };
  } finally {
    releaseLock();
  }
}

/**
 * Staff/Admin Action: Update Table Booking Status & Assign Table
 */
export async function updateBookingStatusAction(rawInput: unknown): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireAuth([Role.ADMIN, Role.MANAGER, Role.STAFF]);

  const parsed = updateBookingStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: 'Invalid booking update data.' };
  }

  const { bookingId, status, tableId, staffNotes } = parsed.data;

  try {
    const existing = await db.tableBooking.findUnique({
      where: { id: bookingId },
      include: { table: true },
    });

    if (!existing) {
      return { success: false, error: 'Booking not found.' };
    }

    const updated = await db.tableBooking.update({
      where: { id: bookingId },
      data: {
        status,
        ...(tableId !== undefined ? { tableId: tableId || null } : {}),
        ...(staffNotes !== undefined ? { staffNotes: staffNotes?.trim() || null } : {}),
      },
      include: { table: true },
    });

    // If status became CONFIRMED and customer has email, send Confirmation Email!
    if (status === BookingStatus.CONFIRMED && updated.customerEmail) {
      try {
        await sendTableBookingEmail({
          bookingReference: updated.bookingReference,
          customerName: updated.customerName,
          customerEmail: updated.customerEmail,
          customerPhone: updated.customerPhone,
          bookingDate: updated.bookingDate.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          timeSlot: updated.timeSlot,
          guestCount: updated.guestCount,
          tableNumber: updated.table?.tableNumber,
          specialRequest: updated.specialRequest,
          isConfirmed: true,
        });
      } catch (emailErr) {
        console.error('[Bookings:StaffConfirmEmail] Error:', emailErr);
      }
    }

    safeRevalidatePath('/dashboard/bookings');
    return { success: true };
  } catch (err: unknown) {
    console.error('[Bookings:UpdateStatus] Error:', err);
    return { success: false, error: 'Failed to update booking status.' };
  }
}

/**
 * Admin Action: Delete a Booking
 */
export async function deleteBookingAction(bookingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireAuth([Role.ADMIN]);

  try {
    await db.tableBooking.delete({
      where: { id: bookingId },
    });
    safeRevalidatePath('/dashboard/bookings');
    return { success: true };
  } catch (err: unknown) {
    console.error('[Bookings:Delete] Error:', err);
    return { success: false, error: 'Failed to delete booking record.' };
  }
}
