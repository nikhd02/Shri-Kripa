/**
 * src/components/layout/Footer.tsx
 * Site footer with restaurant info and links.
 */

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, UtensilsCrossed } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-[var(--color-primary-dark)] text-[var(--color-primary-foreground)]"
      role="contentinfo"
    >
      {/* Gold divider */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent" />

      <div className="container-restaurant py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40">
                <UtensilsCrossed className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="font-bold text-white text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                  Shree Kripa
                </p>
                <p className="text-[var(--color-accent-light)] text-xs tracking-wider font-semibold">
                  Family Restaurant & Banquet
                </p>
              </div>
            </div>
            <p className="text-white/85 text-sm leading-relaxed max-w-sm mb-4">
              A beloved pure vegetarian family restaurant in Varanasi, serving
              authentic Indian cuisine with warmth and hospitality since our founding.
              Perfect for families, celebrations, and corporate events.
            </p>
            <p className="text-[var(--color-accent-light)] text-sm font-semibold" lang="hi">
              श्री कृपा फैमिली रेस्टोरेंट एंड बैंक्वेट
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3
              className="text-[var(--color-accent-light)] font-bold text-sm uppercase tracking-wider mb-4"
            >
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2.5" role="list">
              {[
                { href: '/', label: 'Home' },
                { href: '/menu', label: 'Our Menu' },
                { href: '/banquet', label: 'Banquet Booking' },
                { href: '/contact', label: 'Contact Us' },
                { href: '/login', label: 'Staff Login' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-white/85 hover:text-[var(--color-accent-light)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="text-[var(--color-accent-light)] font-bold text-sm uppercase tracking-wider mb-4"
            >
              Contact Us
            </h3>
            <ul className="flex flex-col gap-3" role="list">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--color-accent-light)] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/85">
                  Akhari Bypass, Varanasi,<br />
                  Uttar Pradesh, India
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[var(--color-accent-light)] flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <a
                    href="tel:+919415268463"
                    className="text-sm font-medium text-white/90 hover:text-[var(--color-accent-light)] transition-colors"
                  >
                    +91 94152 68463
                  </a>
                  <a
                    href="tel:+919125669366"
                    className="text-sm font-medium text-white/90 hover:text-[var(--color-accent-light)] transition-colors"
                  >
                    +91 91256 69366
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[var(--color-accent-light)] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/85">
                  Open daily<br />
                  <span className="text-white/60 text-xs">
                    (Hours set by admin)
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/70 font-medium">
            © {currentYear} Shree Kripa Family Restaurant & Banquet. All rights reserved.
          </p>
          <p className="text-xs text-white/60 font-medium">
            Pure Vegetarian · Varanasi
          </p>
        </div>
      </div>
    </footer>
  );
}
