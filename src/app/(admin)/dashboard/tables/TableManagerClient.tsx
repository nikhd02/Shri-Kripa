/**
 * src/app/(admin)/dashboard/tables/TableManagerClient.tsx
 * Client management for restaurant tables, QR preview, and printable tent cards.
 */

'use client';

import React, { useState, useTransition } from 'react';
import QRCode from 'qrcode';
import {
  Plus,
  QrCode,
  Printer,
  RefreshCw,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  ExternalLink,
  UtensilsCrossed,
} from 'lucide-react';
import {
  createTableAction,
  updateTableAction,
  toggleTableActiveAction,
  toggleTableOnlineBookingAction,
  regenerateTableQRAction,
  deleteTableAction,
} from '@/server/actions/tables';
import type { TableDTO } from '@/lib/dto/table';

export type TableItem = TableDTO;

interface TableManagerClientProps {
  initialTables: TableItem[];
}

export function TableManagerClient({ initialTables }: TableManagerClientProps) {
  const [tables, setTables] = useState<TableItem[]>(initialTables);
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [qrModalTable, setQrModalTable] = useState<TableItem | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Form state
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [isActive, setIsActive] = useState(true);
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Sync state during rendering if initialTables changes
  const [prevInitialTables, setPrevInitialTables] = useState(initialTables);
  if (initialTables !== prevInitialTables) {
    setPrevInitialTables(initialTables);
    setTables(initialTables);
  }

  // Helper to generate QR data URL
  const generateQrUrl = async (qrToken: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const orderUrl = `${origin}/menu?table=${qrToken}`;
    return QRCode.toDataURL(orderUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#7B1D1D',
        light: '#FFFFFF',
      },
    });
  };

  // Open QR modal and generate QR image
  const handleOpenQrModal = async (table: TableItem) => {
    setQrModalTable(table);
    try {
      const url = await generateQrUrl(table.qrToken);
      setQrDataUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  // Handle open add modal
  const handleOpenAdd = () => {
    setTableNumber('');
    setCapacity('4');
    setIsActive(true);
    setOnlineBookingEnabled(false);
    setErrorMessage('');
    setFieldErrors({});
    setIsAddModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (table: TableItem) => {
    setEditingTable(table);
    setTableNumber(table.tableNumber);
    setCapacity(table.capacity.toString());
    setIsActive(table.isActive);
    setOnlineBookingEnabled(table.onlineBookingEnabled);
    setErrorMessage('');
    setFieldErrors({});
  };

  // Submit Add Table
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    startTransition(async () => {
      const res = await createTableAction({
        tableNumber: tableNumber.trim(),
        capacity: parseInt(capacity, 10),
        isActive,
        onlineBookingEnabled,
      });

      if (res.success && res.data) {
        const newTable = res.data as TableItem;
        setTables((prev) => [...prev, { ...newTable, activeOrdersCount: 0 }].sort((a, b) => a.tableNumber.localeCompare(b.tableNumber)));
        setIsAddModalOpen(false);
      } else {
        setErrorMessage(res.error || 'Failed to create table.');
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  // Submit Edit Table
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    setErrorMessage('');
    setFieldErrors({});

    startTransition(async () => {
      const res = await updateTableAction(editingTable.id, {
        tableNumber: tableNumber.trim(),
        capacity: parseInt(capacity, 10),
        isActive,
        onlineBookingEnabled,
      });

      if (res.success && res.data) {
        const updated = res.data as TableItem;
        setTables((prev) =>
          prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
        );
        setEditingTable(null);
      } else {
        setErrorMessage(res.error || 'Failed to update table.');
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  // Toggle active status
  const handleToggleActive = (table: TableItem) => {
    const nextState = !table.isActive;
    startTransition(async () => {
      const res = await toggleTableActiveAction(table.id, nextState);
      if (res.success) {
        setTables((prev) =>
          prev.map((t) => (t.id === table.id ? { ...t, isActive: nextState } : t))
        );
      } else {
        alert(res.error || 'Failed to toggle status.');
      }
    });
  };

  // Toggle online booking enabled status
  const handleToggleOnlineBooking = (table: TableItem) => {
    const nextState = !table.onlineBookingEnabled;
    startTransition(async () => {
      const res = await toggleTableOnlineBookingAction(table.id, nextState);
      if (res.success) {
        setTables((prev) =>
          prev.map((t) => (t.id === table.id ? { ...t, onlineBookingEnabled: nextState } : t))
        );
      } else {
        alert(res.error || 'Failed to toggle online booking setting.');
      }
    });
  };

  // Regenerate QR token
  const handleRegenerateQR = (table: TableItem) => {
    if (
      !confirm(
        `Regenerate QR token for "${table.tableNumber}"? Any existing printed QR codes for this table will stop working immediately.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await regenerateTableQRAction(table.id);
      if (res.success && res.data) {
        const updated = res.data as TableItem;
        setTables((prev) =>
          prev.map((t) => (t.id === updated.id ? { ...t, qrToken: updated.qrToken } : t))
        );
        if (qrModalTable?.id === updated.id) {
          setQrModalTable(updated);
          generateQrUrl(updated.qrToken).then(setQrDataUrl).catch(() => {});
        }
      } else {
        alert(res.error || 'Failed to regenerate QR code.');
      }
    });
  };

  // Delete table
  const handleDeleteTable = (table: TableItem) => {
    if (table.activeOrdersCount > 0) {
      alert(`Cannot delete Table ${table.tableNumber} while it has active orders.`);
      return;
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete Table "${table.tableNumber}"? This cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteTableAction(table.id);
      if (res.success) {
        setTables((prev) => prev.filter((t) => t.id !== table.id));
      } else {
        alert(res.error || 'Failed to delete table.');
      }
    });
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Summary statistics
  const totalTables = tables.length;
  const activeTables = tables.filter((t) => t.isActive).length;
  const totalCapacity = tables.reduce((acc, t) => acc + (t.isActive ? t.capacity : 0), 0);
  const tablesWithActiveOrders = tables.filter((t) => t.activeOrdersCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Top summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white shadow-xs">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Total Tables
          </p>
          <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">{totalTables}</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white shadow-xs">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Active Tables
          </p>
          <p className="text-2xl font-bold text-green-800 mt-1">{activeTables}</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white shadow-xs">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Seating Capacity
          </p>
          <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">{totalCapacity} seats</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white shadow-xs">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Active Orders
          </p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{tablesWithActiveOrders} tables</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <p className="text-sm font-medium text-[var(--color-text-muted)]">
          Customers scanning a table QR code will be recognized and their order attached to that table.
        </p>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Table
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        {tables.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--color-border)] rounded-xl bg-white">
            <UtensilsCrossed className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3 opacity-60" />
            <p className="font-bold text-[var(--color-text-primary)]">No dining tables created yet</p>
            <p className="text-sm font-medium text-[var(--color-text-muted)] mt-1">
              Add your first table to generate ordering QR codes.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold hover:bg-[var(--color-primary-dark)]"
            >
              <Plus className="w-4 h-4" /> Add Table
            </button>
          </div>
        ) : (
          tables.map((table) => (
            <div
              key={table.id}
              className={`p-5 rounded-xl border bg-white shadow-xs transition-all flex flex-col justify-between ${
                table.isActive
                  ? 'border-[var(--color-border)]'
                  : 'border-gray-200 bg-gray-50/50 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3
                      className="text-xl font-bold text-[var(--color-primary)] tracking-wide"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Table {table.tableNumber}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-muted)] border border-[var(--color-border)] px-2.5 py-0.5 rounded">
                        <Users className="w-3.5 h-3.5" /> {table.capacity} Guests
                      </span>
                      {table.activeOrdersCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                          {table.activeOrdersCount} Active Order{table.activeOrdersCount > 1 ? 's' : ''}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleOnlineBooking(table)}
                        disabled={isPending}
                        title="Click to toggle online reservation eligibility"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors border ${
                          table.onlineBookingEnabled
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            table.onlineBookingEnabled ? 'bg-emerald-600' : 'bg-gray-400'
                          }`}
                        />
                        {table.onlineBookingEnabled ? 'Online Booking Enabled' : 'Online Booking Disabled'}
                      </button>
                    </div>
                  </div>

                  {/* Active Toggle badge */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(table)}
                    disabled={isPending}
                    title="Click to toggle active status"
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors border ${
                      table.isActive
                        ? 'bg-green-100 text-green-900 border-green-300 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {table.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-700" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-gray-600" /> Inactive
                      </>
                    )}
                  </button>
                </div>

                {/* QR Code Quick Info */}
                <div className="mt-4 p-3 rounded-lg bg-[var(--color-muted)]/50 border border-[var(--color-border)]/50 flex items-center justify-between">
                  <div className="text-xs text-[var(--color-text-muted)]">
                    <p className="font-mono text-[11px] truncate max-w-[180px]">
                      Token: {table.qrToken.slice(0, 10)}...
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Secure dine-in link</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenQrModal(table)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-accent)] text-[var(--color-accent-foreground)] text-xs font-bold hover:brightness-105 transition-all shadow-xs cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR & Card
                  </button>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <button
                  type="button"
                  onClick={() => handleRegenerateQR(table)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors p-1"
                  title="Regenerate QR token (revokes old QR)"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate QR
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(table)}
                    disabled={isPending}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors"
                    title="Edit Table"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTable(table)}
                    disabled={isPending || table.activeOrdersCount > 0}
                    className={`p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors ${
                      table.activeOrdersCount > 0 ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                    title={
                      table.activeOrdersCount > 0
                        ? 'Cannot delete table with active orders'
                        : 'Delete Table'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD TABLE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2
                className="text-xl font-bold text-[var(--color-primary)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Add Dining Table
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAdd} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] mb-1">
                  Table Number / Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1, 2, T-01, VIP-1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm font-medium text-[var(--color-text-primary)] bg-white"
                />
                {fieldErrors.tableNumber && (
                  <p className="text-xs font-semibold text-red-700 mt-1">{fieldErrors.tableNumber[0]}</p>
                )}
                <p className="text-xs font-medium text-[var(--color-text-muted)] mt-1">
                  Alphanumeric, dashes, or underscores only.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] mb-1">
                  Seating Capacity (Guests) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm font-medium text-[var(--color-text-primary)] bg-white"
                />
                {fieldErrors.capacity && (
                  <p className="text-xs font-semibold text-red-700 mt-1">{fieldErrors.capacity[0]}</p>
                )}
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="add-table-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <label htmlFor="add-table-active" className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Active (Ready for guest orders)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="add-table-online"
                    checked={onlineBookingEnabled}
                    onChange={(e) => setOnlineBookingEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <label htmlFor="add-table-online" className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Enable for Online Table Reservations
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border-strong)] text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TABLE MODAL */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2
                className="text-xl font-bold text-[var(--color-primary)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Edit Table {editingTable.tableNumber}
              </h2>
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] mb-1">
                  Table Number / Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm font-medium text-[var(--color-text-primary)] bg-white"
                />
                {fieldErrors.tableNumber && (
                  <p className="text-xs font-semibold text-red-700 mt-1">{fieldErrors.tableNumber[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] mb-1">
                  Seating Capacity (Guests) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm font-medium text-[var(--color-text-primary)] bg-white"
                />
                {fieldErrors.capacity && (
                  <p className="text-xs font-semibold text-red-700 mt-1">{fieldErrors.capacity[0]}</p>
                )}
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-table-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <label htmlFor="edit-table-active" className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Active (Ready for guest orders)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-table-online"
                    checked={onlineBookingEnabled}
                    onChange={(e) => setOnlineBookingEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <label htmlFor="edit-table-online" className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Enable for Online Table Reservations
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border-strong)] text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE & PRINTABLE TENT CARD MODAL */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 print:hidden">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[var(--color-primary)]" />
                <h2
                  className="text-xl font-bold text-[var(--color-primary)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Table {qrModalTable.tableNumber} QR Code
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setQrModalTable(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Tent Card View */}
            <div
              id="printable-tent-card"
              className="mt-4 p-6 rounded-2xl border-2 border-[var(--color-primary)]/20 bg-linear-to-b from-[#FFFDF9] to-[var(--color-background)] text-center shadow-inner relative overflow-hidden"
            >
              {/* Decorative top badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold mb-2">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Pure Veg Dining & Banquet
              </div>

              <h3
                className="text-2xl font-bold text-[var(--color-primary)] tracking-wide"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Shree Kripa
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] font-medium">
                Family Restaurant & Banquet • Varanasi
              </p>

              {/* Table Number Display */}
              <div className="my-4 py-2 px-6 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] inline-block shadow-sm">
                <span className="text-xs uppercase tracking-widest text-[var(--color-accent-light)] font-bold block">
                  Dine-In Table
                </span>
                <span
                  className="text-3xl sm:text-4xl font-extrabold tracking-wider"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {qrModalTable.tableNumber}
                </span>
              </div>

              {/* QR Image */}
              <div className="w-48 h-48 mx-auto my-3 p-3 bg-white rounded-xl shadow-md border-2 border-[var(--color-accent)]/50 flex items-center justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for Table ${qrModalTable.tableNumber}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="animate-pulse text-xs text-gray-400">Generating QR...</div>
                )}
              </div>

              <p className="text-sm font-bold text-[var(--color-primary)]">
                Scan to View Menu & Order
              </p>
              <p className="text-xs font-medium text-[var(--color-text-muted)] mt-1 max-w-xs mx-auto">
                Point your phone camera at this QR code to view the live menu and place your order directly.
              </p>

              <div className="mt-4 pt-3 border-t border-dashed border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)] space-y-0.5">
                <p>📍 Akhari Bypass, Varanasi • 📞 9415268463 / 9125669366</p>
              </div>
            </div>

            {/* Test Link and Print Action */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--color-border)] print:hidden">
              <a
                href={`/menu?table=${qrModalTable.qrToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Test customer menu link
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Tent Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
