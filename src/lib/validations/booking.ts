/**
 * src/lib/validations/booking.ts
 *
 * Validation schemas for table bookings and staff management.
 */

import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBookingSchema = z.object({
  customerName: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  customerPhone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'),
  customerEmail: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(200, 'Email cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),
  guestCount: z.coerce
    .number({ invalid_type_error: 'Guest count must be a number' })
    .int('Guest count must be an integer')
    .min(1, 'Minimum 1 guest is required')
    .max(30, 'For parties larger than 30 guests, please enquire via our Banquet & Events section'),
  bookingDate: z
    .string({ required_error: 'Reservation date is required' })
    .trim()
    .min(10, 'Invalid date format (YYYY-MM-DD)'),
  timeSlot: z
    .string({ required_error: 'Time slot is required' })
    .trim()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time slot must be in HH:MM format (e.g. 13:00, 19:30)'),
  specialRequest: z
    .string()
    .trim()
    .max(500, 'Special requests cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  preOrderItems: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        variantName: z.string().optional(),
        specialInstructions: z.string().max(200).optional(),
      })
    )
    .optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  status: z.nativeEnum(BookingStatus),
  tableId: z.string().optional().nullable(),
  staffNotes: z.string().max(500).optional().nullable(),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
