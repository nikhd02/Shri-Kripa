/**
 * src/server/actions/banquet.ts
 * Server action to handle banquet enquiries securely.
 */

'use server';

import { db } from '@/lib/db';
import { z } from 'zod';

const banquetEnquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Please enter a valid 10-digit phone number').max(15),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  eventType: z.string().min(2, 'Please select or enter an event type'),
  eventDate: z.string().min(1, 'Please select an event date'),
  guestCount: z.coerce.number().min(10, 'Minimum guest count is 10').max(1000),
  message: z.string().max(1000).optional().or(z.literal('')),
});

export type BanquetEnquiryInput = z.infer<typeof banquetEnquirySchema>;

export interface BanquetActionResult {
  success: boolean;
  message: string;
  enquiryId?: string;
  errors?: Record<string, string[]>;
}

export async function submitBanquetEnquiry(
  prevState: BanquetActionResult | null,
  formData: FormData
): Promise<BanquetActionResult> {
  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email') || '',
    eventType: formData.get('eventType'),
    eventDate: formData.get('eventDate'),
    guestCount: formData.get('guestCount'),
    message: formData.get('message') || '',
  };

  const parsed = banquetEnquirySchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Please check your input fields.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const data = parsed.data;
    const parsedDate = new Date(data.eventDate);

    const enquiry = await db.banquetEnquiry.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        eventType: data.eventType,
        eventDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
        guestCount: data.guestCount,
        message: data.message || null,
        status: 'NEW',
      },
    });

    return {
      success: true,
      message: 'Thank you! Your banquet enquiry has been received. Our team will contact you shortly.',
      enquiryId: enquiry.id,
    };
  } catch (err) {
    console.error('Error submitting banquet enquiry:', err);
    return {
      success: false,
      message: 'Unable to submit enquiry at this moment. Please call us directly at 9415268463.',
    };
  }
}
