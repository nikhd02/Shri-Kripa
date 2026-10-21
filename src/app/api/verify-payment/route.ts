/**
 * src/app/api/verify-payment/route.ts
 *
 * Verifies Razorpay payment signature using HMAC-SHA256 constant-time comparison,
 * confirms payment status with the Razorpay API, and marks the order as paid in the database.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from '@/lib/db';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { sendOrderPaymentSuccessEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.orderId !== 'string' ||
      typeof body.razorpay_order_id !== 'string' ||
      typeof body.razorpay_payment_id !== 'string' ||
      typeof body.razorpay_signature !== 'string'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required payment verification parameters (orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature).',
        },
        { status: 400 }
      );
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    // 1. Fetch the persisted order from database
    const order = await db.order.findUnique({
      where: { id: orderId.trim() },
      include: {
        paymentRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found in database.' },
        { status: 404 }
      );
    }

    // 2. Load Razorpay credentials
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error('[Razorpay:Verify] RAZORPAY_KEY_SECRET is not configured on the server.');
      return NextResponse.json(
        { success: false, error: 'Payment gateway configuration error.' },
        { status: 500 }
      );
    }

    // 3. HMAC-SHA256 signature verification with constant-time comparison
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const signatureBuffer = Buffer.from(razorpay_signature, 'utf-8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

    const isSignatureValid =
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isSignatureValid) {
      console.error('[Razorpay:Verify] Invalid HMAC signature received for order:', order.orderNumber);

      // Record failed payment attempt
      const latestPayment = order.paymentRecords[0];
      if (latestPayment) {
        await db.paymentRecord.update({
          where: { id: latestPayment.id },
          data: {
            status: PaymentStatus.FAILED,
            reference: `FAILED_SIGNATURE:${razorpay_payment_id}`,
          },
        });
      }

      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed. Tampered or invalid response.' },
        { status: 400 }
      );
    }

    // 4. Confirm actual payment status with Razorpay API
    let isStatusConfirmed = false;
    interface RazorpayFetchedPayment {
      order_id?: string;
      status?: string;
      amount?: number | string;
    }
    let paymentDetails: RazorpayFetchedPayment | null = null;

    if (keyId && keySecret) {
      try {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        paymentDetails = (await razorpay.payments.fetch(razorpay_payment_id)) as unknown as RazorpayFetchedPayment;

        const expectedAmountInPaise = Math.round(Number(order.total) * 100);

        if (
          paymentDetails &&
          paymentDetails.order_id === razorpay_order_id &&
          (paymentDetails.status === 'captured' || paymentDetails.status === 'authorized') &&
          Number(paymentDetails.amount) === expectedAmountInPaise
        ) {
          isStatusConfirmed = true;
        } else {
          console.warn(
            `[Razorpay:Verify] Payment status mismatch: status=${paymentDetails?.status}, order_id=${paymentDetails?.order_id}, amount=${paymentDetails?.amount} (expected ${expectedAmountInPaise})`
          );
        }
      } catch (fetchError) {
        console.error('[Razorpay:Verify] Failed to query payment from Razorpay API:', fetchError);
      }
    }

    if (!isStatusConfirmed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment could not be verified with payment provider or amount mismatch occurred.',
        },
        { status: 400 }
      );
    }

    // 5. Mark the payment record as COMPLETED in the database
    const latestPayment = order.paymentRecords[0];
    if (latestPayment) {
      await db.paymentRecord.update({
        where: { id: latestPayment.id },
        data: {
          method: PaymentMethod.CARD,
          amount: order.total,
          status: PaymentStatus.COMPLETED,
          reference: razorpay_payment_id,
        },
      });
    } else {
      await db.paymentRecord.create({
        data: {
          orderId: order.id,
          method: PaymentMethod.CARD,
          amount: order.total,
          status: PaymentStatus.COMPLETED,
          reference: razorpay_payment_id,
        },
      });
    }

    // 6. Safe revalidation for real-time kitchen and dashboard views
    try {
      revalidatePath('/dashboard/orders');
      revalidatePath('/kitchen');
      revalidatePath('/dashboard/reports');
    } catch (revalidateErr) {
      console.warn('[Razorpay:Verify] Revalidate path notice:', revalidateErr);
    }

    // 7. Send payment receipt email to customer
    try {
      const fullOrder = await db.order.findUnique({
        where: { id: order.id },
        include: {
          orderItems: true,
          table: true,
          customer: true,
        },
      });

      let customerEmail =
        fullOrder?.customer?.email?.trim() ||
        fullOrder?.notes?.match(/\[Email:\s*([^\]]+)\]/i)?.[1]?.trim();

      if (!customerEmail && fullOrder?.notes) {
        const bookingRefMatch = fullOrder.notes.match(/#?(TB-[\w-]+)/i);
        if (bookingRefMatch) {
          const linkedBooking = await db.tableBooking.findUnique({
            where: { bookingReference: bookingRefMatch[1] },
            select: { customerEmail: true },
          });
          if (linkedBooking?.customerEmail) {
            customerEmail = linkedBooking.customerEmail.trim();
          }
        }
      }

      if (!customerEmail && fullOrder?.customerPhone) {
        const custByPhone = await db.customer.findUnique({
          where: { phone: fullOrder.customerPhone.trim() },
          select: { email: true },
        });
        if (custByPhone?.email) {
          customerEmail = custByPhone.email.trim();
        }
      }

      if (customerEmail && fullOrder) {
        await sendOrderPaymentSuccessEmail({
          orderNumber: fullOrder.orderNumber,
          customerName: fullOrder.customerName || fullOrder.customer?.name || 'Valued Guest',
          customerEmail: customerEmail.toLowerCase(),
          customerPhone: fullOrder.customerPhone || fullOrder.customer?.phone,
          tableNumber: fullOrder.table?.tableNumber,
          items: fullOrder.orderItems.map((oi) => ({
            name: oi.menuItemName,
            variantName: oi.variantName,
            quantity: oi.quantity,
            lineTotal: Number(oi.lineTotal),
          })),
          subtotal: Number(fullOrder.subtotal),
          taxAmount: Number(fullOrder.taxAmount),
          total: Number(fullOrder.total),
          paymentId: razorpay_payment_id,
          paymentMethod: 'ONLINE (Razorpay)',
        });
      }
    } catch (emailErr) {
      console.error('[Razorpay:Verify] Error preparing payment receipt email:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and confirmed successfully.',
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('[Razorpay:Verify] Unexpected error in payment verification:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during payment verification.' },
      { status: 500 }
    );
  }
}
