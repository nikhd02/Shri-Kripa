/**
 * src/lib/validations/table.ts
 * Zod validation schemas for restaurant tables.
 */

import { z } from 'zod';

export const tableSchema = z.object({
  tableNumber: z
    .string()
    .trim()
    .min(1, 'Table number is required.')
    .max(20, 'Table number cannot exceed 20 characters.')
    .regex(/^[A-Za-z0-9_-]+$/, 'Table number can only contain letters, numbers, hyphens, and underscores.'),
  capacity: z.coerce
    .number({ invalid_type_error: 'Capacity must be a number.' })
    .int('Capacity must be an integer.')
    .min(1, 'Capacity must be at least 1 person.')
    .max(100, 'Capacity cannot exceed 100 people.'),
  isActive: z.coerce.boolean().default(true),
  onlineBookingEnabled: z.coerce.boolean().default(false),
});

export type TableInput = z.infer<typeof tableSchema>;
