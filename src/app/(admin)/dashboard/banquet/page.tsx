/**
 * src/app/(admin)/dashboard/banquet/page.tsx
 * Admin Banquet Enquiries page.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { BanquetManagerClient } from './BanquetManagerClient';

export const metadata: Metadata = {
  title: 'Banquet Enquiries | Shree Kripa Admin',
  description: 'Manage banquet leads, bookings, and customer requirements.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function BanquetPage() {
  await requireAuth([Role.ADMIN, Role.MANAGER, Role.STAFF]);

  const rawEnquiries = await db.banquetEnquiry.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const serialized = rawEnquiries.map((e) => ({
    id: e.id,
    name: e.name,
    phone: e.phone,
    email: e.email,
    eventType: e.eventType,
    eventDate: e.eventDate.toISOString(),
    guestCount: e.guestCount,
    message: e.message,
    status: e.status,
    notes: e.notes,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <BanquetManagerClient initialEnquiries={serialized} />
    </div>
  );
}
