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
    .string({ required_error: 'Name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name cannot exceed 100 characters.'),
  customerPhone: z
    .string({ required_error: 'Phone number is required.' })
    .trim()
    .regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number.'),
  customerEmail: z
    .string({ required_error: 'Email address is required.' })
    .trim()
    .email('Please enter a valid email address.')
    .max(200, 'Email cannot exceed 200 characters.'),
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
