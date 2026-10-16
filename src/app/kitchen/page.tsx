/**
 * src/app/kitchen/page.tsx
 * Dedicated Kitchen Display System (KDS) for kitchen chefs and expeditor staff.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { serializeKitchenOrderDTO } from '@/lib/dto/order';
import { KitchenDisplayClient } from './KitchenDisplayClient';

export const metadata: Metadata = {
  title: 'Kitchen Display System | Shree Kripa',
  description: 'Real-time kitchen order tickets, preparation timers, and touch workflows.',
};

export const dynamic = 'force-dynamic';

export default async function KitchenPage() {
  await requireAuth([Role.ADMIN, Role.MANAGER, Role.KITCHEN]);

  // Fetch active kitchen orders: PENDING, ACCEPTED, PREPARING, READY (FIFO: oldest first)
  const orders = await db.order.findMany({
    where: {
      status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      table: {
        select: {
          tableNumber: true,
        },
      },
      orderItems: {
        include: {
          addOns: true,
        },
      },
    },
  });

  // Explicitly serialize every field to primitive DTO for the Client Component
  const serializedOrders = orders.map(serializeKitchenOrderDTO);

  return <KitchenDisplayClient initialOrders={serializedOrders} />;
}
