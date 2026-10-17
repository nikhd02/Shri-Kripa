/**
 * src/app/(customer)/contact/page.tsx
 * Contact & Location Page for Shree Kripa Family Restaurant & Banquet.
 */

import React from 'react';
import type { Metadata } from 'next';
import {
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Navigation,
  Car,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export const metadata: Metadata = {
  title: 'Location & Contact | Shree Kripa Family Restaurant & Banquet, Varanasi',
  description:
    'Find directions, contact numbers, and opening hours for Shree Kripa Family Restaurant & Banquet on Akhari Bypass, Varanasi. Google Maps directions and direct inquiry lines.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-24">
      {/* ─── Hero Header ─── */}
      <section className="bg-[#5A1515] text-white pt-28 pb-16 px-4 relative overflow-hidden border-b border-[#C9A84C]/20">
        <div className="container-restaurant text-center max-w-3xl relative z-10">
          <ScrollReveal variant="fade-up">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#E0C278] text-xs uppercase font-bold tracking-widest mb-4">
              <MapPin className="w-3.5 h-3.5" />
              Visit Shree Kripa
            </span>

            <h1
              className="text-white text-3xl sm:text-5xl font-extrabold tracking-tight mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Location & Contact
            </h1>

            <p className="text-[#E0C278] text-base sm:text-lg font-semibold tracking-wide mb-3" lang="hi">
              श्री कृपा फैमिली रेस्टोरेंट एंड बैंक्वेट — स्थान एवं संपर्क
            </p>

            <p className="text-[#FFF8F0]/90 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Plan your visit or reach out directly to our management team for reservations, table booking, or banquet inquiries.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Content ─── */}
      <main className="container-restaurant py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Information Cards Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Address & Directions Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#DDD0C8] shadow-md space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-[#7B1D1D]/10 text-[#7B1D1D] shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#241512] mb-1">Verified Location</h2>
                  <address className="not-italic text-sm text-[#5C4540] leading-relaxed">
                    <strong>Shree Kripa Family Restaurant & Banquet</strong><br />
                    Akhari Bypass, Varanasi,<br />
                    Uttar Pradesh 221011, India
                  </address>
                </div>
              </div>

              <div className="pt-2">
                <Button asChild size="md" variant="accent" className="w-full font-bold shadow-xs">
                  <a
                    href="https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Get Directions on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Calling Lines */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#DDD0C8] shadow-md space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#241512] mb-1">Direct Calling Numbers</h2>
                  <p className="text-xs text-[#5C4540] mb-3">Call us anytime for reservations, takeaway, or directions.</p>
                  
                  <div className="space-y-2">
                    <a
                      href="tel:+919415268463"
                      className="block p-3 rounded-xl bg-[#FFF8F0] border border-[#DDD0C8] text-sm font-bold text-[#7B1D1D] hover:bg-[#7B1D1D] hover:text-white transition-colors"
                    >
                      +91 94152 68463 <span className="text-xs font-normal opacity-75">(Main Line)</span>
                    </a>
                    <a
                      href="tel:+919125669366"
                      className="block p-3 rounded-xl bg-[#FFF8F0] border border-[#DDD0C8] text-sm font-bold text-[#7B1D1D] hover:bg-[#7B1D1D] hover:text-white transition-colors"
                    >
                      +91 91256 69366 <span className="text-xs font-normal opacity-75">(Banquet Coordination)</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Opening Hours & Accessibility */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#DDD0C8] shadow-md space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-[#C9A84C]/15 text-[#9A7B2A] shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#241512] mb-1">Operational Hours</h2>
                  <p className="text-sm text-[#5C4540]">
                    Monday to Sunday: <strong className="text-[#241512]">11:00 AM – 11:00 PM</strong>
                  </p>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    Open 365 Days a Year • Full Dining & Delivery
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#DDD0C8]/60 flex items-center gap-3 text-xs text-[#5C4540]">
                <Car className="w-4 h-4 text-[#7B1D1D] shrink-0" />
                <span>Complimentary parking for cars and two-wheelers available on premise.</span>
              </div>
            </div>
          </div>

          {/* Interactive Map Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl overflow-hidden border-2 border-[#DDD0C8] shadow-xl bg-white flex flex-col">
              <div className="bg-[#7B1D1D] text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Google Maps Location Pin</h3>
                  <p className="text-xs text-[#E0C278]">Coordinates: 25.249383, 82.952153</p>
                </div>
                <Button asChild size="sm" variant="accent" className="text-xs font-bold">
                  <a
                    href="https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5"
                  >
                    <span>Open in Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </div>

              <div className="relative w-full h-[440px] sm:h-[500px]">
                <iframe
                  title="Shree Kripa Family Restaurant and Banquet Interactive Map"
                  src="https://maps.google.com/maps?q=25.249383,82.9521527&hl=en&z=15&output=embed"
                  width="100%"
                  height="100%"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="p-5 bg-[#FFF8F0] border-t border-[#DDD0C8] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#5C4540] text-center sm:text-left">
                  <p className="font-bold text-[#241512]">Landmark & Navigation Tip:</p>
                  <p>Located on the Akhari Bypass stretch with convenient direct highway access.</p>
                </div>
                <Button asChild size="md" variant="default" className="font-bold shrink-0">
                  <a
                    href="https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Navigation className="w-4 h-4 text-[#E0C278]" />
                    Get Driving Directions
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
