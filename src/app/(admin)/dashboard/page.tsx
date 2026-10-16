/**
 * src/app/(admin)/dashboard/page.tsx
 * Admin dashboard home — live operational metrics and quick-access panels.
 */

import React from 'react';
import type { Metadata } from 'next';
import { requireAuth } from '@/lib/session';
import { db } from '@/lib/db';
import {
  ShoppingBag,
  UtensilsCrossed,
  TableProperties,
  Calendar,
  Clock,
  ChefHat,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard | Admin | Shree Kripa',
  description: 'Shree Kripa Restaurant Admin Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  badge,
  href,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  badge?: { label: string; variant: 'success' | 'warning' | 'error' | 'secondary' };
  href: string;
}) {
  return (
    <Link href={href} className="block group">
      <Card className="h-full hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
              <Icon className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            {badge && (
              <Badge variant={badge.variant}>{badge.label}</Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {value}
          </p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{title}</p>
          <p className="text-xs font-medium text-[var(--color-text-muted)]">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireAuth();

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate start of today in local date
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Live metrics queries
  const [todayOrdersCount, activeTablesCount, publishedItemsCount, pendingEnquiriesCount, activeOrdersCount] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: startOfToday } } }),
    db.restaurantTable.count({ where: { isActive: true } }),
    db.menuItem.count({ where: { isPublished: true } }),
    db.banquetEnquiry.count({ where: { status: 'NEW' } }),
    db.order.count({ where: { status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] } } }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {timeStr} · {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-xs">System Online</Badge>
          {activeOrdersCount > 0 && (
            <Badge variant="warning" className="text-xs">
              {activeOrdersCount} Active Order{activeOrdersCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats grid — Live operational data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Today's Orders"
          value={todayOrdersCount.toString()}
          description={`${activeOrdersCount} currently in progress`}
          icon={ShoppingBag}
          href="/dashboard/orders"
          badge={activeOrdersCount > 0 ? { label: `${activeOrdersCount} Live`, variant: 'warning' } : undefined}
        />
        <StatCard
          title="Published Dishes"
          value={publishedItemsCount.toString()}
          description="Available on public digital menu"
          icon={UtensilsCrossed}
          href="/dashboard/menu"
          badge={{ label: 'Live Menu', variant: 'success' }}
        />
        <StatCard
          title="Active Dining Tables"
          value={activeTablesCount.toString()}
          description="Ready for QR ordering"
          icon={TableProperties}
          href="/dashboard/tables"
          badge={{ label: 'Tables Active', variant: 'success' }}
        />
        <StatCard
          title="Banquet Enquiries"
          value={pendingEnquiriesCount.toString()}
          description="Awaiting staff contact"
          icon={Calendar}
          href="/dashboard/banquet"
          badge={pendingEnquiriesCount > 0 ? { label: `${pendingEnquiriesCount} New`, variant: 'warning' } : undefined}
        />
      </div>

      {/* Quick operational actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[var(--color-primary)]" />
              Live Orders & Payments
            </CardTitle>
            <CardDescription>
              Review incoming QR table orders, manage statuses, and record cash/UPI payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex gap-2 flex-wrap">
            <Button asChild size="sm" variant="default">
              <Link href="/dashboard/orders">View Orders</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/kitchen">Kitchen KDS</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TableProperties className="w-4 h-4 text-[var(--color-primary)]" />
              Dining Tables & QR Tent Cards
            </CardTitle>
            <CardDescription>
              Generate secure QR tokens and print branded dining table tent cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex gap-2 flex-wrap">
            <Button asChild size="sm" variant="default">
              <Link href="/dashboard/tables">Manage Tables & QR</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-[var(--color-primary)]" />
              Menu & Category Management
            </CardTitle>
            <CardDescription>
              Organize categories, create dishes with portions & add-ons, and toggle availability.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex gap-2 flex-wrap">
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/menu">Menu Items</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/categories">Categories</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[var(--color-primary)]" />
              Kitchen Display System (KDS)
            </CardTitle>
            <CardDescription>
              Dedicated full-screen high-contrast ticket display for kitchen preparation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild size="sm" variant="outline">
              <Link href="/kitchen">Open Kitchen Screen</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
