/**
 * src/components/admin/Sidebar.tsx
 * Admin sidebar navigation.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  TableProperties,
  Users,
  BarChart3,
  Settings,
  ChefHat,
  CalendarDays,
  Calendar,
  FolderTree,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/server/actions/auth';
import type { Role } from '@prisma/client';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'STAFF'] as Role[] },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag, roles: ['ADMIN', 'MANAGER', 'STAFF', 'KITCHEN'] as Role[] },
  { href: '/kitchen', label: 'Kitchen Display', icon: ChefHat, roles: ['ADMIN', 'MANAGER', 'KITCHEN'] as Role[] },
  { href: '/dashboard/menu', label: 'Menu Items', icon: UtensilsCrossed, roles: ['ADMIN', 'MANAGER'] as Role[] },
  { href: '/dashboard/categories', label: 'Categories', icon: FolderTree, roles: ['ADMIN', 'MANAGER'] as Role[] },
  { href: '/dashboard/tables', label: 'Tables & QR', icon: TableProperties, roles: ['ADMIN', 'MANAGER'] as Role[] },
  { href: '/dashboard/bookings', label: 'Table Bookings', icon: CalendarDays, roles: ['ADMIN', 'MANAGER', 'STAFF'] as Role[] },
  { href: '/dashboard/banquet', label: 'Banquet Enquiries', icon: Calendar, roles: ['ADMIN', 'MANAGER', 'STAFF'] as Role[] },
  { href: '/dashboard/staff', label: 'Staff', icon: Users, roles: ['ADMIN'] as Role[] },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] as Role[] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] as Role[] },
];

interface SidebarProps {
  userRole: Role;
  userName: string;
  userEmail: string;
}

interface NavContentProps {
  visibleItems: typeof NAV_ITEMS;
  pathname: string;
  userName: string;
  userEmail: string;
  userRole: Role;
  onItemClick?: () => void;
}

function NavContent({
  visibleItems,
  pathname,
  userName,
  userEmail,
  userRole,
  onItemClick,
}: NavContentProps) {
  return (
    <div className="flex flex-col h-full bg-[#5A1515] text-[#FFF8F0]">
      {/* Logo Header */}
      <div className="p-5 border-b border-[#FFF8F0]/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C9A84C] flex items-center justify-center shadow-xs flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-[#5A1515]" />
          </div>
          <div className="min-w-0">
            <p className="text-[#FFF8F0] font-bold text-base tracking-wide truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              Shree Kripa
            </p>
            <p className="text-[#E0C278] text-[11px] font-semibold uppercase tracking-wider">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3.5 overflow-y-auto" aria-label="Admin navigation">
        <ul className="space-y-1.5" role="list">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-[#C9A84C] text-[#241512] shadow-sm'
                      : 'text-[#FFF8F0] hover:bg-white/12 hover:text-white'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 flex-shrink-0 transition-colors',
                      isActive ? 'text-[#241512]' : 'text-[#FFF8F0] group-hover:text-white'
                    )}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-[#FFF8F0]/15 bg-[#4A1010]">
        <div className="mb-3 px-2">
          <p className="text-[#FFF8F0] text-sm font-bold truncate">{userName}</p>
          <p className="text-[#FFF8F0]/85 text-xs font-medium truncate mt-0.5">{userEmail}</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-[#C9A84C]/25 text-[#E0C278] border border-[#C9A84C]/50 text-xs font-bold uppercase tracking-wider">
            {userRole}
          </span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#FFF8F0] hover:bg-red-500/25 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#FFF8F0]" aria-hidden="true" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#5A1515] border-r border-[#FFF8F0]/10 flex-shrink-0 min-h-screen">
        <NavContent
          visibleItems={visibleItems}
          pathname={pathname}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
        />
      </aside>

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-[#5A1515] text-[#FFF8F0] border border-[#C9A84C]/40 shadow-lg hover:bg-[#7B1D1D] transition-colors cursor-pointer"
          aria-label="Open admin menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Drawer */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-50 h-full w-64 bg-[#5A1515] border-r border-[#FFF8F0]/15 transform transition-transform duration-300 shadow-2xl',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          aria-label="Admin navigation"
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#FFF8F0]/80 hover:text-white hover:bg-white/10"
            aria-label="Close admin menu"
          >
            <X className="w-5 h-5" />
          </button>
          <NavContent
            visibleItems={visibleItems}
            pathname={pathname}
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
            onItemClick={() => setMobileOpen(false)}
          />
        </aside>
      </div>
    </>
  );
}
