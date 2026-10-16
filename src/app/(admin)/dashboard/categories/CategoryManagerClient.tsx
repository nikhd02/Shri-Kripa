/**
 * src/app/(admin)/dashboard/categories/CategoryManagerClient.tsx
 * Interactive client component for category CRUD, reordering, and status management.
 */

'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { slugify } from '@/lib/utils';
import {
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryActiveAction,
  deleteCategoryAction,
  reorderCategoriesAction,
} from '@/server/actions/categories';

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  active: boolean;
  _count: {
    menuItems: number;
  };
}

interface CategoryManagerClientProps {
  initialCategories: CategoryWithCount[];
}

export function CategoryManagerClient({ initialCategories }: CategoryManagerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [categories, setCategories] = useState<CategoryWithCount[]>(initialCategories);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);

  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSlugManual, setFormSlugManual] = useState(false);
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Delete dialog state
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state if props change (React recommended in-render adjustment)
  const [prevInitial, setPrevInitial] = useState(initialCategories);
  if (prevInitial !== initialCategories) {
    setPrevInitial(initialCategories);
    setCategories(initialCategories);
  }

  const openCreateForm = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormSlugManual(false);
    setFormDescription('');
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.displayOrder), 0);
    setFormDisplayOrder(maxOrder + 1);
    setFormActive(true);
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (cat: CategoryWithCount) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormSlugManual(true);
    setFormDescription(cat.description ?? '');
    setFormDisplayOrder(cat.displayOrder);
    setFormActive(cat.active);
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormName(val);
    if (!formSlugManual) {
      setFormSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormSlugManual(true);
    setFormSlug(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setFieldErrors({});

    const payload = {
      name: formName,
      slug: formSlug,
      description: formDescription.trim() || null,
      displayOrder: formDisplayOrder,
      active: formActive,
    };

    startTransition(async () => {
      if (editingCategory) {
        const res = await updateCategoryAction(editingCategory.id, payload);
        if (!res.success) {
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
          setFeedback({ type: 'error', message: res.error || 'Failed to update category.' });
          return;
        }
        setFeedback({ type: 'success', message: `Category "${formName}" updated successfully.` });
      } else {
        const res = await createCategoryAction(payload);
        if (!res.success) {
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
          setFeedback({ type: 'error', message: res.error || 'Failed to create category.' });
          return;
        }
        setFeedback({ type: 'success', message: `Category "${formName}" created successfully.` });
      }

      setIsFormOpen(false);
      router.refresh();
    });
  };

  const handleToggleActive = async (cat: CategoryWithCount) => {
    setFeedback(null);
    const newStatus = !cat.active;

    // Optimistic local update
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, active: newStatus } : c))
    );

    startTransition(async () => {
      const res = await toggleCategoryActiveAction(cat.id, newStatus);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Failed to update status.' });
        router.refresh();
      } else {
        setFeedback({
          type: 'success',
          message: `Category "${cat.name}" is now ${newStatus ? 'active' : 'inactive'}.`,
        });
        router.refresh();
      }
    });
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    setFeedback(null);
    const newCategories = [...categories];
    const current = newCategories[index];
    const target = newCategories[targetIndex];

    // Swap display orders
    const tempOrder = current.displayOrder;
    current.displayOrder = target.displayOrder === tempOrder ? target.displayOrder + (direction === 'up' ? -1 : 1) : target.displayOrder;
    target.displayOrder = tempOrder;

    newCategories[index] = target;
    newCategories[targetIndex] = current;
    setCategories(newCategories);

    startTransition(async () => {
      const res = await reorderCategoriesAction(
        newCategories.map((c, idx) => ({ id: c.id, displayOrder: idx + 1 }))
      );
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Failed to reorder categories.' });
        router.refresh();
      } else {
        setFeedback({ type: 'success', message: 'Category order updated.' });
        router.refresh();
      }
    });
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setFeedback(null);

    const res = await deleteCategoryAction(deletingCategory.id);
    setIsDeleting(false);
    setDeletingCategory(null);

    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to delete category.' });
    } else {
      setFeedback({ type: 'success', message: `Category "${deletingCategory.name}" was deleted.` });
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

      {/* Header with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-[var(--color-text-secondary)]">
          Total Categories: <span className="font-semibold text-[var(--color-text-primary)]">{categories.length}</span>
          {' • '}
          Active: <span className="font-semibold text-[var(--color-success)]">{categories.filter((c) => c.active).length}</span>
          {' • '}
          Inactive: <span className="font-semibold text-[var(--color-text-muted)]">{categories.filter((c) => !c.active).length}</span>
        </div>
        <Button onClick={openCreateForm} variant="accent" size="md">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderTree className="w-12 h-12 mx-auto text-[var(--color-text-muted)]/50 mb-3" />
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">No categories found</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
            Get started by adding your first restaurant menu category.
          </p>
          <Button onClick={openCreateForm} variant="accent" size="sm" className="mt-4">
            <Plus className="w-4 h-4" />
            Create Category
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {categories.map((cat, index) => (
            <Card
              key={cat.id}
              className={`transition-all duration-150 hover:shadow-[var(--shadow-md)] ${
                !cat.active ? 'opacity-70 bg-gray-50/50' : 'bg-white'
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  {/* Order Badge & Reorder controls */}
                  <div className="flex flex-col items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0 || isPending}
                      onClick={() => handleMoveOrder(index, 'up')}
                      className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-20 disabled:cursor-not-allowed rounded"
                      aria-label={`Move ${cat.name} up`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] w-5 text-center">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      disabled={index === categories.length - 1 || isPending}
                      onClick={() => handleMoveOrder(index, 'down')}
                      className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-20 disabled:cursor-not-allowed rounded"
                      aria-label={`Move ${cat.name} down`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Category Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[var(--color-text-primary)] text-base">
                        {cat.name}
                      </h3>
                      <Badge variant="outline" className="text-xs font-mono">
                        /{cat.slug}
                      </Badge>
                      <Badge variant={cat.active ? 'success' : 'secondary'}>
                        {cat.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-1">
                        {cat.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-secondary)]">
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--color-text-primary)]">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        {cat._count.menuItems} {cat._count.menuItems === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    type="button"
                    variant={cat.active ? 'outline' : 'accent'}
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggleActive(cat)}
                  >
                    {cat.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => openEditForm(cat)}
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending || cat._count.menuItems > 0}
                    onClick={() => setDeletingCategory(cat)}
                    title={
                      cat._count.menuItems > 0
                        ? 'Cannot delete category containing menu items'
                        : `Delete ${cat.name}`
                    }
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Form */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-[var(--color-border)] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <h2
                id="category-modal-title"
                className="text-lg font-bold text-[var(--color-text-primary)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-md"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Input
                label="Category Name"
                placeholder="e.g. Starters, Veg Soup, Thali (Veg)"
                value={formName}
                onChange={handleNameChange}
                required
                error={fieldErrors.name?.[0]}
                autoFocus
              />

              <Input
                label="Slug (URL identifier)"
                placeholder="e.g. starters, veg-soup"
                value={formSlug}
                onChange={handleSlugChange}
                required
                hint="Lowercase letters, numbers, and hyphens only."
                error={fieldErrors.slug?.[0]}
              />

              <Textarea
                label="Description (Optional)"
                placeholder="Brief description of dishes in this section..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                error={fieldErrors.description?.[0]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Display Order"
                  type="number"
                  min="0"
                  value={formDisplayOrder}
                  onChange={(e) => setFormDisplayOrder(parseInt(e.target.value, 10) || 0)}
                  error={fieldErrors.displayOrder?.[0]}
                />

                <div className="flex flex-col justify-end pb-1.5">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-accent)]"
                    />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      Active (visible on menu)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isPending}
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  size="md"
                  loading={isPending}
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        title="Delete Category"
        description={
          deletingCategory
            ? `Are you sure you want to delete the category "${deletingCategory.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Category"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
}
