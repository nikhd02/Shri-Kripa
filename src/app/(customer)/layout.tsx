/**
 * src/app/(customer)/layout.tsx
 * Layout for all customer-facing pages. Wraps with Header and Footer.
 */

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main
        id="main-content"
        // Offset for fixed header (h-16 md:h-20)
        className="pt-16 md:pt-20 min-h-screen"
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
