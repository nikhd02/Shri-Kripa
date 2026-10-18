/**
 * src/app/(admin)/dashboard/reports/page.tsx
 * Admin Reports & Analytics Page — accessible to ADMIN and MANAGER roles.
 */

import React from 'react';
import type { Metadata } from 'next';
import { Role } from '@prisma/client';
import { requireAuth } from '@/lib/session';
import { getReportsData, type ReportFilter } from '@/server/queries/reports';
import { ReportsClient } from './ReportsClient';

export const metadata: Metadata = {
  title: 'Reports & Analytics | Shree Kripa Admin',
  description: 'Business intelligence, revenue trends, top-selling items, and banquet metrics.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  await requireAuth([Role.ADMIN, Role.MANAGER]);

  const params = await searchParams;
  const rawRange = params.range;
  const validRanges = ['today', '7d', '30d', 'custom'] as const;
  const range = validRanges.includes(rawRange as any) ? (rawRange as any) : '7d';

  const filter: ReportFilter = {
    range,
    from: params.from,
    to: params.to,
  };

  const reportsData = await getReportsData(filter);

  return (
    <div className="space-y-6">
      <ReportsClient data={reportsData} />
    </div>
  );
}
