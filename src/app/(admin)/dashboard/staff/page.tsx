/**
 * src/app/(admin)/dashboard/staff/page.tsx
 * Admin Staff Management page — restricted to ADMIN role.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { StaffManagerClient } from './StaffManagerClient';

export const metadata: Metadata = {
  title: 'Staff Management | Shree Kripa Admin',
  description: 'Manage staff accounts, assign roles, and configure system access.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const currentUser = await requireAuth([Role.ADMIN]);

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const serializedStaff = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <StaffManagerClient
        initialStaff={serializedStaff}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
