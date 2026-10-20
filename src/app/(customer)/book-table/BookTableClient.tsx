/**
 * src/app/(customer)/book-table/BookTableClient.tsx
 *
 * Interactive Table Booking Client Component with dynamic capacity validation,
 * slot selection, guest form, and instant confirmation display.
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getAvailableBookingSlotsAction,
  createTableBookingAction,
  BookingSlot,
  BookingDTO,
} from '@/server/actions/bookings';

interface BookTableClientProps {
  operatingHours: string;
  restaurantPhone: string;
  googleMapsUrl?: string | null;
}

export function BookTableClient({
  operatingHours,
  restaurantPhone,
  googleMapsUrl,
}: BookTableClientProps) {
  // Today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Booking Form State
  const [bookingDate, setBookingDate] = useState<string>(todayStr);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedUnavailableSlot, setSelectedUnavailableSlot] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [specialRequest, setSpecialRequest] = useState<string>('');

  // Slots State
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingDTO | null>(null);

  // Fetch available slots whenever date or guest count changes
  useEffect(() => {
    let isCancelled = false;

    async function loadSlots() {
      setIsLoadingSlots(true);
      setSlotsError(null);
      setSelectedSlot('');
      setSelectedUnavailableSlot(null);

      try {
        const res = await getAvailableBookingSlotsAction(bookingDate, guestCount);
        if (isCancelled) return;
        if (res.success && res.slots) {
          setSlots(res.slots);
          if (res.error) {
            setSlotsError(res.error);
          }
        } else {
          setSlots([]);
          setSlotsError(res.error || 'Could not load slots for this date.');
        }
      } catch {
        if (isCancelled) return;
        setSlots([]);
        setSlotsError('Network error while checking slot availability.');
      } finally {
        if (!isCancelled) {
          setIsLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      isCancelled = true;
    };
  }, [bookingDate, guestCount]);

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedSlot) {
      setSubmitError('Please select a dining time slot.');
      return;
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
        setSubmitError(res.error || 'Failed to complete your booking. Please try another slot.');
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
            <span className="text-[#6b5c58]">Party Size:</span>
            <span className="font-bold text-[#241512]">{confirmedBooking.guestCount} Guests</span>
          </div>

          {confirmedBooking.tableNumber && (
            <div className="flex justify-between pb-2 border-b border-[#ebdcd0]">
              <span className="text-[#6b5c58]">Assigned Table:</span>
              <span className="font-bold text-[#241512]">Table {confirmedBooking.tableNumber}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-[#6b5c58]">Status:</span>
            <span className="font-bold text-amber-700 uppercase text-xs">
              {confirmedBooking.status}
            </span>
          </div>
        </div>

        {confirmedBooking.customerEmail && (
          <p className="text-xs text-emerald-800 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200 inline-block">
            ✉️ A booking confirmation email has been dispatched to <strong>{confirmedBooking.customerEmail}</strong>.
          </p>
        )}

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 max-w-md mx-auto">
          ℹ️ <strong>Arrival Reminder:</strong> Tables are held for 15 minutes past your scheduled reservation time. For delays, please call <strong>+91 {restaurantPhone}</strong>.
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            className="w-full sm:w-auto bg-[#7B1D1D] hover:bg-[#521212] text-white font-bold"
          >
            <Link href="/menu">Browse Culinary Menu</Link>
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
          Select Date, Guests & Time
        </h2>
        <p className="text-xs text-[#241512]/70 mt-1">
          Real-time table availability based on configured operating schedule ({operatingHours}).
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

      {/* ─── 1. Date & Guest Count ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#241512] mb-1.5 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-[#C9A84C]" />
            Reservation Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            min={todayStr}
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden font-medium"
            required
          />
        </div>

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
      </div>

      {/* ─── 2. Time Slot Selection ─── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#241512] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C9A84C]" />
              <span>Dining Time Slots</span>
              <span className="text-red-500">*</span>
            </label>
            <p className="text-[10px] text-gray-500 mt-0.5">
              90 mins standard dining slot • Live real-time table availability
            </p>
          </div>

          {/* Real-time Status Legend */}
          {slots.length > 0 && !isLoadingSlots && (
            <div className="flex items-center gap-3 text-[11px] bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs inline-block animate-pulse" />
                Available ({slots.filter((s) => s.available).length})
              </span>
              <span className="text-gray-300">|</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Booked ({slots.filter((s) => !s.available).length})
              </span>
            </div>
          )}
        </div>

        {isLoadingSlots ? (
          <div className="p-8 text-center bg-[#FFF8F0]/50 rounded-2xl border border-gray-200">
            <div className="w-6 h-6 border-2 border-[#7B1D1D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-600">Checking live table availability & capacity...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#7B1D1D]">
                  {slotsError || 'Online reservations are currently unavailable. Please contact the restaurant for assistance.'}
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Tables can be reserved via phone call with our reception team.
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
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {slots.map((slot) => {
                const isSelected = selectedSlot === slot.time;
                const isUnavailableClicked = selectedUnavailableSlot === slot.time;

                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => {
                      if (slot.available) {
                        setSelectedSlot(slot.time);
                        setSelectedUnavailableSlot(null);
                      } else {
                        setSelectedSlot('');
                        setSelectedUnavailableSlot(slot.time);
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer relative flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#7B1D1D] text-white border-[#7B1D1D] shadow-md ring-2 ring-[#C9A84C]'
                        : slot.available
                        ? 'bg-emerald-50/40 hover:bg-emerald-50 border-emerald-300 text-[#241512] hover:shadow-xs'
                        : isUnavailableClicked
                        ? 'bg-rose-100 border-rose-400 text-rose-950 ring-2 ring-rose-500 shadow-xs'
                        : 'bg-gray-100/80 border-gray-200 text-gray-500 hover:border-rose-300 hover:bg-rose-50/40'
                    }`}
                    title={slot.reason || (slot.available ? `${slot.remainingCapacity} seats free` : 'Booked / Unavailable')}
                  >
                    <p className={`text-xs font-bold tracking-tight ${isSelected ? 'text-white' : slot.available ? 'text-[#241512]' : 'text-gray-600'}`}>
                      {slot.label}
                    </p>
                    
                    {/* Explicit visual status tag */}
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C] text-[#241512] shadow-2xs">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    ) : slot.available ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Booked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Status banner for selected available slot */}
            {selectedSlot && (
              <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-medium">
                      Selected Slot: <strong className="font-bold text-[#7B1D1D]">{slots.find((s) => s.time === selectedSlot)?.label}</strong>
                      {' • '}Status:{' '}
                      <strong className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                        Available for {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                      </strong>
                    </span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Table reserved for your party. Please complete the guest details below.
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-auto text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-md border border-emerald-200 shadow-2xs">
                  Ready to Book
                </span>
              </div>
            )}

            {/* Display assistance banner when user clicked an unavailable slot or if all slots are unavailable */}
            {(selectedUnavailableSlot || !slots.some((s) => s.available)) && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    {selectedUnavailableSlot && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200 mb-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Slot {slots.find((s) => s.time === selectedUnavailableSlot)?.label || selectedUnavailableSlot}: Booked / Unavailable
                      </div>
                    )}
                    <p className="text-xs sm:text-sm font-bold text-[#7B1D1D]">
                      Sorry, no tables are available for this time slot. Please contact the restaurant for assistance or try another time.
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
        )}
      </div>

      {/* ─── 3. Customer Contact Info ─── */}
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

      {/* ─── Submit Button ─── */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !selectedSlot}
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
