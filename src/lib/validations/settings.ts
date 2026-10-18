/**
 * src/lib/validations/settings.ts
 * Zod validation schema for restaurant settings.
 */

import { z } from 'zod';

export const updateSettingsSchema = z.object({
  restaurantName: z
    .string()
    .min(2, 'Restaurant name must be at least 2 characters')
    .max(200, 'Restaurant name cannot exceed 200 characters')
    .trim(),
  phone1: z
    .string()
    .min(10, 'Primary phone must be at least 10 digits')
    .max(20, 'Primary phone cannot exceed 20 characters')
    .trim(),
  phone2: z
    .string()
    .max(20, 'Secondary phone cannot exceed 20 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .trim(),
  googleMapsUrl: z
    .string()
    .max(500, 'Google Maps URL is too long')
    .trim()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || val.startsWith('https://') || val.startsWith('http://'),
      { message: 'Please enter a valid URL starting with https://' }
    ),
  openingHours: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  timezone: z
    .string()
    .min(2)
    .max(60)
    .default('Asia/Kolkata'),
  taxRate: z
    .number({ invalid_type_error: 'Tax rate must be a number' })
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%'),
  taxLabel: z
    .string()
    .min(1, 'Tax label is required')
    .max(20, 'Tax label cannot exceed 20 characters')
    .trim()
    .default('GST'),
  currency: z
    .string()
    .min(1)
    .max(10)
    .default('INR'),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
