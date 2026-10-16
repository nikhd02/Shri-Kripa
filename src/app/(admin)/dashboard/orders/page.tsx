/**
 * src/app/(admin)/dashboard/orders/page.tsx
 * Admin orders management page with live polling, status workflows, and payment tracking.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { serializeAdminOrderDTO } from '@/lib/dto/order';
import { OrderManagerClient } from './OrderManagerClient';

export const metadata: Metadata = {
  title: 'Orders Management | Admin | Shree Kripa',
  description: 'Track real-time orders, manage kitchen statuses, and handle payments.',
};

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  await requireAuth([Role.ADMIN, Role.MANAGER, Role.STAFF, Role.KITCHEN]);

  const orders = await db.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      table: {
        select: {
          tableNumber: true,
          capacity: true,
        },
      },
      orderItems: {
        include: {
          addOns: true,
        },
      },
      paymentRecords: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // Explicitly serialize every Prisma Decimal and Date to primitive strings
  const serializedOrders = orders.map(serializeAdminOrderDTO);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Restaurant Orders
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Real-time dine-in and web orders. Progress items from pending to kitchen and completed.
          </p>
        </div>
      </div>

      <OrderManagerClient initialOrders={serializedOrders} />
    </div>
  );
}
