/**
 * src/app/(customer)/pay/[orderId]/page.tsx
 *
 * Dedicated public customer payment page for table reservation pre-orders and online dining orders.
 */

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PaymentClient } from './PaymentClient';

export const metadata: Metadata = {
  title: 'Pay Online | Shree Kripa Family Restaurant',
  description: 'Secure online payment for your food order & dining reservation via Razorpay.',
};

export const dynamic = 'force-dynamic';

interface PayOrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function PayOrderPage(props: PayOrderPageProps) {
  const { orderId } = await props.params;

  if (!orderId) {
    notFound();
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: true,
      table: true,
      paymentRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!order) {
    notFound();
  }

  const latestPayment = order.paymentRecords[0];

  const serializedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    status: order.status,
    notes: order.notes,
    subtotal: order.subtotal.toString(),
    taxAmount: order.taxAmount.toString(),
    total: order.total.toString(),
    createdAt: order.createdAt.toISOString(),
    tableNumber: order.table?.tableNumber || null,
    isPaid: latestPayment?.status === 'COMPLETED',
    paymentReference: latestPayment?.reference || null,
    paymentMethod: latestPayment?.method || null,
    items: order.orderItems.map((item) => ({
      id: item.id,
      name: item.menuItemName,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
      specialInstructions: item.specialInstructions,
    })),
  };

  return <PaymentClient order={serializedOrder} />;
}
