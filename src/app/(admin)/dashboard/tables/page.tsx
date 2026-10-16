/**
 * src/app/(admin)/dashboard/tables/page.tsx
 * Admin management page for restaurant tables, QR tokens, and printable tent cards.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { serializeTableDTO } from '@/lib/dto/table';
import { TableManagerClient } from './TableManagerClient';

export const metadata: Metadata = {
  title: 'Table & QR Management | Admin | Shree Kripa',
  description: 'Manage dining tables, generate unique QR codes, and print table tent cards.',
};

export const dynamic = 'force-dynamic';

export default async function AdminTablesPage() {
  await requireAuth([Role.ADMIN, Role.MANAGER]);

  // Fetch all tables with count of active orders
  const tables = await db.restaurantTable.findMany({
    orderBy: { tableNumber: 'asc' },
    include: {
      _count: {
        select: {
          orders: {
            where: {
              status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
            },
          },
        },
      },
    },
  });

  const serializedTables = tables.map((t) => serializeTableDTO(t, t._count.orders));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Dining Tables & QR Codes
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Create, manage dining tables, generate secure ordering QR tokens, and print tent cards.
          </p>
        </div>
      </div>

      <TableManagerClient initialTables={serializedTables} />
    </div>
  );
}
