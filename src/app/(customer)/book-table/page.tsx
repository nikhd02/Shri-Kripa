/**
 * src/app/(customer)/book-table/page.tsx
 *
 * Public Table Reservation Page for Shree Kripa Family Restaurant.
 */

import React from 'react';
import type { Metadata } from 'next';
import { CalendarDays, Clock, Phone, MapPin, Sparkles, UtensilsCrossed, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/db';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { BookTableClient } from './BookTableClient';

export const metadata: Metadata = {
  title: 'Book a Table | Shree Kripa Family Restaurant, Varanasi',
  description:
    'Reserve your dining table online at Shree Kripa Family Restaurant & Banquet, Akhari Bypass, Varanasi. Live capacity checking, instant booking confirmation, and zero booking fee.',
};

export const dynamic = 'force-dynamic';

export default async function BookTablePage() {
  const settings = await db.restaurantSettings.findFirst();

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-24">
      {/* ─── Hero Header ─── */}
      <section className="bg-gradient-to-b from-[#5A1515] to-[#7B1D1D] text-white pt-28 pb-16 px-4 relative overflow-hidden border-b border-[#C9A84C]/25">
        <div className="container-restaurant text-center max-w-3xl relative z-10">
          <ScrollReveal variant="fade-up">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#E0C278] text-xs uppercase font-bold tracking-widest mb-4">
              <CalendarDays className="w-3.5 h-3.5" />
              Dining Reservations
            </span>

            <h1
              className="text-white text-3xl sm:text-5xl font-extrabold tracking-tight mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Reserve Your Table
            </h1>

            <p className="text-[#E0C278] text-base sm:text-lg font-semibold tracking-wide mb-3" lang="hi">
              श्री कृपा फैमिली रेस्टोरेंट — टेबल आरक्षण
            </p>

            <p className="text-[#FFF8F0]/90 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Experience authentic pure vegetarian North Indian culinary delights with loved ones. Live seat availability, zero advance fees, and instant confirmation.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Main Booking Content ─── */}
      <main className="container-restaurant py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Interactive Booking Form */}
          <div className="lg:col-span-8">
            <BookTableClient
              operatingHours={settings?.openingHours || '11:00 AM - 11:00 PM'}
              restaurantPhone={settings?.phone1 || '9415268463'}
              googleMapsUrl={settings?.googleMapsUrl || null}
            />
          </div>

          {/* Right Column: Restaurant Highlights & Reservation Policy */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Summary Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#C9A84C]/30 shadow-md space-y-4">
              <h2
                className="text-xl font-bold text-[#7B1D1D] flex items-center gap-2"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <UtensilsCrossed className="w-5 h-5 text-[#C9A84C]" />
                Dining Experience
              </h2>

              <ul className="space-y-3 text-xs sm:text-sm text-[#241512]/85">
                <li className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                  <span><strong>100% Pure Vegetarian:</strong> Multi-cuisine North Indian, Tandoori, & South Indian delicacies.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                  <span><strong>Operating Schedule:</strong> {settings?.openingHours || '11:00 AM - 11:00 PM'} Daily.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                  <span><strong>Zero Booking Fee:</strong> No prepayment required. Pay after dining via Cash, UPI, or Card.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                  <span><strong>Location:</strong> Akhari Bypass, Near Flyover / Toll Plaza, Varanasi.</span>
                </li>
              </ul>
            </div>

            {/* Policy & Help Card */}
            <div className="p-6 rounded-2xl bg-[#5A1515] text-white shadow-lg space-y-4 border border-[#C9A84C]/30">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#E0C278]">
                Table Reservation Policy
              </h3>
              <p className="text-xs text-[#FFF8F0]/85 leading-relaxed">
                • Reserved tables are held up to <strong>15 minutes</strong> past your scheduled reservation time before being released to walk-in guests.
              </p>
              <p className="text-xs text-[#FFF8F0]/85 leading-relaxed">
                • Standard dining duration is <strong>90 minutes</strong> to ensure all families enjoy an unhurried culinary experience.
              </p>
              <p className="text-xs text-[#FFF8F0]/85 leading-relaxed">
                • For large celebrations (30+ guests), please book via our <strong>Banquet & Events</strong> section.
              </p>

              <div className="pt-2 border-t border-white/15">
                <p className="text-xs text-[#E0C278] font-semibold mb-1">Need help or special arrangements?</p>
                <a
                  href={`tel:${settings?.phone1 || '9415268463'}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-[#E0C278] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#E0C278]" />
                  +91 {settings?.phone1 || '94152 68463'}
                </a>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
