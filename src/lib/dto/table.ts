/**
 * src/lib/dto/table.ts
 * Typed Data Transfer Objects (DTOs) and serialization helpers for Dining Tables.
 */

import { RestaurantTable } from '@prisma/client';

export interface TableDTO {
  id: string;
  tableNumber: string;
  capacity: number;
  qrToken: string;
  isActive: boolean;
  onlineBookingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  activeOrdersCount: number;
}

export function serializeTableDTO(
  table: RestaurantTable,
  activeOrdersCount = 0
): TableDTO {
  return {
    id: table.id,
    tableNumber: table.tableNumber,
    capacity: table.capacity,
    qrToken: table.qrToken,
    isActive: table.isActive,
    onlineBookingEnabled: table.onlineBookingEnabled,
    createdAt: table.createdAt.toISOString(),
    updatedAt: table.updatedAt.toISOString(),
    activeOrdersCount,
  };
}
