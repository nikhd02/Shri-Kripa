/**
 * src/server/queries/reports.ts
 * Analytics and reporting queries based on real database records.
 * Supports date filtering, accurate revenue aggregation, category breakdowns, and banquet stats.
 */

import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { Role } from '@prisma/client';

export interface ReportFilter {
  range: 'today' | '7d' | '30d' | 'custom';
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export interface BestSellingItem {
  name: string;
  quantity: number;
  revenue: number;
  categoryName: string;
}

export interface CategorySales {
  categoryName: string;
  itemCount: number;
  revenue: number;
  percentage: number;
}

export interface DailySales {
  date: string;
  displayDate: string;
  sales: number;
  orderCount: number;
}

export interface ReportsData {
  range: string;
  fromFormatted: string;
  toFormatted: string;
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    activeOrders: number;
    grossSales: number;
    subtotalSales: number;
    taxCollected: number;
    averageOrderValue: number;
    totalBanquetEnquiries: number;
  };
  dailySales: DailySales[];
  bestSellers: BestSellingItem[];
  categorySales: CategorySales[];
  orderStatusCounts: {
    COMPLETED: number;
    READY: number;
    PREPARING: number;
    ACCEPTED: number;
    PENDING: number;
    CANCELLED: number;
  };
  banquetStatusCounts: {
    NEW: number;
    CONTACTED: number;
    CONFIRMED: number;
    CLOSED: number;
  };
}

/**
 * Compute UTC date boundaries for Asia/Kolkata timezone
 */
function getDateBoundaries(filter: ReportFilter): { startDate: Date; endDate: Date } {
  const now = new Date();

  // Convert now to Asia/Kolkata local components
  const kolkataFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = kolkataFormatter.format(now); // "YYYY-MM-DD"

  let startDate: Date;
  let endDate: Date;

  if (filter.range === 'today') {
    startDate = new Date(`${todayStr}T00:00:00+05:30`);
    endDate = new Date(`${todayStr}T23:59:59.999+05:30`);
  } else if (filter.range === '7d') {
    const d = new Date(`${todayStr}T00:00:00+05:30`);
    d.setDate(d.getDate() - 6);
    startDate = d;
    endDate = new Date(`${todayStr}T23:59:59.999+05:30`);
  } else if (filter.range === '30d') {
    const d = new Date(`${todayStr}T00:00:00+05:30`);
    d.setDate(d.getDate() - 29);
    startDate = d;
    endDate = new Date(`${todayStr}T23:59:59.999+05:30`);
  } else if (filter.range === 'custom' && filter.from) {
    startDate = new Date(`${filter.from}T00:00:00+05:30`);
    const toStr = filter.to || filter.from;
    endDate = new Date(`${toStr}T23:59:59.999+05:30`);
  } else {
    // Default fallback to 7 days
    const d = new Date(`${todayStr}T00:00:00+05:30`);
    d.setDate(d.getDate() - 6);
    startDate = d;
    endDate = new Date(`${todayStr}T23:59:59.999+05:30`);
  }

  return { startDate, endDate };
}

export async function getReportsData(filter: ReportFilter): Promise<ReportsData> {
  // 1. Authorize: ADMIN or MANAGER
  await requireAuth([Role.ADMIN, Role.MANAGER]);

  const { startDate, endDate } = getDateBoundaries(filter);

  // 2. Fetch orders within the date boundary
  const orders = await db.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      orderItems: {
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      },
      paymentRecords: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // 3. Fetch banquet enquiries in the same date boundary
  const banquetEnquiries = await db.banquetEnquiry.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // 4. Summaries & Status Counts
  const orderStatusCounts = {
    COMPLETED: 0,
    READY: 0,
    PREPARING: 0,
    ACCEPTED: 0,
    PENDING: 0,
    CANCELLED: 0,
  };

  for (const o of orders) {
    if (o.status in orderStatusCounts) {
      orderStatusCounts[o.status as keyof typeof orderStatusCounts]++;
    }
  }

  const banquetStatusCounts = {
    NEW: 0,
    CONTACTED: 0,
    CONFIRMED: 0,
    CLOSED: 0,
  };

  for (const b of banquetEnquiries) {
    if (b.status in banquetStatusCounts) {
      banquetStatusCounts[b.status as keyof typeof banquetStatusCounts]++;
    }
  }

  // Only COMPLETED orders contribute to real sales (cancelled or pending are not recognized revenue)
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

  const grossSales = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const subtotalSales = completedOrders.reduce((sum, o) => sum + Number(o.subtotal), 0);
  const taxCollected = completedOrders.reduce((sum, o) => sum + Number(o.taxAmount), 0);
  const averageOrderValue = completedOrders.length > 0 ? grossSales / completedOrders.length : 0;

  // 5. Best-selling dishes
  const itemMap = new Map<string, { quantity: number; revenue: number; categoryName: string }>();

  for (const order of completedOrders) {
    for (const item of order.orderItems) {
      const name = item.menuItemName;
      const catName = item.menuItem?.category?.name || 'Uncategorized';
      const existing = itemMap.get(name) || { quantity: 0, revenue: 0, categoryName: catName };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.lineTotal);
      itemMap.set(name, existing);
    }
  }

  const bestSellers: BestSellingItem[] = Array.from(itemMap.entries())
    .map(([name, data]) => ({
      name,
      quantity: data.quantity,
      revenue: data.revenue,
      categoryName: data.categoryName,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // 6. Category-wise sales
  const categoryMap = new Map<string, { itemCount: number; revenue: number }>();
  for (const item of itemMap.values()) {
    const existing = categoryMap.get(item.categoryName) || { itemCount: 0, revenue: 0 };
    existing.itemCount += item.quantity;
    existing.revenue += item.revenue;
    categoryMap.set(item.categoryName, existing);
  }

  const categorySales: CategorySales[] = Array.from(categoryMap.entries())
    .map(([categoryName, data]) => ({
      categoryName,
      itemCount: data.itemCount,
      revenue: data.revenue,
      percentage: grossSales > 0 ? Math.round((data.revenue / grossSales) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // 7. Daily breakdown
  const dailyMap = new Map<string, { sales: number; orderCount: number }>();

  // Initialize all dates in range with 0
  const curr = new Date(startDate);
  while (curr <= endDate) {
    const dateKey = curr.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    dailyMap.set(dateKey, { sales: 0, orderCount: 0 });
    curr.setDate(curr.getDate() + 1);
  }

  for (const order of completedOrders) {
    const dateKey = order.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const existing = dailyMap.get(dateKey) || { sales: 0, orderCount: 0 };
    existing.sales += Number(order.total);
    existing.orderCount += 1;
    dailyMap.set(dateKey, existing);
  }

  const dailySales: DailySales[] = Array.from(dailyMap.entries()).map(([date, data]) => {
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const displayDate = dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
    return {
      date,
      displayDate,
      sales: Math.round(data.sales),
      orderCount: data.orderCount,
    };
  });

  return {
    range: filter.range,
    fromFormatted: startDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }),
    toFormatted: endDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }),
    summary: {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: orderStatusCounts.CANCELLED,
      activeOrders:
        orderStatusCounts.PENDING +
        orderStatusCounts.ACCEPTED +
        orderStatusCounts.PREPARING +
        orderStatusCounts.READY,
      grossSales,
      subtotalSales,
      taxCollected,
      averageOrderValue,
      totalBanquetEnquiries: banquetEnquiries.length,
    },
    dailySales,
    bestSellers,
    categorySales,
    orderStatusCounts,
    banquetStatusCounts,
  };
}
