/**
 * src/app/(customer)/page.tsx
 * Shree Kripa Family Restaurant & Banquet — Immersive Cinematic Web Experience
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Phone,
  MapPin,
  UtensilsCrossed,
  Sparkles,
  Users,
  Calendar,
  ChevronRight,
  Leaf,
  ExternalLink,
  Award,
  Clock,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Shree Kripa Family Restaurant & Banquet | Pure Vegetarian Dining in Varanasi',
  description:
    'Experience cinematic pure vegetarian dining and grand banquet celebrations at Shree Kripa, located on Akhari Bypass, Varanasi. Authentic North Indian dishes, thalis, and festive hospitality.',
};

export const dynamic = 'force-dynamic';

interface SignatureItem {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  category: string;
  isVeg: boolean;
}

export default async function HomePage() {
  // Query only published and available menu items directly from the database
  let signatureItems: SignatureItem[] = [];
  try {
    let dbItems = await db.menuItem.findMany({
      where: {
        isPublished: true,
        isAvailable: true,
        category: {
          slug: { in: ['main-course-veg', 'thali-veg', 'starters', 'pizza-pasta'] },
        },
      },
      take: 6,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    if (!dbItems || dbItems.length === 0) {
      dbItems = await db.menuItem.findMany({
        where: { isPublished: true, isAvailable: true },
        take: 6,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: { category: { select: { name: true } } },
      });
    }

    if (dbItems && dbItems.length > 0) {
      signatureItems = dbItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || 'Prepared fresh with authentic spices and pure ingredients.',
        basePrice: item.basePrice.toString(),
        category: item.category?.name || 'Pure Veg Specialty',
        isVeg: item.isVeg,
      }));
    }
  } catch (err) {
    console.error('Failed to query signature dishes from database:', err);
    signatureItems = [];
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF8F0] text-[#241512] overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────────
          1. HERO SECTION: Full-Width Cinematic Presentation
      ─────────────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#241512]"
        aria-label="Welcome to Shree Kripa"
      >
        {/* Background Visual Asset */}
        <div className="absolute inset-0 z-0 scale-105 transition-transform duration-1000 ease-out">
          <Image
            src="/hero-food.jpg"
            alt="Authentic vegetarian Indian dining spread with Paneer, Dal Makhani, Naan and aromatic rice"
            fill
            priority
            className="object-cover object-center opacity-45 brightness-95"
            sizes="100vw"
          />
        </div>

        {/* Cinematic Gradient Overlays */}
        <div
          className="absolute inset-0 z-1 bg-gradient-to-t from-[#241512] via-[#5A1515]/75 to-[#3D0A0A]/85"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 z-1 bg-[radial-gradient(circle_at_center,_transparent_0%,_#241512_90%)] opacity-70"
          aria-hidden="true"
        />

        {/* Content Container */}
        <div className="container-restaurant relative z-10 py-24 sm:py-32 text-center flex flex-col items-center">
          <ScrollReveal variant="fade-up" delay={0}>
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                100% Pure Vegetarian
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#E0C278] text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-[#E0C278]" />
                Akhari Bypass, Varanasi
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={1}>
            <h1
              className="text-white text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none mb-3 drop-shadow-lg"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Shree Kripa
            </h1>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={2}>
            <p
              className="text-[#E0C278] text-lg sm:text-2xl md:text-3xl font-medium tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Family Restaurant & Banquet
            </p>
            <p className="text-[#FFF8F0]/90 text-base sm:text-lg font-semibold mb-6 tracking-wider" lang="hi">
              श्री कृपा फैमिली रेस्टोरेंट एंड बैंक्वेट
            </p>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={3}>
            <p className="text-[#FFF8F0]/90 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal mb-8 sm:mb-10 text-balance">
              Where authentic Awadhi & North Indian vegetarian traditions meet royal hospitality.
              Cherished family dinners, flavorful thalis, and unforgettable celebrations in Varanasi.
            </p>
          </ScrollReveal>

          {/* Action CTAs */}
          <ScrollReveal variant="fade-up" delay={4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md sm:max-w-none">
              <Button
                asChild
                size="lg"
                variant="accent"
                className="w-full sm:w-auto font-bold text-base px-7 py-6 shadow-xl hover:scale-105 transition-transform"
              >
                <Link href="/menu" className="flex items-center justify-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" />
                  Explore Full Menu
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-[#E0C278] text-[#FFF8F0] bg-white/10 hover:bg-white/20 hover:text-white font-bold text-base px-6 py-6 backdrop-blur-xs"
              >
                <Link href="/banquet" className="flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5 text-[#E0C278]" />
                  Book Banquet Hall
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-[#C9A84C]/60 text-[#E0C278] hover:bg-[#C9A84C] hover:text-[#241512] font-bold text-base px-6 py-6 transition-colors"
              >
                <a
                  href="https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  Get Directions
                  <ExternalLink className="w-4 h-4 ml-0.5 opacity-80" />
                </a>
              </Button>
            </div>
          </ScrollReveal>

          {/* Visual Creative Notice */}
          <div className="mt-12 pt-6 border-t border-white/10 text-center">
            <p className="text-[11px] text-[#FFF8F0]/50 tracking-wider uppercase font-medium">
              Illustrative culinary presentation • Authentic Pure Vegetarian Craft in Varanasi
            </p>
          </div>
        </div>

        {/* Elegant Bottom Transition Curve */}
        <div className="absolute bottom-0 left-0 right-0 z-10" aria-hidden="true">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-8 sm:h-14 preserve-3d">
            <path
              d="M0 60V20C240 45 480 60 720 60C960 60 1200 45 1440 20V60H0Z"
              fill="#FFF8F0"
            />
          </svg>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          2. OUR STORY & HERITAGE: Warm Atmosphere & Family Hospitality
      ─────────────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-[#FFF8F0] relative overflow-hidden" aria-labelledby="heritage-heading">
        <div className="container-restaurant">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Visual showcase card */}
            <div className="lg:col-span-6 relative">
              <ScrollReveal variant="fade-right">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#C9A84C]/40 group">
                  <div className="relative h-[340px] sm:h-[440px] w-full">
                    <Image
                      src="/interior.jpg"
                      alt="Warm, festive dining room ambiance at Shree Kripa with royal arches and traditional lighting"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  {/* Subtle badge on image */}
                  <div className="absolute bottom-4 left-4 right-4 bg-[#241512]/80 backdrop-blur-md rounded-2xl p-4 border border-[#C9A84C]/30 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#E0C278] font-semibold uppercase tracking-wider">Atmosphere</p>
                        <p className="text-sm font-bold text-white">Warm, Royal Indian Family Dining</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#C9A84C]/30 text-[#E0C278] border border-[#C9A84C]/40 font-semibold">
                        Akhari Bypass
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Narrative copy */}
            <div className="lg:col-span-6 space-y-6">
              <ScrollReveal variant="fade-left">
                <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-[#7B1D1D] bg-[#7B1D1D]/10 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
                  A Varanasi Tradition
                </div>

                <h2
                  id="heritage-heading"
                  className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#241512] leading-tight"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Rooted in Pure Taste & Unconditional Hospitality
                </h2>

                <hr className="gold-divider max-w-24" />

                <p className="text-[#4A3030] text-base sm:text-lg leading-relaxed">
                  Located along Akhari Bypass, <strong className="text-[#7B1D1D]">Shree Kripa Family Restaurant & Banquet</strong> was
                  created with a singular purpose: to give families in Varanasi a comforting haven where authentic vegetarian recipes are cooked with pristine purity, rich spices, and genuine love.
                </p>

                <p className="text-[#5C4540] text-sm sm:text-base leading-relaxed">
                  Whether you are dropping in with loved ones for a hearty dinner, sharing our signature paneer preparations and chur-chur naans, or gathering hundreds of relatives for a royal wedding reception, our team is committed to making every meal memorable.
                </p>

                {/* Highlights grid */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-[#DDD0C8] shadow-xs">
                    <Leaf className="w-6 h-6 text-emerald-600 mb-2" />
                    <h3 className="font-bold text-sm text-[#241512]">100% Pure Veg</h3>
                    <p className="text-xs text-[#5C4540] mt-1">Zero compromise on kitchen sanctity and hygiene.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#DDD0C8] shadow-xs">
                    <Users className="w-6 h-6 text-[#7B1D1D] mb-2" />
                    <h3 className="font-bold text-sm text-[#241512]">Spacious Dining</h3>
                    <p className="text-xs text-[#5C4540] mt-1">Comfortable tables tailored for small and large families.</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-4">
                  <Button asChild variant="default" size="md" className="font-bold">
                    <Link href="/menu">Browse Our Dishes</Link>
                  </Button>
                  <Button asChild variant="outline" size="md" className="border-[#7B1D1D] text-[#7B1D1D] hover:bg-[#7B1D1D] hover:text-white font-bold">
                    <Link href="/contact">Visit Our Restaurant</Link>
                  </Button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          3. SIGNATURE DELIGHTS: Curated from Database
      ─────────────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-[#F5EEE6] border-y border-[#DDD0C8]" aria-labelledby="signature-heading">
        <div className="container-restaurant">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <ScrollReveal variant="fade-up">
              <span className="text-xs uppercase font-bold tracking-widest text-[#7B1D1D] bg-[#7B1D1D]/10 px-3.5 py-1 rounded-full inline-block mb-3">
                From Our Master Chefs
              </span>
              <h2
                id="signature-heading"
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#241512] mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Signature Vegetarian Specialties
              </h2>
              <hr className="gold-divider max-w-24 mx-auto mb-4" />
              <p className="text-[#5C4540] text-sm sm:text-base leading-relaxed">
                Prepared with slow-simmered gravies, hand-pounded spices, and pure dairy cottage cheese.
              </p>
            </ScrollReveal>
          </div>

          {/* Cards Grid — Only real menu items from database */}
          {signatureItems.length > 0 ? (
            <div
              className={
                signatureItems.length === 1
                  ? 'max-w-md mx-auto'
                  : signatureItems.length === 2
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              }
            >
              {signatureItems.map((dish, idx) => (
                <ScrollReveal key={dish.id} variant="fade-up" delay={(idx % 3) as 0 | 1 | 2}>
                  <div className="h-full flex flex-col justify-between p-6 rounded-2xl bg-white border border-[#DDD0C8] hover:border-[#C9A84C] hover:shadow-xl transition-all duration-300 group">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#7B1D1D] bg-[#7B1D1D]/10 px-2.5 py-0.5 rounded-md">
                          {dish.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                          <span className="text-xs font-semibold text-emerald-700">Veg</span>
                        </div>
                      </div>

                      <h3
                        className="text-lg font-bold text-[#241512] group-hover:text-[#7B1D1D] transition-colors mb-2"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {dish.name}
                      </h3>

                      <p className="text-sm text-[#5C4540] leading-relaxed line-clamp-3 mb-4">
                        {dish.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#DDD0C8]/60 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-xs text-[#5C4540] block">Price</span>
                        <span className="text-lg font-extrabold text-[#7B1D1D]">
                          ₹{dish.basePrice}
                        </span>
                      </div>

                      <Button asChild size="sm" variant="accent" className="font-bold text-xs">
                        <Link href="/menu" className="inline-flex items-center gap-1">
                          Order in Menu
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl border border-[#DDD0C8] max-w-lg mx-auto shadow-xs">
              <UtensilsCrossed className="w-8 h-8 text-[#C9A84C] mx-auto mb-3" />
              <p className="text-[#241512] font-bold text-base mb-1">Explore Our Full Menu</p>
              <p className="text-sm text-[#5C4540] mb-4">
                Browse our complete list of pure vegetarian starters, thalis, and specialties.
              </p>
              <Button asChild size="sm" variant="accent" className="font-bold">
                <Link href="/menu">Open Digital Menu</Link>
              </Button>
            </div>
          )}

          {/* View All Menu Button */}
          <div className="mt-12 text-center">
            <Button asChild size="lg" variant="default" className="font-bold px-8 shadow-md">
              <Link href="/menu" className="inline-flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#E0C278]" />
                Explore Complete Restaurant Menu
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          4. THE GRAND BANQUET: Weddings, Birthdays & Celebrations
      ─────────────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-[#3D0A0A] text-white relative overflow-hidden" aria-labelledby="banquet-heading">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#7B1D1D]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="container-restaurant relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Banquet Details */}
            <div className="lg:col-span-6 space-y-6">
              <ScrollReveal variant="fade-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#E0C278] text-xs uppercase font-bold tracking-widest">
                  <Calendar className="w-3.5 h-3.5" />
                  Royal Events & Gatherings
                </div>

                <h2
                  id="banquet-heading"
                  className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  The Grand Banquet Hall & Celebrations
                </h2>

                <hr className="gold-divider max-w-24" />

                <p className="text-[#FFF8F0]/90 text-base sm:text-lg leading-relaxed">
                  Make your momentous occasions unforgettable. From wedding receptions, engagements, and anniversary parties to birthdays, corporate conferences, and holy katha ceremonies — Shree Kripa Banquet offers the ideal setting.
                </p>

                {/* Event features checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    'Air-Conditioned Banquet Space',
                    'Custom Pure Veg Catering Menus',
                    'Theme Stage & Floral Decor',
                    'High-Definition Audio & Mic Setup',
                    'Capacity up to 300+ Guests',
                    'Dedicated Valet & Guest Parking',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5 text-sm text-[#FFF8F0]/90">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#C9A84C]/30 text-[#E0C278] shrink-0 text-xs font-bold">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-wrap gap-4">
                  <Button asChild size="lg" variant="accent" className="font-bold shadow-lg">
                    <Link href="/banquet" className="inline-flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Book Banquet Event
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/50 text-white hover:bg-white/15 font-bold"
                  >
                    <a href="tel:+919415268463" className="inline-flex items-center gap-2">
                      <Phone className="w-5 h-5 text-[#E0C278]" />
                      Call: 9415268463
                    </a>
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            {/* Banquet Image Asset */}
            <div className="lg:col-span-6">
              <ScrollReveal variant="fade-left">
                <div className="relative rounded-3xl overflow-hidden border-4 border-[#C9A84C]/50 shadow-2xl group">
                  <div className="relative h-[360px] sm:h-[460px] w-full">
                    <Image
                      src="/banquet.jpg"
                      alt="Grand banquet celebration setup at Shree Kripa with royal marigold garlands, warm chandeliers, and elegant table arrangements"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#241512]/90 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <p className="text-xs uppercase tracking-widest text-[#E0C278] font-bold">Royal Hospitality</p>
                    <p className="text-lg font-bold">Customized Pure Vegetarian Feasts for All Occasions</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          5. WHY FAMILIES CHOOSE SHREE KRIPA (The 4 Pillars)
      ─────────────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-[#FFF8F0]" aria-labelledby="pillars-heading">
        <div className="container-restaurant">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <ScrollReveal variant="fade-up">
              <span className="text-xs uppercase font-bold tracking-widest text-[#7B1D1D] bg-[#7B1D1D]/10 px-3.5 py-1 rounded-full inline-block mb-3">
                Our Guarantee
              </span>
              <h2
                id="pillars-heading"
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#241512] mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Why Families Trust Shree Kripa
              </h2>
              <hr className="gold-divider max-w-24 mx-auto mb-4" />
              <p className="text-[#5C4540] text-sm sm:text-base">
                Committed to delivering authentic taste, absolute hygiene, and peaceful hospitality every single day.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Leaf,
                title: 'Strictly Pure Veg',
                desc: 'Our kitchen maintains complete vegetarian sanctity with dedicated utensils, fresh farm produce, and zero compromise.',
                color: 'text-emerald-700',
                bg: 'bg-emerald-100',
              },
              {
                icon: Award,
                title: 'Desi Ghee & Fresh Dairy',
                desc: 'Crafted with premium dairy paneer, pure desi ghee, and slow-roasted whole spices for that rich authentic aroma.',
                color: 'text-[#C9A84C]',
                bg: 'bg-[#C9A84C]/15',
              },
              {
                icon: HeartHandshake,
                title: 'Warm Family Environment',
                desc: 'Thoughtfully designed dining zones where families and children feel completely comfortable, relaxed, and welcomed.',
                color: 'text-[#7B1D1D]',
                bg: 'bg-[#7B1D1D]/10',
              },
              {
                icon: ShieldCheck,
                title: 'Highway Convenience',
                desc: 'Easily accessible on Akhari Bypass with spacious on-site parking, quick highway ingress, and clean modern washrooms.',
                color: 'text-blue-700',
                bg: 'bg-blue-100',
              },
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <ScrollReveal key={pillar.title} variant="fade-up" delay={idx as 0 | 1 | 2 | 3}>
                  <div className="p-7 rounded-2xl bg-white border border-[#DDD0C8] hover:border-[#C9A84C] hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-start">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pillar.bg} mb-5`}>
                      <Icon className={`w-6 h-6 ${pillar.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-[#241512] mb-2">{pillar.title}</h3>
                    <p className="text-sm text-[#5C4540] leading-relaxed">{pillar.desc}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          6. LOCATION, VISITOR GUIDE & GOOGLE MAPS DIRECTIONS
      ─────────────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-[#F5EEE6] border-t border-[#DDD0C8]" aria-labelledby="location-heading">
        <div className="container-restaurant">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <ScrollReveal variant="fade-up">
              <span className="text-xs uppercase font-bold tracking-widest text-[#7B1D1D] bg-[#7B1D1D]/10 px-3.5 py-1 rounded-full inline-block mb-3">
                Plan Your Visit
              </span>
              <h2
                id="location-heading"
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#241512] mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Find Us in Varanasi
              </h2>
              <hr className="gold-divider max-w-24 mx-auto mb-4" />
              <p className="text-[#5C4540] text-sm sm:text-base">
                Conveniently situated along the Akhari Bypass, Varanasi. Use Google Maps for turn-by-turn directions.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Details Column */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              <ScrollReveal variant="fade-right">
                {/* Verified Address Card */}
                <div className="p-6 rounded-2xl bg-white border border-[#DDD0C8] shadow-xs">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#7B1D1D]/10 text-[#7B1D1D] shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#241512] mb-1">Restaurant & Banquet Address</h3>
                      <address className="not-italic text-sm text-[#5C4540] leading-relaxed font-medium">
                        Shree Kripa Family Restaurant & Banquet<br />
                        Akhari Bypass, Varanasi,<br />
                        Uttar Pradesh 221011, India
                      </address>
                      <div className="mt-3">
                        <Button
                          asChild
                          size="sm"
                          variant="accent"
                          className="font-bold shadow-xs text-xs"
                        >
                          <a
                            href="https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5"
                          >
                            <span>Get Directions</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operating Hours Card */}
                <div className="p-6 rounded-2xl bg-white border border-[#DDD0C8] shadow-xs mt-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#C9A84C]/15 text-[#C9A84C] shrink-0">
                      <Clock className="w-6 h-6 text-[#9A7B2A]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#241512] mb-1">Service Timings</h3>
                      <p className="text-sm text-[#5C4540] leading-relaxed">
                        Monday – Sunday: <strong className="text-[#241512]">11:00 AM – 11:00 PM</strong>
                      </p>
                      <p className="text-xs text-emerald-700 font-semibold mt-1">
                        Open All 7 Days • Dine-In, Takeaway & Banquet
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Telephone Lines */}
                <div className="p-6 rounded-2xl bg-white border border-[#DDD0C8] shadow-xs mt-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#241512] mb-1">Direct Calling & Reservations</h3>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <a
                          href="tel:+919415268463"
                          className="text-sm font-bold text-[#7B1D1D] hover:underline flex items-center gap-1.5"
                        >
                          <span>+91 94152 68463</span>
                          <span className="text-xs font-normal text-[#5C4540]">(Primary Manager)</span>
                        </a>
                        <a
                          href="tel:+919125669366"
                          className="text-sm font-bold text-[#7B1D1D] hover:underline flex items-center gap-1.5"
                        >
                          <span>+91 91256 69366</span>
                          <span className="text-xs font-normal text-[#5C4540]">(Banquet Inquiries)</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Interactive Map Embed Column */}
            <div className="lg:col-span-7">
              <ScrollReveal variant="fade-left">
                <div className="h-full min-h-[380px] lg:min-h-[460px] rounded-2xl overflow-hidden border-2 border-[#DDD0C8] shadow-lg flex flex-col bg-white">
                  <div className="bg-[#7B1D1D] text-white px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#E0C278]" />
                      <span className="text-xs sm:text-sm font-bold">Google Maps — Akhari Bypass, Varanasi</span>
                    </div>
                    <a
                      href="https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#E0C278] hover:text-white font-semibold inline-flex items-center gap-1"
                    >
                      Open in App
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Google Maps iFrame */}
                  <div className="relative flex-1 w-full min-h-[340px]">
                    <iframe
                      title="Shree Kripa Family Restaurant and Banquet Location Map"
                      src="https://maps.google.com/maps?q=25.249383,82.9521527&hl=en&z=15&output=embed"
                      width="100%"
                      height="100%"
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <div className="p-4 bg-[#FFF8F0] border-t border-[#DDD0C8] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-[#5C4540] text-center sm:text-left">
                      Coordinates: 25.249383, 82.952153 • Near Akhari Bypass flyover
                    </span>
                    <Button
                      asChild
                      size="sm"
                      variant="accent"
                      className="font-bold text-xs shrink-0"
                    >
                      <a
                        href="https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Navigate with Google Maps
                      </a>
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
