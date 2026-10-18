'use client';
/**
 * src/app/(admin)/dashboard/staff/StaffManagerClient.tsx
 * Interactive client component for staff management.
 */

import React, { useState, useTransition } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Power,
  Shield,
  KeyRound,
  X,
  Mail,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  createStaffAction,
  updateStaffAction,
  toggleStaffStatusAction,
  deleteStaffAction,
  type StaffDTO,
} from '@/server/actions/staff';

interface StaffManagerClientProps {
  initialStaff: StaffDTO[];
  currentUserId: string;
}

const ROLES = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'KITCHEN', label: 'Kitchen' },
] as const;

export function StaffManagerClient({
  initialStaff,
  currentUserId,
}: StaffManagerClientProps) {
  const [isPending, startTransition] = useTransition();
  const [staffList, setStaffList] = useState<StaffDTO[]>(initialStaff);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync if props update
  const [prevInitial, setPrevInitial] = useState(initialStaff);
  if (prevInitial !== initialStaff) {
    setPrevInitial(initialStaff);
    setStaffList(initialStaff);
  }

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'ADMIN' | 'MANAGER' | 'STAFF' | 'KITCHEN'>('STAFF');
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string[]>>({});

  // Edit Modal State
  const [editingStaff, setEditingStaff] = useState<StaffDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'MANAGER' | 'STAFF' | 'KITCHEN'>('STAFF');
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string[]>>({});

  // Delete & Status Dialogs
  const [deletingStaff, setDeletingStaff] = useState<StaffDTO | null>(null);
  const [togglingStaff, setTogglingStaff] = useState<{ staff: StaffDTO; newStatus: boolean } | null>(null);

  // Filtered staff
  const filteredStaff = staffList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || item.role === roleFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && item.active) ||
      (statusFilter === 'INACTIVE' && !item.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenCreate = () => {
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('STAFF');
    setCreateFieldErrors({});
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFieldErrors({});
    setFeedback(null);

    startTransition(async () => {
      const res = await createStaffAction({
        name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole,
      });

      if (res.success && res.data) {
        setStaffList((prev) => [res.data!.user, ...prev]);
        setIsCreateOpen(false);
        setFeedback({
          type: 'success',
          message: `Staff account for ${createName} created successfully!`,
        });
      } else {
        if (res.fieldErrors) {
          setCreateFieldErrors(res.fieldErrors);
        } else if (res.error) {
          setFeedback({ type: 'error', message: res.error });
        }
      }
    });
  };

  const handleOpenEdit = (staff: StaffDTO) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditEmail(staff.email);
    setEditRole(staff.role);
    setEditActive(staff.active);
    setEditPassword('');
    setEditFieldErrors({});
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditFieldErrors({});
    setFeedback(null);

    startTransition(async () => {
      const payload: Record<string, any> = {
        id: editingStaff.id,
        name: editName,
        email: editEmail,
        role: editRole,
        active: editActive,
      };

      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await updateStaffAction(payload);

      if (res.success && res.data) {
        setStaffList((prev) =>
          prev.map((item) => (item.id === res.data!.user.id ? res.data!.user : item))
        );
        setEditingStaff(null);
        setFeedback({
          type: 'success',
          message: `Staff details for ${editName} updated successfully!`,
        });
      } else {
        if (res.fieldErrors) {
          setEditFieldErrors(res.fieldErrors);
        } else if (res.error) {
          setFeedback({ type: 'error', message: res.error });
        }
      }
    });
  };

  const handleConfirmToggle = () => {
    if (!togglingStaff) return;
    const { staff, newStatus } = togglingStaff;

    startTransition(async () => {
      const res = await toggleStaffStatusAction(staff.id, newStatus);
      if (res.success) {
        setStaffList((prev) =>
          prev.map((item) => (item.id === staff.id ? { ...item, active: newStatus } : item))
        );
        setFeedback({
          type: 'success',
          message: `${staff.name}'s account has been ${newStatus ? 'activated' : 'deactivated'}.`,
        });
      } else if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      }
      setTogglingStaff(null);
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingStaff) return;
    const staff = deletingStaff;

    startTransition(async () => {
      const res = await deleteStaffAction(staff.id);
      if (res.success) {
        setStaffList((prev) => prev.filter((item) => item.id !== staff.id));
        setFeedback({
          type: 'success',
          message: `Staff account for ${staff.name} deleted.`,
        });
      } else if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      }
      setDeletingStaff(null);
    });
  };

  const getRoleBadgeVariant = (role: StaffDTO['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'accent';
      case 'MANAGER':
        return 'warning';
      case 'KITCHEN':
        return 'success';
      case 'STAFF':
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Staff Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage authorized staff accounts, role-based access, and operational credentials.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          size="md"
          className="gap-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] self-start sm:self-auto cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
          role="alert"
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          )}
          <div className="flex-1 text-sm font-medium">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters and search card */}
      <Card className="border-[var(--color-border)] shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name or email..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Accounts Only</option>
                <option value="INACTIVE">Deactivated Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="border-[var(--color-border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)] text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Employee</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 hidden md:table-cell">Created Date</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-sm">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--color-text-muted)]">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-base">No staff members found</p>
                    <p className="text-xs mt-1">Try adjusting your search criteria or create a new account.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isSelf = staff.id === currentUserId;
                  const dateStr = new Date(staff.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[var(--color-text-primary)] truncate">
                                {staff.name}
                              </p>
                              {isSelf && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-sm">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{staff.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <Badge variant={getRoleBadgeVariant(staff.role)}>
                          {staff.role}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            staff.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              staff.active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {staff.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-xs text-[var(--color-text-muted)]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(staff)}
                            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
                            title="Edit staff details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Toggle Active */}
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() =>
                              setTogglingStaff({
                                staff,
                                newStatus: !staff.active,
                              })
                            }
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed text-gray-400'
                                : staff.active
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={
                              isSelf
                                ? 'Cannot deactivate yourself'
                                : staff.active
                                ? 'Deactivate account'
                                : 'Activate account'
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeletingStaff(staff)}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed text-gray-400'
                                : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                            }`}
                            title={isSelf ? 'Cannot delete yourself' : 'Delete staff member'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-[var(--color-border)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Add New Staff Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              {/* Full Name */}
              <Input
                label="Full Name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                error={createFieldErrors.name?.[0]}
              />

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="e.g. rahul@shreekripa.in"
                required
                error={createFieldErrors.email?.[0]}
              />

              {/* Temporary Password */}
              <Input
                label="Password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Min. 8 chars (1 uppercase, 1 lowercase, 1 number)"
                required
                hint="Must contain at least 8 characters with upper, lower, and digit."
                error={createFieldErrors.password?.[0]}
              />

              {/* Role selection */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5 uppercase tracking-wider">
                  Assigned Role
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
                >
                  <option value="STAFF">Staff (Order Taking & Dining)</option>
                  <option value="KITCHEN">Kitchen (Kitchen Display & Prep)</option>
                  <option value="MANAGER">Manager (Menu, Tables, Orders & Reports)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
                {createFieldErrors.role?.[0] && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {createFieldErrors.role[0]}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isPending}
                  className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                >
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-[var(--color-border)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Edit Staff Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              {/* Full Name */}
              <Input
                label="Full Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                error={editFieldErrors.name?.[0]}
              />

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                error={editFieldErrors.email?.[0]}
              />

              {/* Role selection */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5 uppercase tracking-wider">
                  Assigned Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
                >
                  <option value="STAFF">Staff (Order Taking & Dining)</option>
                  <option value="KITCHEN">Kitchen (Kitchen Display & Prep)</option>
                  <option value="MANAGER">Manager (Menu, Tables, Orders & Reports)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
                {editFieldErrors.role?.[0] && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {editFieldErrors.role[0]}
                  </p>
                )}
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5 uppercase tracking-wider">
                  Account Status
                </label>
                <select
                  value={editActive ? 'true' : 'false'}
                  disabled={editingStaff.id === currentUserId}
                  onChange={(e) => setEditActive(e.target.value === 'true')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer disabled:opacity-50"
                >
                  <option value="true">Active</option>
                  <option value="false">Deactivated</option>
                </select>
                {editingStaff.id === currentUserId && (
                  <p className="mt-1 text-xs text-amber-600 font-medium">
                    You cannot change the status of your currently logged-in account.
                  </p>
                )}
              </div>

              {/* Optional Reset Password */}
              <Input
                label="Reset Password (Optional)"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
                hint="Only fill this if you want to set a new password."
                error={editFieldErrors.password?.[0]}
              />

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStaff(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isPending}
                  className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM TOGGLE STATUS DIALOG */}
      <ConfirmDialog
        isOpen={!!togglingStaff}
        title={togglingStaff?.newStatus ? 'Activate Staff Account?' : 'Deactivate Staff Account?'}
        description={`Are you sure you want to ${
          togglingStaff?.newStatus ? 'activate' : 'deactivate'
        } ${togglingStaff?.staff.name} (${togglingStaff?.staff.email})? ${
          !togglingStaff?.newStatus
            ? 'The user will immediately be barred from signing into the system.'
            : 'The user will regain login access to their assigned operational dashboard.'
        }`}
        confirmLabel={togglingStaff?.newStatus ? 'Activate' : 'Deactivate'}
        cancelLabel="Cancel"
        isLoading={isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setTogglingStaff(null)}
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingStaff}
        title="Delete Staff Account?"
        description={`Are you sure you want to permanently delete the staff account for ${deletingStaff?.name} (${deletingStaff?.email})? This action cannot be undone.`}
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        isLoading={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingStaff(null)}
      />
    </div>
  );
}
