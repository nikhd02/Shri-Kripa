/**
 * src/app/layout.tsx
 * Root layout for the entire application.
 */

import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'Shree Kripa Family Restaurant & Banquet | Varanasi',
    template: '%s | Shree Kripa Restaurant',
  },
  description:
    'Pure vegetarian family restaurant and banquet hall in Varanasi. Enjoy authentic Indian cuisine, thalis, Chinese, and more. Book your banquet event today.',
  keywords: [
    'Shree Kripa Restaurant',
    'vegetarian restaurant Varanasi',
    'family restaurant Varanasi',
    'banquet hall Varanasi',
    'Indian food Varanasi',
    'pure veg restaurant',
    'Akhari Bypass Varanasi',
  ],
  authors: [{ name: 'Shree Kripa Family Restaurant & Banquet' }],
  creator: 'Shree Kripa Restaurant',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Shree Kripa Family Restaurant & Banquet',
    title: 'Shree Kripa Family Restaurant & Banquet | Varanasi',
    description:
      'Pure vegetarian family restaurant and banquet hall in Varanasi. Authentic Indian cuisine.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7B1D1D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
