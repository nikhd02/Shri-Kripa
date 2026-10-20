/**
 * src/app/api/create-order/route.ts
 *
 * Initiates Razorpay Standard Checkout for a persisted Order.
 * - Validates the persisted order and its status.
 * - Derives the exact payable amount from the server-calculated order total.
 * - Creates a Razorpay Order and associates the Razorpay order ID with the PaymentRecord.
 * - Securely handles credentials using environment variables.
 */

import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/db';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.orderId !== 'string' || !body.orderId.trim()) {
      return NextResponse.json(
        { success: false, error: 'Valid orderId is required.' },
        { status: 400 }
      );
    }

    const orderId = body.orderId.trim();

    // 1. Fetch persisted order from database
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        paymentRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      return NextResponse.json(
        { success: false, error: 'Cannot initiate payment for a cancelled order.' },
        { status: 400 }
      );
    }

    const latestPayment = order.paymentRecords[0];
    if (latestPayment && latestPayment.status === PaymentStatus.COMPLETED) {
      return NextResponse.json(
        { success: false, error: 'This order has already been paid.' },
        { status: 400 }
      );
    }

    // 2. Derive payable amount in paise from server-calculated order total
    const totalNum = Number(order.total);
    const amountInPaise = Math.round(totalNum * 100);

    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order payable amount.' },
        { status: 400 }
      );
    }

    // 3. Verify Razorpay credentials from environment
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[Razorpay:CreateOrder] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment.');
      return NextResponse.json(
        {
          success: false,
          error: 'Online payment gateway is not configured. Please contact staff or pay at counter.',
        },
        { status: 500 }
      );
    }

    // 4. Initialize Razorpay instance and create remote order
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNumber.slice(0, 40),
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        customerEmail: order.customer?.email || '',
      },
    });

    // 5. Update or link the pending payment record with the Razorpay Order ID reference
    if (latestPayment) {
      await db.paymentRecord.update({
        where: { id: latestPayment.id },
        data: {
          method: PaymentMethod.CARD,
          amount: order.total,
          status: PaymentStatus.PENDING,
          reference: razorpayOrder.id,
        },
      });
    } else {
      await db.paymentRecord.create({
        data: {
          orderId: order.id,
          method: PaymentMethod.CARD,
          amount: order.total,
          status: PaymentStatus.PENDING,
          reference: razorpayOrder.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order.id,
      orderNumber: order.orderNumber,
      keyId,
    });
  } catch (error) {
    console.error('[Razorpay:CreateOrder] Failed to create order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create payment order with payment gateway. Please try again.',
      },
      { status: 500 }
    );
  }
}
