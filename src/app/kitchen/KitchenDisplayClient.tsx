/**
 * src/app/kitchen/KitchenDisplayClient.tsx
 * High-contrast, touch-optimized Kitchen Display System (KDS) client component.
 */

'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UtensilsCrossed,
  LayoutDashboard,
  Maximize2,
  Check,
} from 'lucide-react';
import { OrderStatus } from '@prisma/client';
import { updateOrderStatusAction } from '@/server/actions/orders';
import type { KitchenOrderDTO } from '@/lib/dto/order';

export type KitchenOrder = KitchenOrderDTO;

interface KitchenDisplayClientProps {
  initialOrders: KitchenOrder[];
}

function getElapsedMinutes(createdAtIso: string) {
  return Math.floor((Date.now() - new Date(createdAtIso).getTime()) / (1000 * 60));
}

export function KitchenDisplayClient({ initialOrders }: KitchenDisplayClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'ALL' | 'PREP' | 'READY'>('ALL');

  // Sync state during rendering if initialOrders changes
  const [prevInitialOrders, setPrevInitialOrders] = useState(initialOrders);
  if (initialOrders !== prevInitialOrders) {
    setPrevInitialOrders(initialOrders);
    setOrders(initialOrders);
  }

  // Auto-refresh polling every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [router]);

  // Manual refresh
  const handleManualRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Toggle item completed on chef's touch screen
  const toggleItemDone = (itemId: string) => {
    setCompletedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Update order status transition
  const handleStatusChange = (orderId: string, nextStatus: OrderStatus) => {
    startTransition(async () => {
      const res = await updateOrderStatusAction({ orderId, status: nextStatus });
      if (res.success) {
        setOrders((prev) =>
          prev
            .map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
            .filter((ticket) => ticket.status !== OrderStatus.COMPLETED && ticket.status !== OrderStatus.CANCELLED)
        );
      } else {
        alert(res.error || 'Failed to update ticket status.');
      }
    });
  };

  // Filter tickets
  const filteredOrders = orders.filter((o) => {
    if (filterMode === 'PREP') return o.status === 'PREPARING' || o.status === 'ACCEPTED' || o.status === 'PENDING';
    if (filterMode === 'READY') return o.status === 'READY';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans select-none">
      {/* KDS Header Bar */}
      <header className="bg-[#1A1A1A] border-b border-[#2A2A2A] px-4 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-[var(--color-accent)] flex items-center justify-center font-bold shadow-md">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wide text-[#E0C278] flex items-center gap-2">
              Shree Kripa Kitchen KDS
              <span className="text-xs bg-red-600/60 text-white border border-red-400 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {orders.length} Active {orders.length === 1 ? 'Ticket' : 'Tickets'}
              </span>
            </h1>
            <p className="text-xs text-gray-200 font-medium">Live order queue • Akhari Bypass, Varanasi</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Filters */}
          <div className="bg-[#242424] p-1 rounded-lg flex items-center text-xs border border-[#444444]">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-md font-bold cursor-pointer transition-colors ${
                filterMode === 'ALL' ? 'bg-[var(--color-primary)] text-white shadow-xs' : 'text-gray-200 hover:text-white'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('PREP')}
              className={`px-3 py-1.5 rounded-md font-bold cursor-pointer transition-colors ${
                filterMode === 'PREP' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-200 hover:text-white'
              }`}
            >
              Cooking ({orders.filter((o) => o.status === 'PREPARING').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('READY')}
              className={`px-3 py-1.5 rounded-md font-bold cursor-pointer transition-colors ${
                filterMode === 'READY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-200 hover:text-white'
              }`}
            >
              Ready ({orders.filter((o) => o.status === 'READY').length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isPending}
            className="p-2 rounded-lg bg-[#2E2E2E] hover:bg-[#3E3E3E] text-white border border-[#444444] transition-colors cursor-pointer"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin text-[var(--color-accent-light)]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#2E2E2E] hover:bg-[#3E3E3E] text-white border border-[#444444] transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2E2E2E] hover:bg-[#3E3E3E] text-xs font-bold text-white border border-[#555555] transition-colors shadow-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[var(--color-accent-light)]" /> Dashboard
          </Link>
        </div>
      </header>

      {/* Main Tickets Screen */}
      <main className="flex-1 p-4 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#2A2A2A] rounded-2xl bg-[#161616]">
            <UtensilsCrossed className="w-16 h-16 text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold text-white">All Orders Clear!</h2>
            <p className="text-gray-400 text-sm mt-1 max-w-sm">
              No active tickets in queue. New QR table orders and counter orders will chime in automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const elapsedMinutes = getElapsedMinutes(order.createdAt);
              const isUrgent = elapsedMinutes >= 20;
              const isWarning = elapsedMinutes >= 12 && elapsedMinutes < 20;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border-2 flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                    order.status === 'READY'
                      ? 'border-emerald-500 bg-[#142318]'
                      : order.status === 'PREPARING'
                      ? 'border-purple-500/80 bg-[#1D1627]'
                      : 'border-[#444444] bg-[#1E1E1E]'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3.5 border-b flex items-center justify-between ${
                      order.status === 'READY'
                        ? 'bg-emerald-900/60 border-emerald-500/40'
                        : order.status === 'PREPARING'
                        ? 'bg-purple-950/60 border-purple-500/40'
                        : 'bg-[#2A2A2A] border-[#444444]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {order.tableNumber ? (
                          <span className="text-xl sm:text-2xl font-extrabold text-[#E0C278] tracking-wide">
                            TABLE {order.tableNumber}
                          </span>
                        ) : (
                          <span className="text-lg font-extrabold text-white tracking-wide">
                            TAKEAWAY / WEB
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono font-bold text-gray-200 mt-0.5 tracking-wider">
                        #{order.orderNumber}
                      </p>
                    </div>

                    {/* Elapsed Time Badge */}
                    <div
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm ${
                        isUrgent
                          ? 'bg-red-600 text-white animate-pulse'
                          : isWarning
                          ? 'bg-amber-500 text-black font-extrabold'
                          : 'bg-[#3A3A3A] text-white border border-gray-600'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {elapsedMinutes}m
                    </div>
                  </div>

                  {/* Customer Note (if any) */}
                  {order.notes && (
                    <div className="px-3.5 py-2 bg-amber-950/80 border-b border-amber-500/50 text-amber-200 text-xs font-semibold flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Note: &ldquo;{order.notes}&rdquo;</span>
                    </div>
                  )}

                  {/* Items Checklist for Chefs */}
                  <div className="p-3.5 flex-1 space-y-2.5 overflow-y-auto max-h-[360px]">
                    {order.items.map((item) => {
                      const isItemDone = completedItemIds.has(item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItemDone(item.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isItemDone
                              ? 'bg-black/30 border-gray-800 opacity-40 line-through'
                              : 'bg-[#282828] border-[#3A3A3A] hover:border-[#555555]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              {/* Touch Checkbox */}
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  isItemDone
                                    ? 'bg-green-600 border-green-600 text-white'
                                    : 'border-gray-500 bg-[#333333]'
                                }`}
                              >
                                {isItemDone && <Check className="w-3.5 h-3.5" />}
                              </div>

                              <div>
                                <span className="font-extrabold text-base sm:text-lg text-white leading-tight">
                                  {item.quantity}x {item.name}
                                </span>
                                {item.variantName && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-semibold bg-[var(--color-primary)] text-white">
                                    {item.variantName}
                                  </span>
                                )}

                                {item.addOns.length > 0 && (
                                  <p className="text-xs text-[var(--color-accent-light)] mt-0.5">
                                    + {item.addOns.join(', ')}
                                  </p>
                                )}

                                {item.specialInstructions && (
                                  <p className="text-xs text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded mt-1">
                                    ⚠️ {item.specialInstructions}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Action Button */}
                  <div className="p-3 bg-[#1A1A1A] border-t border-[#2A2A2A]">
                    {order.status === OrderStatus.PENDING && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, OrderStatus.ACCEPTED)}
                        disabled={isPending}
                        className="w-full py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-sm shadow-md cursor-pointer border border-red-500/40"
                      >
                        Accept Ticket
                      </button>
                    )}

                    {order.status === OrderStatus.ACCEPTED && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, OrderStatus.PREPARING)}
                        disabled={isPending}
                        className="w-full py-2.5 rounded-xl bg-purple-700 text-white font-bold text-sm hover:bg-purple-600 shadow-md cursor-pointer"
                      >
                        Start Cooking (Preparing)
                      </button>
                    )}

                    {order.status === OrderStatus.PREPARING && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, OrderStatus.READY)}
                        disabled={isPending}
                        className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm sm:text-base hover:bg-emerald-500 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Mark Ready to Serve
                      </button>
                    )}

                    {order.status === OrderStatus.READY && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, OrderStatus.COMPLETED)}
                        disabled={isPending}
                        className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer border border-slate-500/40"
                      >
                        <Check className="w-4 h-4" /> Picked Up / Served
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
