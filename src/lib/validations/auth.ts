/**
 * src/lib/validations/auth.ts
 * Zod schemas for authentication-related inputs.
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and a number'
    ),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'KITCHEN']),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'KITCHEN']),
  active: z.boolean().optional(),
  password: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || (val.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val)),
      {
        message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number',
      }
    ),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(100),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
