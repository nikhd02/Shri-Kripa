/**
 * src/lib/validations/order.ts
 * Zod validation schemas for customer checkout, order placement, and status updates.
 */

import { z } from 'zod';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export const orderItemInputSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item ID is required.'),
  variantId: z.string().optional().nullable(),
  addOnIds: z.array(z.string()).default([]),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a number.' })
    .int('Quantity must be an integer.')
    .min(1, 'Quantity must be at least 1.')
    .max(50, 'Quantity cannot exceed 50 per item.'),
  specialInstructions: z
    .string()
    .trim()
    .max(200, 'Special instructions cannot exceed 200 characters.')
    .optional()
    .nullable(),
});

export const placeOrderSchema = z.object({
  tableToken: z.string().trim().optional().nullable(),
  customerName: z
    .string()
    .trim()
    .max(100, 'Name cannot exceed 100 characters.')
    .optional()
    .nullable(),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, 'Invalid phone number format.')
    .max(20, 'Phone number cannot exceed 20 characters.')
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes cannot exceed 500 characters.')
    .optional()
    .nullable(),
  idempotencyKey: z.string().trim().optional().nullable(),
  items: z
    .array(orderItemInputSchema)
    .min(1, 'You must include at least one menu item in your order.'),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required.'),
  status: z.nativeEnum(OrderStatus),
});

export const updatePaymentStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required.'),
  status: z.nativeEnum(PaymentStatus),
  method: z.nativeEnum(PaymentMethod).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
