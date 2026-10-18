/**
 * src/app/(admin)/dashboard/settings/page.tsx
 * Admin Restaurant Settings Page — restricted to ADMIN role.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { SettingsClient } from './SettingsClient';
import type { SettingsDTO } from '@/server/actions/settings';

export const metadata: Metadata = {
  title: 'Restaurant Settings | Shree Kripa Admin',
  description: 'Configure restaurant identity, contact details, operating schedule, and tax rules.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireAuth([Role.ADMIN]);

  const raw = await db.restaurantSettings.findFirst();

  const settings: SettingsDTO = raw
    ? {
        id: raw.id,
        restaurantName: raw.restaurantName,
        taxRate: Number(raw.taxRate),
        taxLabel: raw.taxLabel,
        currency: raw.currency,
        timezone: raw.timezone,
        openingHours: raw.openingHours,
        address: raw.address,
        phone1: raw.phone1,
        phone2: raw.phone2,
        googleMapsUrl: raw.googleMapsUrl,
        updatedAt: raw.updatedAt.toISOString(),
      }
    : {
        id: 'default',
        restaurantName: 'Shree Kripa Family Restaurant & Banquet',
        taxRate: 5,
        taxLabel: 'GST',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        openingHours: '11:00 AM - 11:00 PM',
        address: 'Akhari Bypass, Near Flyover, Varanasi',
        phone1: '9415268463',
        phone2: '9125669366',
        googleMapsUrl: 'https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA',
        updatedAt: new Date().toISOString(),
      };

  return (
    <div className="space-y-6">
      <SettingsClient initialSettings={settings} />
    </div>
  );
}
