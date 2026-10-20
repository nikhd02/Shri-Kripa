/**
 * src/app/(customer)/book-table/BookTableClient.tsx
 *
 * Interactive Table Booking Client Component with free-choice time selection,
 * real-time availability validation, guest form, and instant confirmation display.
 */

'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  ArrowRight,
  Phone,
  MapPin,
  Check,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  checkSingleSlotAvailabilityAction,
  createTableBookingAction,
  BookingDTO,
} from '@/server/actions/bookings';

interface BookTableClientProps {
  operatingHours: string;
  restaurantPhone: string;
  googleMapsUrl?: string | null;
}

// Indian Standard Time Helpers
function getTodayIST(): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

function getMinutesNowIST(): number {
  try {
    const timeStr = new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
    });
    const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  } catch {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
}

const POPULAR_TIMES = [
  { time: '12:30', label: '12:30 PM' },
  { time: '13:00', label: '01:00 PM' },
  { time: '13:30', label: '01:30 PM' },
  { time: '14:00', label: '02:00 PM' },
  { time: '19:30', label: '07:30 PM' },
  { time: '20:00', label: '08:00 PM' },
  { time: '20:30', label: '08:30 PM' },
  { time: '21:00', label: '09:00 PM' },
];

export function BookTableClient({
  operatingHours,
  restaurantPhone,
  googleMapsUrl,
}: BookTableClientProps) {
  // Today in YYYY-MM-DD (Indian Standard Time)
  const todayStr = getTodayIST();
  const [currentISTMinutes, setCurrentISTMinutes] = useState<number>(getMinutesNowIST);

  // Live timer: Refresh current minutes every 30 seconds so past times auto-update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentISTMinutes(getMinutesNowIST());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState<string>(todayStr);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [specialRequest, setSpecialRequest] = useState<string>('');

  // Real-time Availability State for Freely Chosen Time
  const [timeAvailability, setTimeAvailability] = useState<{
    checking: boolean;
    available?: boolean;
    isPast?: boolean;
    reason?: string;
    formattedTime?: string;
  } | null>(null);

  // Submission State
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingDTO | null>(null);

  // Check availability whenever chosen time, date, or guest count changes
  useEffect(() => {
    let isCancelled = false;
    if (!selectedSlot) {
      setTimeAvailability(null);
      return;
    }

    // Quick client-side check if time has already passed for today
    if (bookingDate === todayStr) {
      const [h, m] = selectedSlot.split(':').map((x) => parseInt(x, 10));
      const slotMin = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
      if (slotMin < currentISTMinutes) {
        setTimeAvailability({
          checking: false,
          available: false,
          isPast: true,
          reason: 'This time has already passed for today. Please choose an upcoming time.',
        });
        return;
      }
    }

    async function checkSlot() {
      setTimeAvailability({ checking: true });
      try {
        const res = await checkSingleSlotAvailabilityAction(
          bookingDate,
          selectedSlot,
          guestCount
        );
        if (isCancelled) return;
        if (res.success) {
          setTimeAvailability({
            checking: false,
            available: res.available,
            isPast: res.isPast,
            reason: res.reason,
            formattedTime: res.formattedTime,
          });
        } else {
          setTimeAvailability({
            checking: false,
            available: false,
            reason: res.reason || 'Could not verify table availability for this time.',
          });
        }
      } catch {
        if (isCancelled) return;
        setTimeAvailability({
          checking: false,
          available: false,
          reason: 'Network error checking time availability.',
        });
      }
    }

    checkSlot();
    return () => {
      isCancelled = true;
    };
  }, [selectedSlot, bookingDate, guestCount, currentISTMinutes, todayStr]);

  // Handle Form Submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!bookingDate) {
      setSubmitError('Please select a reservation date.');
      return;
    }

    if (!selectedSlot) {
      setSubmitError('Please choose a dining time for your reservation.');
      return;
    }

    if (timeAvailability && !timeAvailability.checking && !timeAvailability.available) {
      setSubmitError(
        timeAvailability.reason ||
          'Sorry, no tables are available for this time. Please choose another time or contact the restaurant.'
      );
      return;
    }

    if (bookingDate === todayStr) {
      const [h, m] = selectedSlot.split(':').map(Number);
      if (h * 60 + m < currentISTMinutes) {
        setSubmitError('The selected time has already passed for today. Please choose an upcoming time.');
        return;
      }
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      setSubmitError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }

    startSubmitTransition(async () => {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        guestCount,
        bookingDate,
        timeSlot: selectedSlot,
        specialRequest: specialRequest.trim() || undefined,
      };

      const res = await createTableBookingAction(payload);

      if (res.success && res.booking) {
        setConfirmedBooking(res.booking);
      } else {
        setSubmitError(res.error || 'Failed to complete your booking. Please try another time.');
      }
    });
  };

  // If Booking is Confirmed, render the receipt view
  if (confirmedBooking) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#C9A84C]/40 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
            Reservation Confirmed!
          </span>
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-[#7B1D1D]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            We Are Ready For You!
          </h2>
          <p className="text-xs sm:text-sm text-[#241512]/75 max-w-md mx-auto mt-1">
            Thank you, <strong>{confirmedBooking.customerName}</strong>. Your dining table has been reserved at Shree Kripa.
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#FFF8F0] border border-[#C9A84C]/30 text-left space-y-3 text-xs sm:text-sm">
          <div className="flex justify-between pb-2 border-b border-[#ebdcd0]">
            <span className="text-[#6b5c58]">Booking Reference:</span>
            <span className="font-mono font-bold text-[#7B1D1D] text-base">
              {confirmedBooking.bookingReference}
            </span>
          </div>

          <div className="flex justify-between pb-2 border-b border-[#ebdcd0]">
            <span className="text-[#6b5c58]">Reservation Date:</span>
            <span className="font-bold text-[#241512]">{confirmedBooking.bookingDate}</span>
          </div>

          <div className="flex justify-between pb-2 border-b border-[#ebdcd0]">
            <span className="text-[#6b5c58]">Time Slot:</span>
            <span className="font-bold text-[#7B1D1D]">{confirmedBooking.timeSlot} (90 Mins)</span>
          </div>

          <div className="flex justify-between pb-2 border-b border-[#ebdcd0]">
            <span className="text-[#6b5c58]">Guests:</span>
            <span className="font-bold text-[#241512]">{confirmedBooking.guestCount} Guests</span>
          </div>

          {confirmedBooking.tableNumber && (
            <div className="flex justify-between pb-2 border-b border-[#ebdcd0]">
              <span className="text-[#6b5c58]">Assigned Table:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Table {confirmedBooking.tableNumber}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-[#6b5c58]">Primary Contact:</span>
            <span className="font-medium text-[#241512]">
              {confirmedBooking.customerPhone}
            </span>
          </div>

          {confirmedBooking.specialRequest && (
            <div className="pt-2 border-t border-[#ebdcd0]">
              <span className="text-[#6b5c58] block mb-1">Special Request:</span>
              <p className="italic text-[#241512] bg-white p-2.5 rounded-xl border border-[#ebdcd0] text-xs">
                &ldquo;{confirmedBooking.specialRequest}&rdquo;
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-[#241512]/70 max-w-sm mx-auto">
          Please arrive 5–10 minutes prior to your reserved slot. If your plans change, please give us a call to release or reschedule your table.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            asChild
            className="w-full sm:w-auto bg-[#7B1D1D] hover:bg-[#521212] text-white font-bold"
          >
            <Link href="/menu">Explore Our Menu</Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setConfirmedBooking(null);
              setSelectedSlot('');
            }}
            className="w-full sm:w-auto border-[#C9A84C]/50 text-[#7B1D1D] hover:bg-[#FFF8F0]"
          >
            Reserve Another Table
          </Button>
        </div>
      </div>
    );
  }

  // Active Booking Form
  return (
    <form
      onSubmit={handleSubmitBooking}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C9A84C]/30 shadow-xl space-y-8"
    >
      <div>
        <h2
          className="text-2xl font-bold text-[#7B1D1D] flex items-center gap-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <Sparkles className="w-5 h-5 text-[#C9A84C]" />
          Reserve a Dining Table
        </h2>
        <p className="text-xs text-[#241512]/70 mt-1">
          Pick your preferred date, dining time, and guest count. Live real-time availability check ({operatingHours}).
        </p>
      </div>

      {submitError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-bold">{submitError}</p>
              <p className="text-[11px] text-red-700 mt-0.5">
                Please contact our reception desk for immediate reservation assistance.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-red-200">
            <Button asChild size="sm" className="bg-[#7B1D1D] hover:bg-[#521212] text-white text-xs h-8">
              <Link href="/contact">Contact Restaurant</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-red-300 text-[#7B1D1D] hover:bg-white text-xs h-8">
              <a href={`tel:${restaurantPhone}`}>
                <Phone className="w-3 h-3 mr-1.5" />
                Call +91 {restaurantPhone}
              </a>
            </Button>
            {googleMapsUrl && (
              <Button asChild variant="ghost" size="sm" className="text-[#7B1D1D] hover:bg-white/80 text-xs h-8">
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="w-3 h-3 mr-1.5" />
                  Get Directions
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ─── 1. Date & Time Selection (Side by Side Native Pickers) ─── */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Reservation Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#241512] mb-1.5 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-[#C9A84C]" />
              Reservation Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={todayStr}
              value={bookingDate}
              onChange={(e) => {
                setBookingDate(e.target.value);
                setSubmitError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden font-medium bg-white"
              required
            />
          </div>

          {/* Reservation Time - Custom Free Choice Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#241512] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#C9A84C]" />
                Reservation Time <span className="text-red-500">*</span>
              </span>
              {selectedSlot && (
                <span className="text-[11px] font-bold text-[#7B1D1D]">
                  {timeAvailability?.formattedTime || selectedSlot}
                </span>
              )}
            </label>
            <input
              type="time"
              value={selectedSlot}
              onChange={(e) => {
                setSelectedSlot(e.target.value);
                setSubmitError(null);
              }}
              min="11:00"
              max="22:00"
              step="900"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden font-medium bg-white cursor-pointer"
              required
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Opening hours: 11:00 AM – 11:00 PM (Last seating at 10:00 PM)
            </p>
          </div>
        </div>

        {/* Quick Pick Popular Suggested Times */}
        <div>
          <label className="block text-[11px] font-bold text-gray-600 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
            Quick Suggestions:
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {POPULAR_TIMES.map((pt) => {
              const isSelected = selectedSlot === pt.time;
              return (
                <button
                  key={pt.time}
                  type="button"
                  onClick={() => {
                    setSelectedSlot(pt.time);
                    setSubmitError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#7B1D1D] text-white border-[#7B1D1D] shadow-xs'
                      : 'bg-[#FFF8F0] text-[#241512] border-[#C9A84C]/30 hover:bg-[#ebdcd0]/60'
                  }`}
                >
                  {pt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Number of Guests */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#241512] mb-1.5 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#C9A84C]" />
            Number of Guests <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[2, 4, 6, 8, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setGuestCount(num)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  guestCount === num
                    ? 'bg-[#7B1D1D] text-white border-[#7B1D1D] shadow-sm'
                    : 'bg-[#FFF8F0] text-[#241512] border-[#C9A84C]/30 hover:bg-[#ebdcd0]/50'
                }`}
              >
                {num}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={30}
              value={guestCount}
              onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-2 rounded-xl border border-gray-300 text-center text-xs font-bold focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden"
              title="Custom guest count"
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            Need more than 30 seats? Please check our <Link href="/banquet" className="text-[#7B1D1D] underline font-semibold">Banquet & Celebrations</Link> page.
          </p>
        </div>

        {/* ─── Real-Time Live Status Feedback For Chosen Time ─── */}
        <div className="pt-1">
          {!selectedSlot ? (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>Please pick your preferred dining time above to verify real-time table availability.</span>
            </div>
          ) : timeAvailability?.checking ? (
            <div className="p-3.5 rounded-xl bg-[#FFF8F0] border border-[#C9A84C]/30 text-xs text-[#7B1D1D] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#7B1D1D] flex-shrink-0" />
              <span>Checking live table availability for {selectedSlot}...</span>
            </div>
          ) : timeAvailability?.available ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950">
                    🟢 {timeAvailability.formattedTime || selectedSlot} is Available!
                  </p>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Table ready for {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'} • 90 mins dining duration
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                Ready to Reserve
              </span>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200 mb-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    {timeAvailability?.formattedTime || selectedSlot}: Not Available
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#7B1D1D]">
                    {timeAvailability?.reason ||
                      'Sorry, no tables are available for this time slot. Please contact the restaurant for assistance or try another time.'}
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Our front-desk team can assist with waitlist availability or adjacent seating.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200">
                <Button asChild size="sm" className="bg-[#7B1D1D] hover:bg-[#521212] text-white font-bold text-xs h-8">
                  <Link href="/contact">Contact Restaurant</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-[#C9A84C]/80 text-[#7B1D1D] hover:bg-white text-xs h-8">
                  <a href={`tel:${restaurantPhone}`}>
                    <Phone className="w-3 h-3 mr-1.5" />
                    Call +91 {restaurantPhone}
                  </a>
                </Button>
                {googleMapsUrl && (
                  <Button asChild variant="ghost" size="sm" className="text-[#7B1D1D] hover:bg-white/80 text-xs h-8">
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                      <MapPin className="w-3 h-3 mr-1.5" />
                      Get Directions
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. Customer Contact Info ─── */}
      <div className="border-t border-gray-200 pt-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#241512] flex items-center gap-1.5">
          <User className="w-4 h-4 text-[#C9A84C]" />
          Primary Guest Contact
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Patel"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Mobile Number (10 Digits) <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              required
              maxLength={10}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Email Address (For Confirmation)
            </label>
            <input
              type="email"
              placeholder="e.g. ramesh@gmail.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">
            Special Requests & Seating Preferences (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Window seating preferred, anniversary celebration, high chair needed for toddler..."
            value={specialRequest}
            onChange={(e) => setSpecialRequest(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden"
          />
        </div>
      </div>

      {/* ─── 3. Submit Button ─── */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={
            isSubmitting ||
            !selectedSlot ||
            (timeAvailability !== null && !timeAvailability.checking && !timeAvailability.available)
          }
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7B1D1D] to-[#521212] hover:from-[#661818] hover:to-[#3e0d0d] text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            'Reserving Your Table...'
          ) : (
            <>
              <span>Confirm Table Reservation ({guestCount} Guests)</span>
              <ArrowRight className="w-4 h-4 text-[#E0C278]" />
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-gray-500 mt-2">
          Zero advance fee • Instant reservation confirmation
        </p>
      </div>
    </form>
  );
}
