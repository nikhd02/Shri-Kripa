/**
 * src/app/(customer)/page.tsx
 * Home page — Hero, About, Features, CTA, Contact & Map.
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Phone,
  MapPin,
  UtensilsCrossed,
  Star,
  Users,
  Calendar,
  ChevronRight,
  Leaf,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Shree Kripa Family Restaurant & Banquet | Varanasi',
  description:
    'Pure vegetarian family restaurant and banquet in Varanasi. Authentic Indian food, thali, Chinese, pizza and more. Located on Akhari Bypass.',
};

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------
function HeroSection() {
  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden bg-[var(--color-primary)]"
      aria-labelledby="hero-heading"
    >
      {/* Decorative background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-dark)] via-transparent to-[var(--color-primary-dark)]/60"
        aria-hidden="true"
      />

      <div className="container-restaurant relative z-10 py-20 text-center md:text-left">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-black/30 border border-[var(--color-accent-light)]/50 text-[var(--color-accent-light)] font-bold shadow-xs">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-[var(--color-accent-light)]">
              100% Pure Vegetarian
            </span>
          </div>

          {/* Heading */}
          <h1
            id="hero-heading"
            className="text-white text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-2 drop-shadow-sm"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Shree Kripa
          </h1>
          <p
            className="text-[var(--color-accent-light)] text-xl md:text-2xl font-bold mb-2 tracking-wide"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Family Restaurant & Banquet
          </p>
          <p className="text-[var(--color-accent-light)]/90 text-lg mb-8 font-medium" lang="hi">
            श्री कृपा फैमिली रेस्टोरेंट एंड बैंक्वेट
          </p>

          <p className="text-white/95 text-lg leading-relaxed mb-10 max-w-xl font-medium">
            Authentic vegetarian cuisine crafted with love. From wholesome thalis
            to festive banquets — we bring families together over great food.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button asChild size="lg" variant="accent">
              <Link href="/menu">
                <UtensilsCrossed className="w-5 h-5" />
                Explore Menu
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/60 text-white hover:bg-white/20 hover:text-white font-semibold"
            >
              <Link href="/banquet">
                <Calendar className="w-5 h-5" />
                Book Banquet
              </Link>
            </Button>
          </div>

          {/* Quick contact */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center md:justify-start">
            <a
              href="tel:+919415268463"
              className="flex items-center gap-2 text-white/90 hover:text-[var(--color-accent-light)] transition-colors text-sm font-medium"
            >
              <Phone className="w-4 h-4 text-[var(--color-accent-light)]" />
              +91 94152 68463
            </a>
            <span className="text-white/40 hidden sm:block">|</span>
            <a
              href="tel:+919125669366"
              className="flex items-center gap-2 text-white/90 hover:text-[var(--color-accent-light)] transition-colors text-sm font-medium"
            >
              <Phone className="w-4 h-4 text-[var(--color-accent-light)]" />
              +91 91256 69366
            </a>
          </div>
        </div>
      </div>

      {/* Gold bottom wave */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 80L60 66.7C120 53.3 240 26.7 360 20C480 13.3 600 26.7 720 33.3C840 40 960 40 1080 36.7C1200 33.3 1320 26.7 1380 23.3L1440 20V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z"
            fill="var(--color-background)"
          />
        </svg>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Features / Why us section
// ---------------------------------------------------------------------------
const FEATURES = [
  {
    icon: Leaf,
    title: 'Pure Vegetarian',
    description: 'Strictly vegetarian kitchen — no meat, no eggs, ever.',
    color: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success-bg)]',
  },
  {
    icon: Star,
    title: 'Authentic Flavors',
    description: 'Traditional Indian recipes made with fresh, quality ingredients.',
    color: 'text-[var(--color-accent)]',
    bg: 'bg-[var(--color-accent)]/10',
  },
  {
    icon: Users,
    title: 'Family Friendly',
    description: 'Welcoming atmosphere perfect for families of all sizes.',
    color: 'text-[var(--color-info)]',
    bg: 'bg-[var(--color-info-bg)]',
  },
  {
    icon: Calendar,
    title: 'Banquet Hall',
    description: 'Host weddings, corporate events and celebrations with us.',
    color: 'text-[var(--color-primary)]',
    bg: 'bg-[var(--color-primary)]/10',
  },
];

function FeaturesSection() {
  return (
    <section
      className="section-padding bg-[var(--color-background)]"
      aria-labelledby="features-heading"
    >
      <div className="container-restaurant">
        <div className="text-center mb-12">
          <p className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-widest mb-3">
            Why Choose Us
          </p>
          <h2
            id="features-heading"
            className="text-[var(--color-text-primary)] mb-4"
          >
            More Than Just a Meal
          </h2>
          <hr className="gold-divider max-w-24 mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`inline-flex p-3 rounded-xl mb-4 ${feature.bg}`}
                >
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Menu CTA section
// ---------------------------------------------------------------------------
function MenuCTASection() {
  return (
    <section
      className="section-padding bg-[var(--color-muted)]"
      aria-labelledby="menu-cta-heading"
    >
      <div className="container-restaurant">
        <div className="rounded-2xl bg-[var(--color-primary)] p-8 md:p-12 text-center relative overflow-hidden">
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-5"
            aria-hidden="true"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, var(--color-accent) 0%, transparent 60%), radial-gradient(circle at 80% 50%, var(--color-accent) 0%, transparent 60%)`,
            }}
          />
          <div className="relative z-10">
            <p className="text-[var(--color-accent-light)] text-sm font-bold uppercase tracking-widest mb-3">
              Digital Menu
            </p>
            <h2
              id="menu-cta-heading"
              className="text-white text-3xl sm:text-4xl font-extrabold mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Explore Our Full Menu
            </h2>
            <p className="text-white/95 max-w-lg mx-auto mb-8 font-medium">
              Soups, starters, main course, thalis, dosa, Chinese, pizzas, desserts and more —
              all freshly prepared in our pure vegetarian kitchen.
            </p>
            <Button asChild size="xl" variant="accent">
              <Link href="/menu" className="inline-flex items-center gap-2">
                View Full Menu
                <ChevronRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Contact & Map section
// ---------------------------------------------------------------------------
function ContactSection() {
  return (
    <section
      className="section-padding bg-[var(--color-background)]"
      aria-labelledby="contact-heading"
    >
      <div className="container-restaurant">
        <div className="text-center mb-12">
          <p className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-widest mb-3">
            Find Us
          </p>
          <h2
            id="contact-heading"
            className="text-[var(--color-text-primary)] mb-4"
          >
            Location & Contact
          </h2>
          <hr className="gold-divider max-w-24 mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Contact info */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-[var(--color-primary)]/10">
                  <MapPin className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                    Address
                  </h3>
                  <address className="not-italic text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    Akhari Bypass,<br />
                    Varanasi, Uttar Pradesh,<br />
                    India
                  </address>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-[var(--color-primary)]/10">
                  <Phone className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                    Phone Numbers
                  </h3>
                  <div className="flex flex-col gap-1">
                    <a
                      href="tel:+919415268463"
                      className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors text-sm font-medium"
                    >
                      +91 94152 68463
                    </a>
                    <a
                      href="tel:+919125669366"
                      className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors text-sm font-medium"
                    >
                      +91 91256 69366
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30">
              <p className="text-sm text-[var(--color-text-secondary)]">
                📞 Call us to make a reservation or enquire about our banquet services.
              </p>
            </div>
          </div>

          {/* Map embed placeholder */}
          <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-md)]">
            <div
              className="w-full h-80 bg-[var(--color-muted)] flex items-center justify-center"
              aria-label="Map showing restaurant location at Akhari Bypass, Varanasi"
            >
              {/* Google Maps iframe will be added once exact coordinates are confirmed */}
              <div className="text-center p-8">
                <MapPin className="w-12 h-12 text-[var(--color-primary)]/30 mx-auto mb-4" />
                <p className="text-[var(--color-text-muted)] text-sm">
                  Shree Kripa Family Restaurant
                </p>
                <p className="text-[var(--color-text-muted)] text-sm">
                  Akhari Bypass, Varanasi
                </p>
                <a
                  href="https://maps.google.com/?q=Akhari+Bypass+Varanasi+Uttar+Pradesh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors"
                >
                  Open in Google Maps
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Banquet CTA section
// ---------------------------------------------------------------------------
function BanquetCTASection() {
  return (
    <section
      className="section-padding bg-[var(--color-muted)]"
      aria-labelledby="banquet-cta-heading"
    >
      <div className="container-restaurant">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-widest mb-3">
              Banquet & Events
            </p>
            <h2
              id="banquet-cta-heading"
              className="text-[var(--color-text-primary)] mb-4"
            >
              Host Your Special Event
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
              From intimate family gatherings to grand celebrations — our banquet
              hall is the perfect venue. We offer customized menus, professional
              service, and a warm, elegant setting.
            </p>
            <ul className="space-y-2 mb-8">
              {['Weddings & Receptions', 'Birthday Celebrations', 'Corporate Events', 'Puja & Religious Ceremonies'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="default">
              <Link href="/banquet">
                <Calendar className="w-5 h-5" />
                Send Enquiry
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl p-8 bg-[var(--color-primary)] text-center shadow-lg border border-[var(--color-accent)]/30">
            <div className="text-[var(--color-accent-light)] text-5xl mb-4" aria-hidden="true">🎉</div>
            <h3 className="text-white text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Book Your Date
            </h3>
            <p className="text-white/90 text-sm mb-6 font-medium">
              Contact us to check availability and get a customized quote for your event.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="tel:+919415268463"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-semibold border border-white/20"
              >
                <Phone className="w-4 h-4 text-[var(--color-accent-light)]" />
                +91 94152 68463
              </a>
              <a
                href="tel:+919125669366"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-semibold border border-white/20"
              >
                <Phone className="w-4 h-4 text-[var(--color-accent-light)]" />
                +91 91256 69366
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <MenuCTASection />
      <BanquetCTASection />
      <ContactSection />
    </>
  );
}
