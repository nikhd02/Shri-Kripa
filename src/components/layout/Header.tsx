'use client';
/**
 * src/components/layout/Header.tsx
 * Public-facing site header with navigation.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Phone, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/banquet', label: 'Banquet' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[var(--color-primary)] shadow-[var(--shadow-lg)]'
          : 'bg-[var(--color-primary)]/95 backdrop-blur-sm'
      )}
      role="banner"
    >
      <div className="container-restaurant">
        <nav
          className="flex items-center justify-between h-16 md:h-20"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="Shree Kripa Family Restaurant — Home"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 group-hover:bg-[var(--color-accent)]/30 transition-colors">
              <UtensilsCrossed className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span
                className="font-bold text-white text-base md:text-lg"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Shree Kripa
              </span>
              <span className="text-[var(--color-accent-light)] text-xs hidden sm:block tracking-wider font-medium">
                Family Restaurant & Banquet
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="px-4 py-2 rounded-md text-sm font-semibold text-white/95 hover:text-[var(--color-accent-light)] hover:bg-white/10 transition-all duration-150"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="tel:+919415268463"
              className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent-light)] hover:text-white transition-colors"
              aria-label="Call us: 9415268463"
            >
              <Phone className="w-4 h-4 text-[var(--color-accent-light)]" />
              <span>9415268463</span>
            </a>
            <Button
              asChild
              size="sm"
              variant="accent"
            >
              <Link href="/menu">Order Now</Link>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300',
            mobileOpen ? 'max-h-96 pb-4' : 'max-h-0'
          )}
          aria-hidden={!mobileOpen}
        >
          <ul className="flex flex-col gap-1 pt-2 border-t border-white/10" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block px-4 py-3 rounded-md text-sm font-semibold text-white hover:bg-white/10 hover:text-[var(--color-accent-light)] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 pt-3 border-t border-white/10 flex flex-col gap-2">
              <a
                href="tel:+919415268463"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--color-accent-light)] hover:text-white"
              >
                <Phone className="w-4 h-4" />
                9415268463
              </a>
              <div className="px-4">
                <Button asChild size="md" variant="accent" className="w-full">
                  <Link href="/menu" onClick={() => setMobileOpen(false)}>
                    Order Now
                  </Link>
                </Button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
