/**
 * src/components/layout/Footer.tsx
 * Site footer with verified restaurant location, Google Maps directions, and links.
 */

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, UtensilsCrossed, ExternalLink, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-[#3D0A0A] text-[#FFF8F0] relative overflow-hidden"
      role="contentinfo"
    >
      {/* Decorative top gold border */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

      <div className="container-restaurant py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand & Identity */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#E0C278] to-[#C9A84C] text-[#241512] shadow-sm">
                <UtensilsCrossed className="w-5 h-5 text-[#3D0A0A]" />
              </div>
              <div>
                <p className="font-extrabold text-white text-xl tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  Shree Kripa
                </p>
                <p className="text-[#E0C278] text-[11px] tracking-wider uppercase font-semibold">
                  Family Restaurant & Banquet
                </p>
              </div>
            </div>

            <p className="text-[#FFF8F0]/85 text-sm leading-relaxed">
              Varanasi’s cherished destination for pure vegetarian North Indian culinary craft, joyful family dining, and royal banquet festivities.
            </p>

            <p className="text-[#E0C278] text-sm font-semibold tracking-wide" lang="hi">
              श्री कृपा फैमिली रेस्टोरेंट एंड बैंक्वेट
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                100% Pure Vegetarian Kitchen
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-[#E0C278] font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C9A84C]" />
              Explore
            </h3>
            <ul className="flex flex-col gap-2.5" role="list">
              {[
                { href: '/', label: 'Home Experience' },
                { href: '/menu', label: 'Culinary Menu & Ordering' },
                { href: '/banquet', label: 'Banquet & Celebrations' },
                { href: '/contact', label: 'Location & Map' },
                { href: '/login', label: 'Staff & Admin Portal' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-[#FFF8F0]/80 hover:text-[#E0C278] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span className="text-[#C9A84C]/60 text-xs">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Location & Directions */}
          <div>
            <h3 className="text-[#E0C278] font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C9A84C]" />
              Visit Us
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-[#FFF8F0]/85 leading-relaxed">
                Akhari Bypass, Varanasi,<br />
                Uttar Pradesh 221011, India
              </p>

              <div className="pt-1">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-[#C9A84C] text-[#E0C278] hover:bg-[#C9A84C] hover:text-[#241512] transition-colors text-xs font-bold"
                >
                  <a
                    href="https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <span>Get Directions</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </div>

              <p className="text-xs text-[#FFF8F0]/60 pt-1">
                Convenient parking available on-site for restaurant & banquet guests.
              </p>
            </div>
          </div>

          {/* Contact & Hours */}
          <div>
            <h3 className="text-[#E0C278] font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#C9A84C]" />
              Reservations & Inquiries
            </h3>
            <ul className="flex flex-col gap-3" role="list">
              <li>
                <span className="text-xs text-[#FFF8F0]/60 block mb-0.5">Dining & Banquet Helpline:</span>
                <a
                  href="tel:+919415268463"
                  className="text-sm font-bold text-[#FFF8F0] hover:text-[#E0C278] transition-colors block"
                >
                  +91 94152 68463
                </a>
                <a
                  href="tel:+919125669366"
                  className="text-sm font-bold text-[#FFF8F0] hover:text-[#E0C278] transition-colors block"
                >
                  +91 91256 69366
                </a>
              </li>

              <li className="flex items-start gap-2.5 pt-1">
                <Clock className="w-4 h-4 text-[#C9A84C] mt-0.5 shrink-0" />
                <span className="text-xs text-[#FFF8F0]/85 leading-normal">
                  <strong className="text-white">Daily Timings:</strong><br />
                  11:00 AM – 11:00 PM<br />
                  <span className="text-[#E0C278]/80 text-[11px]">Open 7 Days a Week</span>
                </span>
              </li>

              <li className="pt-2">
                <Button asChild size="sm" variant="accent" className="w-full font-bold text-xs">
                  <Link href="/banquet" className="inline-flex items-center justify-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Book Banquet Event
                  </Link>
                </Button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#FFF8F0]/65">
          <p>© {currentYear} Shree Kripa Family Restaurant & Banquet. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Akhari Bypass, Varanasi</span>
            <span>•</span>
            <span className="text-[#E0C278]">Pure Vegetarian Excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
