/**
 * src/app/(admin)/layout.tsx
 * Admin layout — requires authentication, shows sidebar.
 */

import { requireAuth } from '@/lib/session';
import { Sidebar } from '@/components/admin/Sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireAuth() redirects to /login if not authenticated
  const user = await requireAuth();

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <Sidebar
        userRole={user.role}
        userName={user.name}
        userEmail={user.email}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar on mobile (sidebar toggle is rendered by Sidebar itself) */}
        <div className="lg:hidden h-16 bg-[#5A1515] border-b border-[#FFF8F0]/15 flex items-center justify-center px-16">
          <span
            className="font-bold text-[#FFF8F0] text-sm tracking-wide"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Shree Kripa Admin
          </span>
        </div>
        <main
          id="admin-main"
          className="flex-1 p-4 md:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
