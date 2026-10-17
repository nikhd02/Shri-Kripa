/**
 * src/app/(customer)/banquet/page.tsx
 * Banquet and events booking page for Shree Kripa Family Restaurant & Banquet.
 */

import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import {
  Calendar,
  Users,
  UtensilsCrossed,
  Music,
  Sparkles,
  Phone,
  Clock,
  MapPin,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { BanquetFormClient } from './BanquetFormClient';

export const metadata: Metadata = {
  title: 'Banquet Hall & Celebrations | Shree Kripa Family Restaurant, Varanasi',
  description:
    'Host unforgettable wedding receptions, birthdays, family functions, and corporate events at Shree Kripa Banquet Hall in Varanasi. Royal pure vegetarian catering and decor.',
};

export default function BanquetPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-24">
      {/* ─── Hero Header ─── */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] flex items-center justify-center overflow-hidden bg-[#241512]">
        <div className="absolute inset-0 z-0">
          <Image
            src="/banquet.jpg"
            alt="Royal banquet setup with marigold garlands and warm ambient lighting"
            fill
            priority
            className="object-cover object-center opacity-40 brightness-90"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 z-1 bg-gradient-to-t from-[#241512] via-[#5A1515]/75 to-[#3D0A0A]/85" />

        <div className="container-restaurant relative z-10 pt-28 pb-16 text-center max-w-3xl">
          <ScrollReveal variant="fade-up">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#E0C278] text-xs uppercase font-bold tracking-widest backdrop-blur-md mb-4">
              <Calendar className="w-3.5 h-3.5" />
              Celebrations & Banquets
            </span>

            <h1
              className="text-white text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-3 drop-shadow-md"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              The Grand Banquet Hall
            </h1>

            <p className="text-[#E0C278] text-base sm:text-xl font-medium tracking-wide mb-3" lang="hi">
              श्री कृपा बैंक्वेट हॉल — मांगलिक एवं पारिवारिक उत्सव
            </p>

            <p className="text-[#FFF8F0]/90 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Celebrate your life’s happiest milestones with royal pure vegetarian catering, elegant stage decoration, and warm personalized service on Akhari Bypass, Varanasi.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <main className="container-restaurant -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Details Column */}
          <div className="lg:col-span-7 space-y-8">
            {/* Banquet Overview */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DDD0C8] shadow-md space-y-6">
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-[#241512]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                A Venue Designed for Memorable Celebrations
              </h2>

              <p className="text-[#4A3030] text-sm sm:text-base leading-relaxed">
                Whether you are planning an intimate anniversary dinner for 30 guests or a grand wedding reception for over 300 relatives, Shree Kripa Banquet Hall provides all essential amenities under one roof.
              </p>

              {/* Amenities Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  {
                    icon: Users,
                    title: 'Capacity up to 300+ Guests',
                    desc: 'Comfortable seating arrangements, banquet round-tables, and dining area.',
                  },
                  {
                    icon: UtensilsCrossed,
                    title: 'Pure Vegetarian Buffet',
                    desc: 'Customized live counters, chaat, north Indian gravies, and desserts.',
                  },
                  {
                    icon: Sparkles,
                    title: 'Stage & Floral Decor',
                    desc: 'Elegant stage setup, fresh flower garlands, and festive backdrop lighting.',
                  },
                  {
                    icon: Music,
                    title: 'Audio & Music System',
                    desc: 'Clear public address system, wireless microphones, and celebration acoustics.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#DDD0C8]/70">
                      <div className="flex items-center gap-2.5 text-[#7B1D1D] font-bold text-sm mb-1.5">
                        <Icon className="w-4 h-4 text-[#C9A84C]" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-xs text-[#5C4540] leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event Types Supported */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DDD0C8] shadow-md">
              <h3 className="text-xl font-bold text-[#241512] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Perfect For Every Auspicious Occasion
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  '💍 Wedding Receptions',
                  '✨ Engagement Ceremonies',
                  '🎂 Birthday Parties',
                  '💐 Anniversary Bashes',
                  '🪔 Katha & Puja Functions',
                  '👔 Corporate Seminars',
                ].map((ev) => (
                  <div key={ev} className="p-3 rounded-xl bg-[#FFF8F0] border border-[#DDD0C8] text-xs font-semibold text-[#241512]">
                    {ev}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Contact & Directions Bar */}
            <div className="p-6 rounded-3xl bg-[#7B1D1D] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div>
                <p className="text-xs text-[#E0C278] font-bold uppercase tracking-wider">Direct Banquet Line</p>
                <p className="text-lg font-bold text-white">+91 94152 68463 / 9125669366</p>
                <p className="text-xs text-white/80 mt-0.5">Talk with our banquet coordinator for instant dates</p>
              </div>

              <Button
                asChild
                size="md"
                variant="accent"
                className="font-bold text-xs shrink-0 shadow-md"
              >
                <a
                  href="https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  View Venue Location
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>
          </div>

          {/* Right Enquiry Form Column */}
          <div className="lg:col-span-5 sticky top-24">
            <BanquetFormClient />
          </div>
        </div>
      </main>
    </div>
  );
}
