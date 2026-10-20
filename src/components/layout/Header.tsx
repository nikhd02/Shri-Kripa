'use client';
/**
 * src/components/layout/Header.tsx
 * Public-facing luxury site header with refined typography and navigation.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/book-table', label: 'Book a Table' },
  { href: '/banquet', label: 'Banquet & Events' },
  { href: '/contact', label: 'Location & Contact' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        scrolled
          ? 'bg-[#1A0404]/96 backdrop-blur-md border-[#C9A84C]/35 shadow-xl py-2.5'
          : 'bg-[#240606]/92 backdrop-blur-md border-[#C9A84C]/25 shadow-md py-3.5'
      )}
      role="banner"
    >
      <div className="container-restaurant">
        <nav
          className="flex items-center justify-between"
          aria-label="Main navigation"
        >
          {/* Brand Logo & Title */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-hidden"
            aria-label="Shree Kripa Family Restaurant & Banquet — Home"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#9A7B2A] via-[#C9A84C] to-[#E0C278] text-[#241512] shadow-sm ring-1 ring-[#C9A84C]/50 group-hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed className="w-5 h-5 text-[#241512]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span
                className="font-extrabold text-white text-lg sm:text-xl tracking-tight group-hover:text-[#E0C278] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Shree Kripa
              </span>
              <span className="text-[#E0C278] text-[10px] sm:text-[11px] tracking-wider font-semibold uppercase">
                Family Restaurant & Banquet
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <ul className="hidden md:flex items-center gap-6 lg:gap-8" role="list">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'text-sm tracking-wide transition-all duration-200 relative py-1',
                      isActive
                        ? 'text-[#E0C278] font-bold after:content-[""] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-[#C9A84C] after:rounded-full'
                        : 'text-[#FFF8F0]/85 hover:text-[#E0C278] font-medium'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop Right CTAs */}
          <div className="hidden md:flex items-center gap-5">
            <a
              href="tel:+919415268463"
              className="flex items-center gap-2 text-xs lg:text-sm font-semibold text-[#E0C278] hover:text-white transition-colors"
              aria-label="Call restaurant helpline: +91 94152 68463"
            >
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <Phone className="w-3.5 h-3.5 text-[#E0C278]" />
              </div>
              <span className="tracking-wide">+91 94152 68463</span>
            </a>

            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-[#C9A84C] to-[#E0C278] hover:from-[#B8963B] hover:to-[#D4B565] text-[#241512] font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              <Link href="/menu">Order Online</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-white bg-white/10 hover:bg-white/15 border border-[#C9A84C]/30 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="w-6 h-6 text-[#E0C278]" /> : <Menu className="w-6 h-6 text-[#E0C278]" />}
          </button>
        </nav>

        {/* Mobile menu drawer */}
        <div
          id="mobile-menu"
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300',
            mobileOpen ? 'max-h-[380px] pb-4 pt-3' : 'max-h-0'
          )}
          aria-hidden={!mobileOpen}
        >
          <div className="bg-[#1A0404]/98 backdrop-blur-xl rounded-2xl p-4 border border-[#C9A84C]/30 shadow-2xl">
            <ul className="flex flex-col gap-1" role="list">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'block px-4 py-2.5 rounded-xl text-sm transition-colors',
                        isActive
                          ? 'bg-[#C9A84C]/20 text-[#E0C278] font-bold border-l-3 border-[#C9A84C]'
                          : 'text-white/85 hover:bg-white/10 hover:text-[#E0C278] font-medium'
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2.5">
                <a
                  href="tel:+919415268463"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-[#E0C278] hover:text-white"
                >
                  <Phone className="w-4 h-4 text-[#C9A84C]" />
                  Call: +91 94152 68463
                </a>
                <Button
                  asChild
                  size="md"
                  className="w-full bg-gradient-to-r from-[#C9A84C] to-[#E0C278] text-[#241512] font-bold rounded-xl"
                >
                  <Link href="/menu" onClick={() => setMobileOpen(false)}>
                    View Menu & Order
                  </Link>
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
