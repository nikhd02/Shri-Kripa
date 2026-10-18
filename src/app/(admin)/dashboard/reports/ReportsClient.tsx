'use client';
/**
 * src/app/(admin)/dashboard/reports/ReportsClient.tsx
 * Interactive reports client with date range switching, daily sales chart,
 * best-selling dishes, status breakdowns, and CSV export.
 */

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Calendar,
  Download,
  IndianRupee,
  UtensilsCrossed,
  Filter,
  Users2,
  FolderTree,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReportsData } from '@/server/queries/reports';

interface ReportsClientProps {
  data: ReportsData;
}

export function ReportsClient({ data }: ReportsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRange = data.range;
  const [customFrom, setCustomFrom] = useState(searchParams.get('from') || '');
  const [customTo, setCustomTo] = useState(searchParams.get('to') || '');
  const [showCustomModal, setShowCustomModal] = useState(currentRange === 'custom');

  const handleRangeChange = (range: 'today' | '7d' | '30d' | 'custom') => {
    if (range === 'custom') {
      setShowCustomModal(true);
      return;
    }
    setShowCustomModal(false);
    router.push(`/dashboard/reports?range=${range}`);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFrom) return;
    router.push(
      `/dashboard/reports?range=custom&from=${customFrom}&to=${customTo || customFrom}`
    );
  };

  // CSV Export logic
  const handleExportCSV = () => {
    const csvLines: string[] = [];

    csvLines.push('"Shree Kripa Family Restaurant & Banquet — Sales & Performance Report"');
    csvLines.push(`"Reporting Period:","${data.fromFormatted} to ${data.toFormatted}"`);
    csvLines.push('');
    csvLines.push('"METRIC","VALUE"');
    csvLines.push(`"Gross Sales (INR)","${data.summary.grossSales.toFixed(2)}"`);
    csvLines.push(`"Subtotal Sales (INR)","${data.summary.subtotalSales.toFixed(2)}"`);
    csvLines.push(`"Tax (GST) Collected (INR)","${data.summary.taxCollected.toFixed(2)}"`);
    csvLines.push(`"Total Orders","${data.summary.totalOrders}"`);
    csvLines.push(`"Completed Orders","${data.summary.completedOrders}"`);
    csvLines.push(`"Cancelled Orders","${data.summary.cancelledOrders}"`);
    csvLines.push(`"Average Order Value (INR)","${data.summary.averageOrderValue.toFixed(2)}"`);
    csvLines.push(`"Banquet Enquiries Received","${data.summary.totalBanquetEnquiries}"`);
    csvLines.push('');

    // Daily Sales Table
    csvLines.push('"DAILY SALES BREAKDOWN"');
    csvLines.push('"Date","Sales (INR)","Orders Count"');
    for (const d of data.dailySales) {
      csvLines.push(`"${d.date}","${d.sales}","${d.orderCount}"`);
    }
    csvLines.push('');

    // Best-Sellers
    csvLines.push('"BEST-SELLING MENU ITEMS"');
    csvLines.push('"Rank","Item Name","Category","Quantity Sold","Revenue (INR)"');
    data.bestSellers.forEach((item, index) => {
      csvLines.push(
        `"${index + 1}","${item.name}","${item.categoryName}","${item.quantity}","${item.revenue.toFixed(2)}"`
      );
    });
    csvLines.push('');

    // Category Sales
    csvLines.push('"CATEGORY SALES BREAKDOWN"');
    csvLines.push('"Category","Items Sold","Revenue (INR)","Share (%)"');
    data.categorySales.forEach((cat) => {
      csvLines.push(
        `"${cat.categoryName}","${cat.itemCount}","${cat.revenue.toFixed(2)}","${cat.percentage}%"`
      );
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `shree_kripa_report_${data.range}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Maximum value for bar chart scaling
  const maxDailySales = Math.max(...data.dailySales.map((d) => d.sales), 100);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Reports & Analytics
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Real-time business performance, revenue analytics, and dish sales from{' '}
            <span className="font-semibold text-[var(--color-primary)]">
              {data.fromFormatted}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-[var(--color-primary)]">
              {data.toFormatted}
            </span>
            .
          </p>
        </div>

        {/* Date Filter Pills & Export */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleRangeChange('today')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currentRange === 'today'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleRangeChange('7d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currentRange === '7d'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleRangeChange('30d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currentRange === '30d'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => handleRangeChange('custom')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currentRange === 'custom'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Custom
            </button>
          </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="gap-2 cursor-pointer border-[var(--color-border)] hover:bg-slate-50"
          >
            <Download className="w-4 h-4 text-[var(--color-primary)]" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Custom Date Form (if custom range selected) */}
      {showCustomModal && (
        <Card className="border-[var(--color-border)] shadow-xs animate-fade-in bg-amber-50/40">
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleApplyCustom} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  required
                  className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
              >
                Apply Date Range
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRangeChange('7d')}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Gross Sales */}
        <Card className="border-[var(--color-border)] shadow-xs col-span-2 sm:col-span-1 lg:col-span-2 bg-gradient-to-br from-white to-[#FFF8F0]">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Gross Sales
              </span>
              <div className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <p
              className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {formatCurrency(data.summary.grossSales)}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              From {data.summary.completedOrders} completed orders
            </p>
          </CardContent>
        </Card>

        {/* Completed Orders */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Completed
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              {data.summary.completedOrders}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Fulfilled orders</p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Total Orders
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              {data.summary.totalOrders}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">All incoming</p>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Avg. Ticket
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              {formatCurrency(data.summary.averageOrderValue)}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Per completed order</p>
          </CardContent>
        </Card>

        {/* Banquet Enquiries */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Banquets
              </span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Users2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              {data.summary.totalBanquetEnquiries}
            </p>
            <p className="text-[11px] text-purple-700 font-medium mt-1">Leads received</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Bar Chart */}
      <Card className="border-[var(--color-border)] shadow-xs">
        <CardHeader className="p-5 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                Sales Trend
              </CardTitle>
              <CardDescription className="text-xs">
                Daily completed order revenue in {data.fromFormatted} — {data.toFormatted}
              </CardDescription>
            </div>
            <Badge variant="secondary">
              Total {formatCurrency(data.summary.grossSales)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-4">
          {data.dailySales.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-muted)]">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold">No sales recorded for this timeframe</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Responsive Bar Graphic */}
              <div className="h-48 sm:h-56 w-full flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-[var(--color-border)] overflow-x-auto">
                {data.dailySales.map((day) => {
                  const heightPercent =
                    maxDailySales > 0 ? Math.round((day.sales / maxDailySales) * 100) : 0;
                  const isPositive = day.sales > 0;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 min-w-[36px] sm:min-w-[48px] flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[var(--color-text-primary)] text-white text-[11px] rounded-md px-2 py-1 shadow-md whitespace-nowrap z-20">
                        {day.displayDate}: {formatCurrency(day.sales)} ({day.orderCount} orders)
                      </div>

                      {/* Value label on top of bar */}
                      {isPositive && (
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] mb-1 hidden sm:block">
                          ₹{day.sales >= 1000 ? `${(day.sales / 1000).toFixed(1)}k` : day.sales}
                        </span>
                      )}

                      {/* Bar Pillar */}
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isPositive
                            ? 'bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-accent)] group-hover:brightness-110'
                            : 'bg-slate-100'
                        }`}
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      />

                      {/* Date label under bar */}
                      <span className="text-[10px] font-medium text-[var(--color-text-muted)] mt-2 whitespace-nowrap">
                        {day.displayDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid: Best-Sellers & Category Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best-Selling Dishes */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-[var(--color-primary)]" />
              <div>
                <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
                  Top-Selling Dishes
                </CardTitle>
                <CardDescription className="text-xs">
                  Ranked by order quantity from completed orders
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.bestSellers.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">
                No dish sales recorded yet in this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">Dish</th>
                      <th className="py-2.5 px-4 text-center">Qty Sold</th>
                      <th className="py-2.5 px-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {data.bestSellers.map((item, idx) => (
                      <tr key={item.name} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-xs text-[var(--color-primary)]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-[var(--color-text-primary)]">{item.name}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            {item.categoryName}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-bold">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[var(--color-text-primary)]">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category-Wise Distribution */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[var(--color-primary)]" />
              <div>
                <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
                  Category Revenue Share
                </CardTitle>
                <CardDescription className="text-xs">
                  Sales breakdown by menu category
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {data.categorySales.length === 0 ? (
              <div className="py-8 text-center text-[var(--color-text-muted)] text-sm">
                No category sales recorded yet in this period.
              </div>
            ) : (
              data.categorySales.map((cat) => (
                <div key={cat.categoryName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {cat.categoryName}{' '}
                      <span className="font-normal text-[var(--color-text-muted)]">
                        ({cat.itemCount} items)
                      </span>
                    </span>
                    <span className="font-bold text-[var(--color-primary)]">
                      {formatCurrency(cat.revenue)}{' '}
                      <span className="font-medium text-[var(--color-text-muted)] text-[11px]">
                        ({cat.percentage}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid: Order Pipeline Status & Banquet Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
              Order Status Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Status distribution across all {data.summary.totalOrders} recorded orders
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <p className="text-xs font-semibold text-emerald-800">Completed</p>
                <p className="text-xl font-extrabold text-emerald-900 mt-1">
                  {data.orderStatusCounts.COMPLETED}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                <p className="text-xs font-semibold text-blue-800">Ready</p>
                <p className="text-xl font-extrabold text-blue-900 mt-1">
                  {data.orderStatusCounts.READY}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                <p className="text-xs font-semibold text-amber-800">Preparing</p>
                <p className="text-xl font-extrabold text-amber-900 mt-1">
                  {data.orderStatusCounts.PREPARING}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50">
                <p className="text-xs font-semibold text-indigo-800">Accepted</p>
                <p className="text-xl font-extrabold text-indigo-900 mt-1">
                  {data.orderStatusCounts.ACCEPTED}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-700">Pending</p>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {data.orderStatusCounts.PENDING}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-red-200 bg-red-50/50">
                <p className="text-xs font-semibold text-red-800">Cancelled</p>
                <p className="text-xl font-extrabold text-red-900 mt-1">
                  {data.orderStatusCounts.CANCELLED}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banquet Pipeline Breakdown */}
        <Card className="border-[var(--color-border)] shadow-xs">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
              Banquet Enquiry Pipeline
            </CardTitle>
            <CardDescription className="text-xs">
              Status distribution across all {data.summary.totalBanquetEnquiries} event leads
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-blue-800">New Leads</p>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <p className="text-xl font-extrabold text-blue-900 mt-1">
                  {data.banquetStatusCounts.NEW}
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">Needs contact</p>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-amber-800">Contacted</p>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <p className="text-xl font-extrabold text-amber-900 mt-1">
                  {data.banquetStatusCounts.CONTACTED}
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">In negotiation</p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-emerald-800">Confirmed</p>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-xl font-extrabold text-emerald-900 mt-1">
                  {data.banquetStatusCounts.CONFIRMED}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Event booked</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">Closed</p>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                </div>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {data.banquetStatusCounts.CLOSED}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Archived</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
