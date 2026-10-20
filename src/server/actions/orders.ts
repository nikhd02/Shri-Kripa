/**
 * src/server/actions/orders.ts
 * Server actions for order placement, server-side price computation,
 * kitchen workflows, and payment record management.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { Prisma, OrderStatus, OrderSource, PaymentMethod, PaymentStatus, Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { logAdminAction } from '@/lib/audit';
import { serializeOrderDTO, OrderDTO } from '@/lib/dto/order';
import {
  placeOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
} from '@/lib/validations/order';
import {
  sendOrderReceivedEmail,
  sendOrderConfirmedByStaffEmail,
} from '@/lib/email';

export type OrderActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully ignore when called outside Next.js request context (e.g. scripts/tests)
  }
}

function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://shri-kripa.vercel.app';
}

// Memory store for recent idempotency keys with in-flight concurrency protection
type IdempotencyResult = OrderActionResult<{
  orderId: string;
  orderNumber: string;
  total: string;
  tableNumber?: string;
}>;

type IdempotencyEntry =
  | { status: 'PENDING'; promise: Promise<IdempotencyResult> }
  | { status: 'RESOLVED'; orderId: string; orderNumber: string; total: string; tableNumber?: string; timestamp: number };

const recentIdempotencyKeys = new Map<string, IdempotencyEntry>();

function cleanupIdempotencyKeys() {
  const cutoff = Date.now() - 5 * 60 * 1000; // 5 minutes
  for (const [key, value] of recentIdempotencyKeys.entries()) {
    if (value.status === 'RESOLVED' && value.timestamp < cutoff) {
      recentIdempotencyKeys.delete(key);
    }
  }
}

/**
 * Generate human-readable unique order number.
 * Format: SK-YYMMDD-XXXX (e.g. SK-261016-4821)
 */
function generateOrderNumber(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `SK-${year}${month}${day}-${random4}`;
}

/**
 * Customer / Public Action: Place an order.
 * - Computes all prices, taxes, and totals exclusively on the server.
 * - Validates table token if provided.
 * - Atomic order, order items, and initial payment record creation.
 */
export async function placeOrderAction(
  rawInput: Record<string, unknown>
): Promise<IdempotencyResult> {
  cleanupIdempotencyKeys();

  const parsed = placeOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please check your order details.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { tableToken, customerName, customerPhone, customerEmail, notes, idempotencyKey, items } = parsed.data;

  // Check idempotency key to prevent accidental double submissions (including concurrent ones)
  if (idempotencyKey) {
    const existing = recentIdempotencyKeys.get(idempotencyKey);
    if (existing) {
      if (existing.status === 'RESOLVED') {
        return {
          success: true,
          data: {
            orderId: existing.orderId,
            orderNumber: existing.orderNumber,
            total: existing.total,
            tableNumber: existing.tableNumber,
          },
        };
      }
      if (existing.status === 'PENDING') {
        // Wait for concurrent request to finish and return its identical result
        return await existing.promise;
      }
    }
  }

  // Define execution logic
  const executeOrderPlacement = async (): Promise<IdempotencyResult> => {
    // 1. Verify Table Token if provided
    let tableId: string | null = null;
    let tableNumber: string | undefined = undefined;
    let orderSource: OrderSource = OrderSource.WEBSITE;

    if (tableToken) {
      const table = await db.restaurantTable.findUnique({
        where: { qrToken: tableToken.trim() },
      });

      if (!table || !table.isActive) {
        return {
          success: false,
          error: 'The scanned dining table QR code is invalid or this table is currently inactive. Please ask our staff for assistance.',
        };
      }

      tableId = table.id;
      tableNumber = table.tableNumber;
      orderSource = OrderSource.DINE_IN;
    }

    // 2. Fetch all menu items from database to verify availability and retrieve accurate prices
    const itemIds = Array.from(new Set(items.map((i) => i.menuItemId)));
    const dbMenuItems = await db.menuItem.findMany({
      where: { id: { in: itemIds } },
      include: {
        category: true,
        variants: true,
        addOns: true,
      },
    });

    const menuItemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    // 3. Validate every item is published, available, and belongs to an active category
    for (const itemInput of items) {
      const dbItem = menuItemMap.get(itemInput.menuItemId);
      if (!dbItem) {
        return {
          success: false,
          error: 'One or more items in your order could not be found.',
        };
      }

      if (!dbItem.isPublished || !dbItem.isAvailable || !dbItem.category.active) {
        return {
          success: false,
          error: `"${dbItem.name}" is currently unavailable. Please adjust your cart.`,
        };
      }

      // Validate variant if specified
      if (itemInput.variantId) {
        const variant = dbItem.variants.find((v) => v.id === itemInput.variantId);
        if (!variant || !variant.isAvailable) {
          return {
            success: false,
            error: `Selected portion size for "${dbItem.name}" is currently unavailable.`,
          };
        }
      }

      // Validate add-ons if specified
      if (itemInput.addOnIds && itemInput.addOnIds.length > 0) {
        for (const addOnId of itemInput.addOnIds) {
          const addOn = dbItem.addOns.find((a) => a.id === addOnId);
          if (!addOn || !addOn.isAvailable) {
            return {
              success: false,
              error: `Selected add-on for "${dbItem.name}" is currently unavailable.`,
            };
          }
        }
      }
    }

    // 4. Server-Side Price Calculation using Prisma.Decimal
    let subtotal = new Prisma.Decimal(0);

    const orderItemsData: Array<{
      menuItemId: string;
      menuItemName: string;
      variantName: string | null;
      quantity: number;
      unitPrice: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
      specialInstructions: string | null;
      addOns: Array<{ addOnName: string; price: Prisma.Decimal }>;
    }> = [];

    for (const itemInput of items) {
      const dbItem = menuItemMap.get(itemInput.menuItemId)!;
      let unitPrice = new Prisma.Decimal(dbItem.basePrice);
      let variantName: string | null = null;

      if (itemInput.variantId) {
        const variant = dbItem.variants.find((v) => v.id === itemInput.variantId)!;
        unitPrice = unitPrice.add(variant.priceModifier);
        variantName = variant.name;
      }

      // Security check: ensure unitPrice is never negative
      if (unitPrice.isNegative()) {
        unitPrice = new Prisma.Decimal(0);
      }

      const itemLineTotal = unitPrice.mul(itemInput.quantity);
      subtotal = subtotal.add(itemLineTotal);

      // Process add-ons (deduplicate within single item to prevent double-charging)
      const itemAddOnsData: Array<{ addOnName: string; price: Prisma.Decimal }> = [];
      if (itemInput.addOnIds && itemInput.addOnIds.length > 0) {
        const uniqueAddOnIds = Array.from(new Set(itemInput.addOnIds));
        for (const addOnId of uniqueAddOnIds) {
          const addOn = dbItem.addOns.find((a) => a.id === addOnId)!;
          itemAddOnsData.push({
            addOnName: addOn.name,
            price: addOn.price,
          });
          // Add-on cost applied per item quantity
          const addOnTotal = addOn.price.mul(itemInput.quantity);
          subtotal = subtotal.add(addOnTotal);
        }
      }

      orderItemsData.push({
        menuItemId: dbItem.id,
        menuItemName: dbItem.name,
        variantName,
        quantity: itemInput.quantity,
        unitPrice,
        lineTotal: itemLineTotal,
        specialInstructions: itemInput.specialInstructions?.trim() || null,
        addOns: itemAddOnsData,
      });
    }

    // 5. Fetch Restaurant Settings for Tax Rate (GST)
    const settings = await db.restaurantSettings.findFirst();
    const taxRate = settings?.taxRate ? new Prisma.Decimal(settings.taxRate) : new Prisma.Decimal(0);
    const taxAmount = subtotal.mul(taxRate).div(100).toDecimalPlaces(2);
    const total = subtotal.add(taxAmount).toDecimalPlaces(2);

    // 6. Create Order in Database
    let orderNumber = generateOrderNumber();

    try {
      const newOrder = await db.$transaction(
        async (tx) => {
          // Ensure unique order number
          let isUnique = false;
          let attempts = 0;
          while (!isUnique && attempts < 5) {
            const found = await tx.order.findUnique({ where: { orderNumber } });
            if (!found) {
              isUnique = true;
            } else {
              orderNumber = generateOrderNumber();
              attempts++;
            }
          }

          // Upsert customer profile
          const customer = await tx.customer.upsert({
            where: { phone: customerPhone.trim() },
            update: {
              name: customerName.trim(),
              email: customerEmail.trim().toLowerCase(),
            },
            create: {
              phone: customerPhone.trim(),
              name: customerName.trim(),
              email: customerEmail.trim().toLowerCase(),
            },
          });

          const formattedNotes = notes?.trim()
            ? `[Email: ${customerEmail.trim().toLowerCase()}] ${notes.trim()}`
            : `[Email: ${customerEmail.trim().toLowerCase()}]`;

          const createdOrder = await tx.order.create({
            data: {
              orderNumber,
              tableId,
              customerId: customer.id,
              status: OrderStatus.PENDING,
              source: orderSource,
              customerName: customerName?.trim() || null,
              customerPhone: customerPhone?.trim() || null,
              notes: formattedNotes,
              subtotal,
              taxAmount,
              total,
              orderItems: {
                create: orderItemsData.map((oi) => ({
                  menuItemId: oi.menuItemId,
                  menuItemName: oi.menuItemName,
                  variantName: oi.variantName,
                  quantity: oi.quantity,
                  unitPrice: oi.unitPrice,
                  lineTotal: oi.lineTotal,
                  specialInstructions: oi.specialInstructions,
                  addOns: {
                    create: oi.addOns.map((ao) => ({
                      addOnName: ao.addOnName,
                      price: ao.price,
                    })),
                  },
                })),
              },
              paymentRecords: {
                create: {
                  method: PaymentMethod.CASH,
                  amount: total,
                  status: PaymentStatus.PENDING,
                  reference: 'Pay at Counter / Table',
                },
              },
            },
          });

          return createdOrder;
        },
        { maxWait: 10000, timeout: 30000 }
      );

      // Send Order Placement Notification Email immediately
      try {
        await sendOrderReceivedEmail({
          orderNumber: newOrder.orderNumber,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          customerPhone: customerPhone.trim(),
          tableNumber,
          items: orderItemsData.map((oi) => ({
            name: oi.menuItemName,
            variantName: oi.variantName,
            quantity: oi.quantity,
            lineTotal: Number(oi.lineTotal),
          })),
          subtotal: Number(subtotal),
          taxAmount: Number(taxAmount),
          total: Number(total),
        });
      } catch (emailErr) {
        console.error('[OrderAction:Email] Failed to send order received email:', emailErr);
      }

      safeRevalidatePath('/dashboard/orders');
      safeRevalidatePath('/kitchen');

      return {
        success: true,
        data: {
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          total: newOrder.total.toString(),
          tableNumber,
        },
      };
    } catch (err) {
      console.error('[OrderAction:PlaceOrder] Unexpected error:', err);
      return {
        success: false,
        error: 'An unexpected error occurred while placing your order. Please try again or inform staff.',
      };
    }
  };

  // If idempotencyKey is provided, lock execution promise in map
  if (idempotencyKey) {
    const orderPromise = executeOrderPlacement();
    recentIdempotencyKeys.set(idempotencyKey, { status: 'PENDING', promise: orderPromise });

    const result = await orderPromise;
    if (result.success && result.data) {
      recentIdempotencyKeys.set(idempotencyKey, {
        status: 'RESOLVED',
        orderId: result.data.orderId,
        orderNumber: result.data.orderNumber,
        total: result.data.total,
        tableNumber: result.data.tableNumber,
        timestamp: Date.now(),
      });
    } else {
      recentIdempotencyKeys.delete(idempotencyKey);
    }
    return result;
  }

  return await executeOrderPlacement();
}


/**
 * Valid order status progression transitions.
 */
const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * Admin / Kitchen Action: Update Order Status
 */
export async function updateOrderStatusAction(
  rawInput: Record<string, unknown>
): Promise<OrderActionResult<OrderDTO>> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER, Role.STAFF, Role.KITCHEN]);

  const parsed = updateOrderStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: 'Invalid order status data.' };
  }

  const { orderId, status: nextStatus } = parsed.data;

  const currentOrder = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, status: true },
  });

  if (!currentOrder) {
    return { success: false, error: 'Order not found.' };
  }

  if (currentOrder.status === nextStatus) {
    return { success: true };
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentOrder.status];
  if (!allowed.includes(nextStatus)) {
    return {
      success: false,
      error: `Cannot transition order from ${currentOrder.status} to ${nextStatus}.`,
    };
  }

  // Strict business rule: An order can ONLY be sent to kitchen (PREPARING) if payment is completed!
  if (nextStatus === OrderStatus.PREPARING) {
    const latestPayment = await db.paymentRecord.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestPayment || latestPayment.status !== PaymentStatus.COMPLETED) {
      return {
        success: false,
        error: 'Cannot send order to kitchen until online payment is completed by customer.',
      };
    }
  }

  try {
    const updated = await db.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });

    // When admin/staff confirms the order (ACCEPTED), send confirmation email with payment link to customer
    if (nextStatus === OrderStatus.ACCEPTED) {
      try {
        const fullOrder = await db.order.findUnique({
          where: { id: orderId },
          include: {
            orderItems: true,
            table: true,
            customer: true,
            paymentRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        });

        const customerEmail = fullOrder?.customer?.email || fullOrder?.notes?.match(/\[Email:\s*([^\]]+)\]/i)?.[1];
        if (customerEmail && fullOrder) {
          const isPaid = fullOrder.paymentRecords[0]?.status === PaymentStatus.COMPLETED;
          await sendOrderConfirmedByStaffEmail({
            orderNumber: fullOrder.orderNumber,
            customerName: fullOrder.customerName || fullOrder.customer?.name || 'Valued Guest',
            customerEmail: customerEmail.trim().toLowerCase(),
            customerPhone: fullOrder.customerPhone || fullOrder.customer?.phone,
            tableNumber: fullOrder.table?.tableNumber,
            paymentUrl: !isPaid ? `${getAppBaseUrl()}/pay/${fullOrder.id}` : undefined,
            items: fullOrder.orderItems.map((oi) => ({
              name: oi.menuItemName,
              variantName: oi.variantName,
              quantity: oi.quantity,
              lineTotal: Number(oi.lineTotal),
            })),
            subtotal: Number(fullOrder.subtotal),
            taxAmount: Number(fullOrder.taxAmount),
            total: Number(fullOrder.total),
          });
        }
      } catch (emailErr) {
        console.error('[OrderAction:Email] Error preparing confirmation email:', emailErr);
      }
    }

    await logAdminAction({
      userId: user.id,
      action: 'ORDER_STATUS_UPDATE',
      entity: 'Order',
      entityId: orderId,
      detail: {
        orderNumber: currentOrder.orderNumber,
        from: currentOrder.status,
        to: nextStatus,
      },
    });

    safeRevalidatePath('/dashboard/orders');
    safeRevalidatePath('/kitchen');

    return { success: true, data: serializeOrderDTO(updated) };
  } catch (err) {
    console.error('[OrderAction:UpdateStatus] Unexpected error:', err);
    return { success: false, error: 'Failed to update order status.' };
  }
}

/**
 * Admin / Staff Action: Update Payment Record Status
 */
export async function updatePaymentStatusAction(
  rawInput: Record<string, unknown>
): Promise<OrderActionResult> {
  const user = await requireAuth([Role.ADMIN, Role.MANAGER, Role.STAFF]);

  const parsed = updatePaymentStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: 'Invalid payment status data.' };
  }

  const { orderId, status: paymentStatus, method } = parsed.data;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { paymentRecords: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (!order) {
    return { success: false, error: 'Order not found.' };
  }

  if (order.status === OrderStatus.CANCELLED && paymentStatus === PaymentStatus.COMPLETED) {
    return {
      success: false,
      error: 'Cannot mark a cancelled order as paid.',
    };
  }

  try {
    if (order.paymentRecords.length > 0) {
      await db.paymentRecord.update({
        where: { id: order.paymentRecords[0].id },
        data: {
          status: paymentStatus,
          ...(method ? { method } : {}),
        },
      });
    } else {
      await db.paymentRecord.create({
        data: {
          orderId,
          method: method || PaymentMethod.CASH,
          amount: order.total,
          status: paymentStatus,
        },
      });
    }

    await logAdminAction({
      userId: user.id,
      action: 'PAYMENT_STATUS_UPDATE',
      entity: 'Order',
      entityId: orderId,
      detail: {
        orderNumber: order.orderNumber,
        status: paymentStatus,
        method,
      },
    });

    safeRevalidatePath('/dashboard/orders');
    return { success: true };
  } catch (err) {
    console.error('[OrderAction:UpdatePayment] Unexpected error:', err);
    return { success: false, error: 'Failed to update payment status.' };
  }
}
