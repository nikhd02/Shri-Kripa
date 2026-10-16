/**
 * src/app/(admin)/dashboard/menu/MenuListClient.tsx
 * Interactive client component for browsing, filtering, status toggling, and deleting menu items.
 */

'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Eye,
  EyeOff,
  X,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCurrency } from '@/lib/utils';
import {
  toggleMenuItemAvailabilityAction,
  toggleMenuItemPublishedAction,
  deleteMenuItemAction,
} from '@/server/actions/menu';

import { MenuItemDTO } from '@/lib/dto/menu';

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export type MenuItemWithRelations = MenuItemDTO;


interface MenuListClientProps {
  initialItems: MenuItemWithRelations[];
  categories: CategorySummary[];
}

export function MenuListClient({ initialItems, categories }: MenuListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [items, setItems] = useState<MenuItemWithRelations[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Delete Dialog
  const [deletingItem, setDeletingItem] = useState<MenuItemWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state if props change (React recommended in-render adjustment)
  const [prevInitial, setPrevInitial] = useState(initialItems);
  if (prevInitial !== initialItems) {
    setPrevInitial(initialItems);
    setItems(initialItems);
  }

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category.id !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'PUBLISHED' && !item.isPublished) return false;
      if (statusFilter === 'DRAFT' && item.isPublished) return false;
      if (statusFilter === 'AVAILABLE' && !item.isAvailable) return false;
      if (statusFilter === 'UNAVAILABLE' && item.isAvailable) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesSlug = item.slug.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) ?? false;
        const matchesCategory = item.category.name.toLowerCase().includes(query);
        return matchesName || matchesSlug || matchesDesc || matchesCategory;
      }

      return true;
    });
  }, [items, selectedCategory, statusFilter, searchQuery]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Quick Toggle Availability
  const handleToggleAvailability = async (item: MenuItemWithRelations) => {
    setFeedback(null);
    const newStatus = !item.isAvailable;

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: newStatus } : i))
    );

    startTransition(async () => {
      const res = await toggleMenuItemAvailabilityAction(item.id, newStatus);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Failed to update availability.' });
        router.refresh();
      } else {
        setFeedback({
          type: 'success',
          message: `"${item.name}" marked as ${newStatus ? 'Available' : 'Unavailable'}.`,
        });
        router.refresh();
      }
    });
  };

  // Quick Toggle Published
  const handleTogglePublished = async (item: MenuItemWithRelations) => {
    setFeedback(null);
    const newStatus = !item.isPublished;

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isPublished: newStatus } : i))
    );

    startTransition(async () => {
      const res = await toggleMenuItemPublishedAction(item.id, newStatus);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Failed to update publication status.' });
        router.refresh();
      } else {
        setFeedback({
          type: 'success',
          message: `"${item.name}" is now ${newStatus ? 'Published to the live menu' : 'saved as Draft'}.`,
        });
        router.refresh();
      }
    });
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    setFeedback(null);

    const res = await deleteMenuItemAction(deletingItem.id);
    setIsDeleting(false);
    setDeletingItem(null);

    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to delete menu item.' });
    } else {
      setFeedback({ type: 'success', message: `Dish "${deletingItem.name}" was deleted.` });
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/20'
              : 'bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error)]/20'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="opacity-70 hover:opacity-100 p-1"
            aria-label="Dismiss feedback"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Bar & Summary Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text-primary)]">
            Total Dishes: {items.length}
          </span>
          <span>•</span>
          <span className="text-[var(--color-success)] font-medium">
            Published: {items.filter((i) => i.isPublished).length}
          </span>
          <span>•</span>
          <span className="text-[var(--color-warning)] font-medium">
            Drafts: {items.filter((i) => !i.isPublished).length}
          </span>
          <span>•</span>
          <span className="text-[var(--color-error)] font-medium">
            Out of Stock: {items.filter((i) => !i.isAvailable).length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="md">
            <Link href="/dashboard/categories">
              <Layers className="w-4 h-4" />
              Manage Categories
            </Link>
          </Button>
          <Button asChild variant="accent" size="md">
            <Link href="/dashboard/menu/new">
              <Plus className="w-4 h-4" />
              Add Menu Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search dishes by name, slug, or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full pl-9 pr-4 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Drafts Only</option>
              <option value="AVAILABLE">Available Only</option>
              <option value="UNAVAILABLE">Unavailable Only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Items Table / List */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-[var(--color-text-muted)]/50 mb-3" />
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            No dishes found
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
            {items.length === 0
              ? 'No menu items have been added to the restaurant menu yet.'
              : 'Try adjusting your search query or category/status filters.'}
          </p>
          <div className="mt-4">
            <Button asChild variant="accent" size="sm">
              <Link href="/dashboard/menu/new">
                <Plus className="w-4 h-4" />
                Add First Menu Item
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] border-b-2 border-[var(--color-border-strong)]">
            <div className="col-span-4">Dish & Details</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Price & Variants</div>
            <div className="col-span-2 text-center">Publication & Stock</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {paginatedItems.map((item) => {
            const price = parseFloat(item.basePrice.toString());
            return (
              <Card
                key={item.id}
                className={`transition-all duration-150 hover:shadow-[var(--shadow-sm)] ${
                  !item.isPublished ? 'bg-amber-50/40 border-amber-300' : 'bg-white border-[var(--color-border)]'
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 items-start lg:items-center">
                    {/* Dish & Details */}
                    <div className="lg:col-span-4 flex items-start gap-3 min-w-0">
                      {/* Veg indicator badge */}
                      <span
                        className="w-4 h-4 mt-0.5 rounded border border-green-600 flex items-center justify-center flex-shrink-0"
                        title="Pure Vegetarian"
                      >
                        <span className="w-2 h-2 rounded-full bg-green-600 inline-block" />
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[var(--color-text-primary)] text-sm sm:text-base">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-xs font-mono font-medium text-[var(--color-text-muted)] mt-0.5">
                          /{item.slug}
                        </p>
                        {item.description && (
                          <p className="text-xs font-medium text-[var(--color-text-secondary)] mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="lg:col-span-2">
                      <span className="text-xs font-semibold text-[var(--color-text-muted)] lg:hidden mr-2">Category:</span>
                      <Badge variant="outline" className="text-xs font-bold">
                        {item.category.name}
                      </Badge>
                    </div>

                    {/* Price & Variants */}
                    <div className="lg:col-span-2">
                      <div className="font-bold text-base text-[var(--color-primary)]">
                        {formatCurrency(price)}
                      </div>
                      {item.variants.length > 0 && (
                        <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-0.5">
                          +{item.variants.length} portion size(s)
                        </p>
                      )}
                      {item.addOns.length > 0 && (
                        <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                          +{item.addOns.length} add-on(s)
                        </p>
                      )}
                    </div>

                    {/* Publication & Stock Toggles */}
                    <div className="lg:col-span-2 flex flex-wrap lg:flex-col lg:items-center gap-2">
                      {/* Publication Status */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(item)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                          item.isPublished
                            ? 'bg-green-100 text-green-900 border-green-300 hover:bg-green-200'
                            : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        }`}
                        title={item.isPublished ? 'Click to make Draft' : 'Click to Publish on menu'}
                      >
                        {item.isPublished ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-green-700" /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-700" /> Draft
                          </>
                        )}
                      </button>

                      {/* Availability Status */}
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                          item.isAvailable
                            ? 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200'
                            : 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200'
                        }`}
                        title={item.isAvailable ? 'Click to mark Out of Stock' : 'Click to mark In Stock'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.isAvailable ? 'bg-blue-700' : 'bg-red-700'
                          }`}
                        />
                        {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-2 flex items-center justify-end gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--color-border)]">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/menu/${item.id}/edit`}>
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setDeletingItem(item)}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)] text-sm">
              <span className="text-[var(--color-text-muted)] text-xs">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} items
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-medium px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        title="Delete Menu Item"
        description={
          deletingItem
            ? `Are you sure you want to delete "${deletingItem.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Item"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
