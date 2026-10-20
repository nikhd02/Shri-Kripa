/**
 * src/app/(admin)/dashboard/bookings/BookingsManagerClient.tsx
 *
 * Staff & Admin Table Bookings management interface with status transitions,
 * table assignment, filters, search, and details modal.
 */

'use client';

import React, { useState, useTransition } from 'react';
import {
  CalendarDays,
  Clock,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { BookingStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateBookingStatusAction, BookingDTO } from '@/server/actions/bookings';

interface TableOption {
  id: string;
  tableNumber: string;
  capacity: number;
}

interface BookingsManagerClientProps {
  initialBookings: BookingDTO[];
  availableTables: TableOption[];
}

export function BookingsManagerClient({
  initialBookings,
  availableTables,
}: BookingsManagerClientProps) {
  const [bookings, setBookings] = useState<BookingDTO[]>(initialBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Selected Booking for Details / Edit Modal
  const [activeBooking, setActiveBooking] = useState<BookingDTO | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [staffNotes, setStaffNotes] = useState<string>('');

  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Today string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    // Status Filter
    if (statusFilter === 'TODAY' && b.bookingDate !== todayStr) return false;
    if (statusFilter !== 'ALL' && statusFilter !== 'TODAY' && b.status !== statusFilter) return false;

    // Date Filter
    if (dateFilter && b.bookingDate !== dateFilter) return false;

    // Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = b.customerName.toLowerCase().includes(q);
      const matchPhone = b.customerPhone.includes(q);
      const matchRef = b.bookingReference.toLowerCase().includes(q);
      const matchEmail = b.customerEmail?.toLowerCase().includes(q) || false;
      return matchName || matchPhone || matchRef || matchEmail;
    }

    return true;
  });

  // Status Action Handler
  const handleUpdateStatus = (
    bookingId: string,
    newStatus: BookingStatus,
    tableIdToAssign?: string,
    notesToSave?: string
  ) => {
    setActionError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await updateBookingStatusAction({
        bookingId,
        status: newStatus,
        tableId: tableIdToAssign !== undefined ? tableIdToAssign : undefined,
        staffNotes: notesToSave !== undefined ? notesToSave : undefined,
      });

      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => {
            if (b.id === bookingId) {
              const assignedTable = availableTables.find((t) => t.id === tableIdToAssign);
              return {
                ...b,
                status: newStatus,
                tableId: tableIdToAssign !== undefined ? (tableIdToAssign || null) : b.tableId,
                tableNumber: tableIdToAssign !== undefined ? (assignedTable?.tableNumber || null) : b.tableNumber,
                staffNotes: notesToSave !== undefined ? notesToSave : b.staffNotes,
              };
            }
            return b;
          })
        );
        setSuccessMessage(`Booking #${bookingId.slice(-6)} updated to ${newStatus}.`);
        if (activeBooking && activeBooking.id === bookingId) {
          setActiveBooking(null);
        }
      } else {
        setActionError(res.error || 'Failed to update booking status.');
      }
    });
  };

  // Open Edit Modal
  const openEditModal = (b: BookingDTO) => {
    setActiveBooking(b);
    setSelectedTableId(b.tableId || '');
    setStaffNotes(b.staffNotes || '');
  };

  // Status Badge Helper
  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return <Badge variant="success">Confirmed</Badge>;
      case BookingStatus.PENDING:
        return <Badge variant="warning">Pending</Badge>;
      case BookingStatus.COMPLETED:
        return <Badge variant="info">Completed</Badge>;
      case BookingStatus.REJECTED:
        return <Badge variant="error">Rejected</Badge>;
      case BookingStatus.CANCELLED:
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Metrics
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === BookingStatus.PENDING).length;
  const todayCount = bookings.filter((b) => b.bookingDate === todayStr).length;
  const confirmedCount = bookings.filter((b) => b.status === BookingStatus.CONFIRMED).length;

  return (
    <div className="space-y-6">
      {/* ─── Header & Metrics ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Table Bookings
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Review guest reservations, assign dining tables, and manage booking confirmations.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Bookings</p>
          <p className="text-2xl font-bold text-[#241512] mt-1">{totalCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs">
          <p className="text-xs text-amber-800 font-semibold uppercase tracking-wider">Pending Requests</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
          <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Confirmed Bookings</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{confirmedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs">
          <p className="text-xs text-blue-800 font-semibold uppercase tracking-wider">Today&apos;s Diners</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{todayCount}</p>
        </div>
      </div>

      {/* Alert Notices */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {actionError}
          </span>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Search & Filters Bar ─── */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by guest name, phone, or reference (e.g. TB-26...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden"
            />
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden font-medium"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Bookings' },
            { id: 'TODAY', label: "Today's" },
            { id: BookingStatus.PENDING, label: 'Pending' },
            { id: BookingStatus.CONFIRMED, label: 'Confirmed' },
            { id: BookingStatus.COMPLETED, label: 'Completed' },
            { id: BookingStatus.REJECTED, label: 'Rejected' },
            { id: BookingStatus.CANCELLED, label: 'Cancelled' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-full font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-[#7B1D1D] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Bookings Table ─── */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-xs overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold">No bookings match the selected filters.</p>
            <p className="text-xs text-gray-400">Try adjusting your search query, status, or date filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Ref & Guest</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Guests</th>
                  <th className="py-3 px-4">Assigned Table</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-amber-50/20 transition-colors">
                    {/* Ref & Guest */}
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-[#7B1D1D] text-xs">
                        {b.bookingReference}
                      </p>
                      <p className="font-semibold text-gray-900 mt-0.5">{b.customerName}</p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {b.customerPhone}
                        </span>
                        {b.customerEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {b.customerEmail}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900">{b.bookingDate}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[#C9A84C]" />
                        {b.timeSlot} ({b.durationMinutes}m)
                      </p>
                    </td>

                    {/* Guests */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3 text-gray-500" />
                        {b.guestCount}
                      </span>
                    </td>

                    {/* Table Assignment */}
                    <td className="py-3.5 px-4">
                      {b.tableNumber ? (
                        <span className="font-bold text-[#7B1D1D] bg-[#FFF8F0] border border-[#C9A84C]/40 px-2 py-0.5 rounded-lg text-xs">
                          Table {b.tableNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{renderStatusBadge(b.status)}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {b.status === BookingStatus.PENDING && (
                          <>
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleUpdateStatus(b.id, BookingStatus.CONFIRMED, b.tableId || undefined)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] h-7 px-2.5 rounded-lg"
                              title="Confirm Reservation & Send Email"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleUpdateStatus(b.id, BookingStatus.REJECTED)}
                              className="border-red-200 text-red-600 hover:bg-red-50 text-[11px] h-7 px-2 rounded-lg"
                              title="Reject Booking"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}

                        {b.status === BookingStatus.CONFIRMED && (
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleUpdateStatus(b.id, BookingStatus.COMPLETED)}
                            className="bg-blue-700 hover:bg-blue-800 text-white text-[11px] h-7 px-2.5 rounded-lg"
                            title="Mark Meal Completed"
                          >
                            Complete
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(b)}
                          className="text-gray-600 hover:text-gray-900 h-7 w-7 p-0 rounded-lg"
                          title="View Details & Manage"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Details & Management Modal ─── */}
      {activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">
                  Reservation Details
                </span>
                <h3 className="text-lg font-bold text-[#7B1D1D]">
                  {activeBooking.bookingReference}
                </h3>
              </div>
              <button
                onClick={() => setActiveBooking(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guest Summary */}
            <div className="p-3.5 rounded-xl bg-gray-50 text-xs space-y-1.5 text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Guest:</span>
                <span className="font-bold">{activeBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone:</span>
                <span className="font-bold">{activeBooking.customerPhone}</span>
              </div>
              {activeBooking.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-bold">{activeBooking.customerEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Party Size:</span>
                <span className="font-bold">{activeBooking.guestCount} Guests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Schedule:</span>
                <span className="font-bold">
                  {activeBooking.bookingDate} at {activeBooking.timeSlot}
                </span>
              </div>
              {activeBooking.specialRequest && (
                <div className="pt-1 border-t border-gray-200 mt-1">
                  <span className="text-gray-500 block text-[10px] uppercase">Special Request:</span>
                  <p className="italic text-gray-800">{activeBooking.specialRequest}</p>
                </div>
              )}
            </div>

            {/* Table Assignment Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Assign Dining Table
              </label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden"
              >
                <option value="">-- No Table Assigned --</option>
                {availableTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.tableNumber} (Capacity: {t.capacity} Guests)
                  </option>
                ))}
              </select>
            </div>

            {/* Staff Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Internal Staff Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. VIP guest, requested table near AC..."
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#7B1D1D] focus:outline-hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                {activeBooking.status !== BookingStatus.CONFIRMED && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      handleUpdateStatus(
                        activeBooking.id,
                        BookingStatus.CONFIRMED,
                        selectedTableId,
                        staffNotes
                      )
                    }
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                  >
                    Confirm Booking
                  </Button>
                )}

                {activeBooking.status === BookingStatus.CONFIRMED && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      handleUpdateStatus(
                        activeBooking.id,
                        BookingStatus.COMPLETED,
                        selectedTableId,
                        staffNotes
                      )
                    }
                    className="bg-blue-700 hover:bg-blue-800 text-white text-xs"
                  >
                    Mark Completed
                  </Button>
                )}

                {activeBooking.status !== BookingStatus.CANCELLED && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      handleUpdateStatus(
                        activeBooking.id,
                        BookingStatus.CANCELLED,
                        selectedTableId,
                        staffNotes
                      )
                    }
                    className="text-gray-600 border-gray-300 text-xs"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                variant="secondary"
                disabled={isPending}
                onClick={() =>
                  handleUpdateStatus(
                    activeBooking.id,
                    activeBooking.status,
                    selectedTableId,
                    staffNotes
                  )
                }
                className="text-xs"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
