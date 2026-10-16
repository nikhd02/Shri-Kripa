/**
 * src/app/(admin)/dashboard/orders/OrderManagerClient.tsx
 * Interactive admin orders management with live polling, status workflow, and payment tracking.
 */

'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  Ban,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  User,
  Phone,
  FileText,
} from 'lucide-react';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import {
  updateOrderStatusAction,
  updatePaymentStatusAction,
} from '@/server/actions/orders';
import type { AdminOrderDTO } from '@/lib/dto/order';

export type AdminOrder = AdminOrderDTO;

interface OrderManagerClientProps {
  initialOrders: AdminOrder[];
}

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-800', bg: 'bg-amber-100 border-amber-300' },
  ACCEPTED: { label: 'Accepted', color: 'text-blue-800', bg: 'bg-blue-100 border-blue-300' },
  PREPARING: { label: 'Preparing', color: 'text-purple-800', bg: 'bg-purple-100 border-purple-300' },
  READY: { label: 'Ready to Serve', color: 'text-emerald-800', bg: 'bg-emerald-100 border-emerald-300' },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-300' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-800', bg: 'bg-red-100 border-red-300' },
};

function formatElapsed(dateIso: string) {
  const diffSec = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export function OrderManagerClient({ initialOrders }: OrderManagerClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Sync state during rendering if initialOrders changes
  const [prevInitialOrders, setPrevInitialOrders] = useState(initialOrders);
  if (initialOrders !== prevInitialOrders) {
    setPrevInitialOrders(initialOrders);
    setOrders(initialOrders);
  }

  // Auto-refresh polling every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      startTransition(() => {
        router.refresh();
        setLastRefreshed(new Date());
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [router]);

  // Manual refresh
  const handleManualRefresh = () => {
    startTransition(() => {
      router.refresh();
      setLastRefreshed(new Date());
    });
  };

  // Status transition handlers
  const handleAdvanceStatus = (orderId: string, nextStatus: OrderStatus) => {
    startTransition(async () => {
      const res = await updateOrderStatusAction({ orderId, status: nextStatus });
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        );
      } else {
        alert(res.error || 'Failed to update order status.');
      }
    });
  };

  const handleCancelOrder = (order: AdminOrder) => {
    if (!confirm(`Are you sure you want to cancel Order ${order.orderNumber}?`)) {
      return;
    }

    startTransition(async () => {
      const res = await updateOrderStatusAction({
        orderId: order.id,
        status: OrderStatus.CANCELLED,
      });
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: OrderStatus.CANCELLED } : o))
        );
      } else {
        alert(res.error || 'Failed to cancel order.');
      }
    });
  };

  // Payment status handler
  const handleTogglePayment = (order: AdminOrder, method: PaymentMethod = PaymentMethod.CASH) => {
    const nextStatus =
      order.paymentStatus === PaymentStatus.COMPLETED
        ? PaymentStatus.PENDING
        : PaymentStatus.COMPLETED;

    startTransition(async () => {
      const res = await updatePaymentStatusAction({
        orderId: order.id,
        status: nextStatus,
        method,
      });

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, paymentStatus: nextStatus, paymentMethod: method }
              : o
          )
        );
      } else {
        alert(res.error || 'Failed to update payment status.');
      }
    });
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return orders.filter((o) => {
      // Tab filter
      if (selectedStatusTab === 'ACTIVE') {
        if (!['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)) return false;
      } else if (selectedStatusTab !== 'ALL' && o.status !== selectedStatusTab) {
        return false;
      }

      // Search filter
      if (!query) return true;
      const matchOrderNum = o.orderNumber.toLowerCase().includes(query);
      const matchTable = o.tableNumber?.toLowerCase().includes(query) ?? false;
      const matchCustomer = o.customerName?.toLowerCase().includes(query) ?? false;
      const matchPhone = o.customerPhone?.toLowerCase().includes(query) ?? false;
      const matchDish = o.items.some((item) => item.name.toLowerCase().includes(query));

      return matchOrderNum || matchTable || matchCustomer || matchPhone || matchDish;
    });
  }, [orders, selectedStatusTab, searchQuery]);

  // Tab counts
  const counts = useMemo(() => {
    const active = orders.filter((o) =>
      ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
    ).length;
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const preparing = orders.filter((o) => o.status === 'PREPARING').length;
    const ready = orders.filter((o) => o.status === 'READY').length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;

    return { active, pending, preparing, ready, completed };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Active Orders
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{counts.active}</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Pending Acceptance
          </p>
          <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">{counts.pending}</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            In Kitchen
          </p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{counts.preparing}</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Ready to Serve
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{counts.ready}</p>
        </div>
      </div>

      {/* Control Bar: Filter Tabs & Search & Polling Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs sm:text-sm">
          {[
            { id: 'ACTIVE', label: `Active (${counts.active})` },
            { id: 'ALL', label: `All (${orders.length})` },
            { id: OrderStatus.PENDING, label: `Pending (${counts.pending})` },
            { id: OrderStatus.PREPARING, label: `Kitchen (${counts.preparing})` },
            { id: OrderStatus.READY, label: `Ready (${counts.ready})` },
            { id: OrderStatus.COMPLETED, label: `Completed (${counts.completed})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                selectedStatusTab === tab.id
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-xs font-bold'
                  : 'bg-white border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-muted)] font-semibold'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Indicator & Refresh Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search order #, table, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--color-border-strong)] text-xs font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none bg-white"
            />
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border-strong)] bg-white hover:bg-[var(--color-muted)] text-xs font-bold text-[var(--color-text-primary)] transition-colors cursor-pointer"
            title="Auto-refreshes every 15s"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="text-xs text-[var(--color-text-muted)] font-medium hidden md:inline ml-1">
              ({lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          </button>
        </div>
      </div>

      {/* Orders List / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-white p-8">
          <ShoppingBag className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-[var(--color-text-primary)] text-base">No orders in this view</h3>
          <p className="text-xs font-medium text-[var(--color-text-muted)] mt-1">
            Incoming table orders and website orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_LABELS[order.status];

            return (
              <div
                key={order.id}
                className="p-5 rounded-2xl border border-[var(--color-border)] bg-white shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Header: Order info, Table, Time, Status */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-base text-[var(--color-primary)]">
                      {order.orderNumber}
                    </span>

                    {order.tableNumber ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-2xs">
                        <UtensilsCrossed className="w-3 h-3 text-[var(--color-accent-light)]" />
                        Table {order.tableNumber}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-muted)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
                        Takeaway / Web
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)]">
                      <Clock className="w-3 h-3 text-[var(--color-text-muted)]" />
                      {formatElapsed(order.createdAt)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.color}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Customer Details & Notes (if any) */}
                {(order.customerName || order.customerPhone || order.notes) && (
                  <div className="p-2.5 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)] text-xs flex flex-wrap items-center gap-4 text-[var(--color-text-secondary)] font-medium">
                    {order.customerName && (
                      <span className="inline-flex items-center gap-1 font-bold text-[var(--color-text-primary)]">
                        <User className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                        {order.customerName}
                      </span>
                    )}
                    {order.customerPhone && (
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {order.customerPhone}
                      </a>
                    )}
                    {order.notes && (
                      <span className="inline-flex items-center gap-1 text-amber-900 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <FileText className="w-3.5 h-3.5 text-amber-700" />
                        Note: &ldquo;{order.notes}&rdquo;
                      </span>
                    )}
                  </div>
                )}

                {/* Items Ordered List */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)] flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="font-bold text-[var(--color-text-primary)]">
                              {item.quantity}x {item.name}
                            </span>
                            {item.variantName && (
                              <span className="ml-1 text-[11px] font-bold text-[var(--color-primary)]">
                                ({item.variantName})
                              </span>
                            )}
                            {item.addOns.length > 0 && (
                              <p className="text-[11px] font-medium text-[var(--color-text-muted)] mt-0.5">
                                + {item.addOns.map((a) => a.name).join(', ')}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-[11px] font-semibold text-amber-900 italic mt-0.5">
                                &ldquo;{item.specialInstructions}&rdquo;
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-[var(--color-text-primary)]">
                            {formatCurrency(parseFloat(item.lineTotal))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill & Actions Footer */}
                <div className="pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Payment Status & Bill */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm">
                      <span className="text-[var(--color-text-muted)] text-xs font-medium">Total: </span>
                      <span className="font-extrabold text-base text-[var(--color-primary)]">
                        {formatCurrency(parseFloat(order.total))}
                      </span>
                      {parseFloat(order.taxAmount) > 0 && (
                        <span className="text-xs text-[var(--color-text-muted)] font-medium ml-1">
                          (inc. GST {formatCurrency(parseFloat(order.taxAmount))})
                        </span>
                      )}
                    </div>

                    {/* Payment Status Toggle */}
                    <div className="flex items-center gap-1.5">
                      {order.paymentStatus === PaymentStatus.COMPLETED ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-900 border border-green-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                          Paid ({order.paymentMethod})
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                            Unpaid
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(order, PaymentMethod.CASH)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--color-border-strong)] text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-muted)] cursor-pointer"
                          >
                            <Banknote className="w-3.5 h-3.5" /> Cash Paid
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(order, PaymentMethod.UPI_MANUAL)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--color-border-strong)] text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-muted)] cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> UPI Paid
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Progression Workflow Buttons */}
                  <div className="flex items-center gap-2">
                    {order.status === OrderStatus.PENDING && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order)}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5 inline mr-1" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(order.id, OrderStatus.ACCEPTED)}
                          disabled={isPending}
                          className="px-3.5 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept Order
                        </button>
                      </>
                    )}

                    {order.status === OrderStatus.ACCEPTED && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order)}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(order.id, OrderStatus.PREPARING)}
                          disabled={isPending}
                          className="px-3.5 py-1.5 rounded-lg bg-purple-700 text-white hover:bg-purple-800 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <UtensilsCrossed className="w-3.5 h-3.5" />
                          Send to Kitchen
                        </button>
                      </>
                    )}

                    {order.status === OrderStatus.PREPARING && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(order.id, OrderStatus.READY)}
                          disabled={isPending}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Ready to Serve
                        </button>
                      </>
                    )}

                    {order.status === OrderStatus.READY && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(order.id, OrderStatus.COMPLETED)}
                        disabled={isPending}
                        className="px-4 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Complete & Served
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
