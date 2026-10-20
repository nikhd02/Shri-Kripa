/**
 * src/app/(admin)/dashboard/bookings/page.tsx
 *
 * Staff/Admin Table Bookings management page.
 * Restricted to ADMIN, MANAGER, and STAFF roles.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { BookingsManagerClient } from './BookingsManagerClient';

export const metadata: Metadata = {
  title: 'Table Bookings | Shree Kripa Admin',
  description: 'Manage dining table reservations, confirm or cancel bookings, and assign tables.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  await requireAuth([Role.ADMIN, Role.MANAGER, Role.STAFF]);

  const [rawBookings, allTables] = await Promise.all([
    db.tableBooking.findMany({
      orderBy: [{ bookingDate: 'desc' }, { timeSlot: 'asc' }],
      include: { table: true },
      take: 200,
    }),
    db.restaurantTable.findMany({
      orderBy: { tableNumber: 'asc' },
    }),
  ]);

  const serializedBookings = rawBookings.map((b) => ({
    id: b.id,
    bookingReference: b.bookingReference,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    customerEmail: b.customerEmail,
    guestCount: b.guestCount,
    bookingDate: b.bookingDate.toISOString().split('T')[0],
    timeSlot: b.timeSlot,
    durationMinutes: b.durationMinutes,
    status: b.status,
    specialRequest: b.specialRequest,
    staffNotes: b.staffNotes,
    tableId: b.tableId,
    tableNumber: b.table?.tableNumber || null,
    tableOnlineBookingEnabled: b.table?.onlineBookingEnabled ?? null,
    createdAt: b.createdAt.toISOString(),
  }));

  const serializedTables = allTables.map((t) => ({
    id: t.id,
    tableNumber: t.tableNumber,
    capacity: t.capacity,
    isActive: t.isActive,
    onlineBookingEnabled: t.onlineBookingEnabled,
  }));

  return (
    <div className="space-y-6">
      <BookingsManagerClient
        initialBookings={serializedBookings}
        initialTables={serializedTables}
      />
    </div>
  );
}
