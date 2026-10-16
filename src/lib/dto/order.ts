/**
 * src/lib/dto/order.ts
 * Typed Data Transfer Objects (DTOs) and explicit serialization helpers for Orders,
 * Order Items, and Payment Records.
 *
 * Guarantees that no Prisma Decimal objects or raw Date objects cross the Server-to-Client
 * boundary, preventing Next.js 16 serialization errors.
 */

import {
  Order,
  OrderItem,
  OrderItemAddOn,
  PaymentRecord,
  OrderStatus,
  OrderSource,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

/**
 * Converts a Prisma Decimal, number, or string to an exact decimal string.
 * Never loses precision and returns safe primitives for Client Components.
 */
export function toDecimalString(
  val: Prisma.Decimal | number | string | null | undefined,
  fallback = '0.00'
): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val.toFixed(2);
  return val.toString();
}

export interface OrderItemAddOnDTO {
  id: string;
  orderItemId: string;
  addOnName: string;
  price: string;
  createdAt: string;
}

export interface OrderItemDTO {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  specialInstructions: string | null;
  createdAt: string;
  addOns: OrderItemAddOnDTO[];
}

export interface PaymentRecordDTO {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: string;
  status: PaymentStatus;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TableSummaryDTO {
  id: string;
  tableNumber: string;
  capacity: number;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  tableId: string | null;
  customerId: string | null;
  status: OrderStatus;
  source: OrderSource;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  subtotal: string;
  taxAmount: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  table?: TableSummaryDTO | null;
  orderItems?: OrderItemDTO[];
  paymentRecords?: PaymentRecordDTO[];
}

/**
 * Admin order board item DTO
 */
export interface AdminOrderDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  source: OrderSource;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  subtotal: string;
  taxAmount: string;
  total: string;
  createdAt: string;
  tableNumber: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: Array<{
    id: string;
    name: string;
    variantName: string | null;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    specialInstructions: string | null;
    addOns: Array<{ name: string; price: string }>;
  }>;
}

/**
 * Kitchen display ticket DTO
 */
export interface KitchenOrderDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  source: OrderSource;
  customerName: string | null;
  notes: string | null;
  createdAt: string;
  tableNumber: string | null;
  items: Array<{
    id: string;
    name: string;
    variantName: string | null;
    quantity: number;
    specialInstructions: string | null;
    addOns: string[];
  }>;
}

/**
 * Serializes a single OrderItemAddOn
 */
export function serializeOrderItemAddOnDTO(addOn: OrderItemAddOn): OrderItemAddOnDTO {
  return {
    id: addOn.id,
    orderItemId: addOn.orderItemId,
    addOnName: addOn.addOnName,
    price: toDecimalString(addOn.price),
    createdAt: addOn.createdAt.toISOString(),
  };
}

/**
 * Serializes a single OrderItem with its optional addOns
 */
export function serializeOrderItemDTO(
  item: OrderItem & { addOns?: OrderItemAddOn[] }
): OrderItemDTO {
  return {
    id: item.id,
    orderId: item.orderId,
    menuItemId: item.menuItemId,
    menuItemName: item.menuItemName,
    variantName: item.variantName,
    quantity: item.quantity,
    unitPrice: toDecimalString(item.unitPrice),
    lineTotal: toDecimalString(item.lineTotal),
    specialInstructions: item.specialInstructions,
    createdAt: item.createdAt.toISOString(),
    addOns: (item.addOns || []).map(serializeOrderItemAddOnDTO),
  };
}

/**
 * Serializes a single PaymentRecord
 */
export function serializePaymentRecordDTO(payment: PaymentRecord): PaymentRecordDTO {
  return {
    id: payment.id,
    orderId: payment.orderId,
    method: payment.method,
    amount: toDecimalString(payment.amount),
    status: payment.status,
    reference: payment.reference,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

/**
 * Serializes a standard Order with all decimal and date fields converted to strings
 */
export function serializeOrderDTO(
  order: Order,
  relations?: {
    table?: { id: string; tableNumber: string; capacity: number } | null;
    orderItems?: Array<OrderItem & { addOns?: OrderItemAddOn[] }>;
    paymentRecords?: PaymentRecord[];
  }
): OrderDTO {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    tableId: order.tableId,
    customerId: order.customerId,
    status: order.status,
    source: order.source,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    notes: order.notes,
    subtotal: toDecimalString(order.subtotal),
    taxAmount: toDecimalString(order.taxAmount),
    total: toDecimalString(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    table: relations?.table
      ? {
          id: relations.table.id,
          tableNumber: relations.table.tableNumber,
          capacity: relations.table.capacity,
        }
      : null,
    orderItems: relations?.orderItems ? relations.orderItems.map(serializeOrderItemDTO) : undefined,
    paymentRecords: relations?.paymentRecords ? relations.paymentRecords.map(serializePaymentRecordDTO) : undefined,
  };
}

/**
 * Serializes an order for the Admin Orders management board
 */
export function serializeAdminOrderDTO(
  order: Order & {
    table?: { tableNumber: string; capacity?: number } | null;
    orderItems: Array<OrderItem & { addOns: OrderItemAddOn[] }>;
    paymentRecords: PaymentRecord[];
  }
): AdminOrderDTO {
  const latestPayment = order.paymentRecords[0];

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    source: order.source,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    notes: order.notes,
    subtotal: toDecimalString(order.subtotal),
    taxAmount: toDecimalString(order.taxAmount),
    total: toDecimalString(order.total),
    createdAt: order.createdAt.toISOString(),
    tableNumber: order.table?.tableNumber || null,
    paymentStatus: latestPayment?.status || PaymentStatus.PENDING,
    paymentMethod: latestPayment?.method || PaymentMethod.CASH,
    items: order.orderItems.map((item) => ({
      id: item.id,
      name: item.menuItemName,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: toDecimalString(item.unitPrice),
      lineTotal: toDecimalString(item.lineTotal),
      specialInstructions: item.specialInstructions,
      addOns: item.addOns.map((a) => ({
        name: a.addOnName,
        price: toDecimalString(a.price),
      })),
    })),
  };
}

/**
 * Serializes an order for the Kitchen Display System (KDS)
 */
export function serializeKitchenOrderDTO(
  order: Order & {
    table?: { tableNumber: string } | null;
    orderItems: Array<OrderItem & { addOns: OrderItemAddOn[] }>;
  }
): KitchenOrderDTO {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    source: order.source,
    customerName: order.customerName,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    tableNumber: order.table?.tableNumber || null,
    items: order.orderItems.map((item) => ({
      id: item.id,
      name: item.menuItemName,
      variantName: item.variantName,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions,
      addOns: item.addOns.map((a) => a.addOnName),
    })),
  };
}
