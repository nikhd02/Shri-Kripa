'use client';
/**
 * src/app/(admin)/dashboard/banquet/BanquetManagerClient.tsx
 * Interactive client component for managing banquet enquiries and follow-ups.
 */

import React, { useState, useTransition } from 'react';
import {
  Calendar,
  Users,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { updateBanquetStatusAction } from '@/server/actions/banquet';

export interface BanquetEnquiryDTO {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  eventType: string;
  eventDate: string;
  guestCount: number;
  message: string | null;
  status: 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'CLOSED';
  notes: string | null;
  createdAt: string;
}

interface BanquetManagerClientProps {
  initialEnquiries: BanquetEnquiryDTO[];
}

export function BanquetManagerClient({ initialEnquiries }: BanquetManagerClientProps) {
  const [isPending, startTransition] = useTransition();
  const [enquiries, setEnquiries] = useState<BanquetEnquiryDTO[]>(initialEnquiries);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filtered = enquiries.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone.includes(searchTerm) ||
      e.eventType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'CLOSED') => {
    startTransition(async () => {
      const res = await updateBanquetStatusAction(id, newStatus);
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        setFeedback({
          type: 'success',
          message: `Enquiry status updated to ${newStatus}.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to update enquiry status.',
        });
      }
    });
  };

  const getStatusBadgeVariant = (status: BanquetEnquiryDTO['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'CONTACTED':
        return 'warning';
      case 'NEW':
        return 'accent';
      case 'CLOSED':
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Banquet Enquiries
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Review, manage, and follow up with banquet and celebration bookings.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium flex-1">{feedback.message}</span>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="border-[var(--color-border)] shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by client name, phone, or event..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New Enquiries</option>
                <option value="CONTACTED">Contacted</option>
                <option value="CONFIRMED">Confirmed Bookings</option>
                <option value="CLOSED">Closed / Completed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enquiries List */}
      {filtered.length === 0 ? (
        <Card className="border-[var(--color-border)] p-12 text-center text-[var(--color-text-muted)]">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40 text-[var(--color-primary)]" />
          <p className="font-bold text-base text-[var(--color-text-primary)]">No banquet enquiries found</p>
          <p className="text-xs mt-1">Incoming banquet requests from the website will appear here.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="border-[var(--color-border)] shadow-xs hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-[var(--color-text-primary)]">{item.name}</h3>
                    <p className="text-xs font-semibold text-[var(--color-primary)] mt-0.5">{item.eventType}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>{new Date(item.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>{item.guestCount} Guests</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <a href={`tel:${item.phone}`} className="hover:underline font-medium text-[var(--color-text-primary)]">{item.phone}</a>
                  </div>
                  {item.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      <span className="truncate">{item.email}</span>
                    </div>
                  )}
                </div>

                {item.message && (
                  <div className="p-2.5 rounded-lg bg-[var(--color-muted)] text-xs text-[var(--color-text-primary)] leading-relaxed">
                    <p className="font-semibold text-[10px] text-[var(--color-text-muted)] uppercase mb-0.5">Notes / Message:</p>
                    {item.message}
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[var(--color-text-muted)]">Update Status:</span>
                  <select
                    value={item.status}
                    disabled={isPending}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                    className="px-2.5 py-1 text-xs font-bold rounded-md border border-[var(--color-border)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
