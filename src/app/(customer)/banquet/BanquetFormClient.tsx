'use client';
/**
 * src/app/(customer)/banquet/BanquetFormClient.tsx
 * Interactive banquet enquiry form with status messaging.
 */

import React, { useActionState } from 'react';
import { Calendar, Users, Phone, Mail, User, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitBanquetEnquiry, type BanquetActionResult } from '@/server/actions/banquet';

const EVENT_TYPES = [
  'Wedding Reception',
  'Engagement Ceremony',
  'Birthday Celebration',
  'Anniversary Party',
  'Corporate Meeting / Seminar',
  'Puja / Religious Ceremony',
  'Family Get-Together',
  'Other Celebration',
];

export function BanquetFormClient() {
  const [state, formAction, isPending] = useActionState<BanquetActionResult | null, FormData>(
    submitBanquetEnquiry,
    null
  );

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-[#DDD0C8] shadow-xl">
      <div className="mb-6">
        <h3
          className="text-2xl font-bold text-[#241512] mb-1"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Check Banquet Availability
        </h3>
        <p className="text-sm text-[#5C4540]">
          Fill in your event details below. Our events manager will call you back within 2-4 hours with a tailored quote and date availability.
        </p>
      </div>

      {state?.success ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-emerald-900">Enquiry Received Successfully!</h4>
          <p className="text-sm text-emerald-800 leading-relaxed max-w-md mx-auto">
            {state.message}
          </p>
          <div className="pt-2">
            <p className="text-xs text-emerald-700 font-medium">
              Need immediate confirmation? Call directly:
            </p>
            <a
              href="tel:+919415268463"
              className="inline-block mt-1 text-sm font-bold text-[#7B1D1D] hover:underline"
            >
              +91 94152 68463
            </a>
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          {state && !state.success && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-[#241512] uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#5C4540] absolute left-3.5 top-3.5" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD0C8] bg-[#FFF8F0]/30 text-sm focus:border-[#7B1D1D] focus:ring-1 focus:ring-[#7B1D1D] outline-hidden text-[#241512]"
                />
              </div>
              {state?.errors?.name && (
                <p className="text-xs text-red-600 mt-1">{state.errors.name[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-[#241512] uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#5C4540] absolute left-3.5 top-3.5" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="e.g. 9415268463"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD0C8] bg-[#FFF8F0]/30 text-sm focus:border-[#7B1D1D] focus:ring-1 focus:ring-[#7B1D1D] outline-hidden text-[#241512]"
                />
              </div>
              {state?.errors?.phone && (
                <p className="text-xs text-red-600 mt-1">{state.errors.phone[0]}</p>
              )}
            </div>
          </div>

          {/* Email & Event Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#241512] uppercase tracking-wider mb-1.5">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5C4540] absolute left-3.5 top-3.5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD0C8] bg-[#FFF8F0]/30 text-sm focus:border-[#7B1D1D] focus:ring-1 focus:ring-[#7B1D1D] outline-hidden text-[#241512]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="eventType" className="block text-xs font-bold text-[#241512] uppercase tracking-wider mb-1.5">
                Event Type *
              </label>
              <select
                id="eventType"
                name="eventType"
                required
                defaultValue="Wedding Reception"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD0C8] bg-[#FFF8F0]/30 text-sm focus:border-[#7B1D1D] focus:ring-1 focus:ring-[#7B1D1D] outline-hidden text-[#241512]"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event Date & Guest Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventDate" className="block text-xs font-bold text-[#241512] uppercase tracking-wider mb-1.5">
                Tentative Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#5C4540] absolute left-3.5 top-3.5" />
                <input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD0C8] bg-[#FFF8F0]/30 text-sm focus:border-[#7B1D1D] focus:ring-1 focus:ring-[#7B1D1D] outline-hidden text-[#241512]"
                />
              </div>
              {state?.errors?.eventDate && (
                <p className="text-xs text-red-600 mt-1">{state.errors.eventDate[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="guestCount" className="block text-xs font-bold text-[#241512] uppercase tracking-wider mb-1.5">
                Estimated Guests *
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#5C4540] absolute left-3.5 top-3.5" />
                <input
                  id="guestCount"
                  name="guestCount"
                  type="number"
                  min={10}
                  max={1000}
                  required
                  defaultValue={50}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD0C8] bg-[#FFF8F0]/30 text-sm focus:border-[#7B1D1D] focus:ring-1 focus:ring-[#7B1D1D] outline-hidden text-[#241512]"
                />
              </div>
              {state?.errors?.guestCount && (
                <p className="text-xs text-red-600 mt-1">{state.errors.guestCount[0]}</p>
              )}
            </div>
          </div>

          {/* Message / Requirements */}
          <div>
            <label htmlFor="message" className="block text-xs font-bold text-[#241512] uppercase tracking-wider mb-1.5">
              Specific Requirements or Questions (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-[#5C4540] absolute left-3.5 top-3.5" />
              <textarea
                id="message"
                name="message"
                rows={3}
                placeholder="Tell us about food preferences (e.g. Jain / non-onion options), stage decoration, audio setup, etc."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD0C8] bg-[#FFF8F0]/30 text-sm focus:border-[#7B1D1D] focus:ring-1 focus:ring-[#7B1D1D] outline-hidden text-[#241512]"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="default"
            disabled={isPending}
            className="w-full font-bold shadow-md text-base mt-2"
          >
            {isPending ? (
              <span>Submitting Details...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-4 h-4 text-[#E0C278]" />
                Submit Banquet Enquiry
              </span>
            )}
          </Button>

          <p className="text-center text-xs text-[#5C4540] pt-1">
            🔒 Your contact information is kept private and used only for event coordination.
          </p>
        </form>
      )}
    </div>
  );
}
