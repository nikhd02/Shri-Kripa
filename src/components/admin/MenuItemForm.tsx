/**
 * src/components/admin/MenuItemForm.tsx
 * Reusable form component for creating and editing menu items with variants and add-ons.
 */

'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { slugify, formatCurrency } from '@/lib/utils';
import { createMenuItemAction, updateMenuItemAction } from '@/server/actions/menu';

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface VariantData {
  id?: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface AddOnData {
  id?: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface InitialMenuItemData {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number | string | { toString(): string };
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  isPublished: boolean;
  displayOrder: number;
  variants: VariantData[];
  addOns: AddOnData[];
}

interface MenuItemFormProps {
  categories: CategoryOption[];
  initialData?: InitialMenuItemData;
}

export function MenuItemForm({ categories, initialData }: MenuItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!initialData;

  // Form State
  const [name, setName] = useState(initialData?.name ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [slugManual, setSlugManual] = useState(isEditing);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? (categories[0]?.id ?? ''));
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [basePrice, setBasePrice] = useState(
    initialData ? Number(initialData.basePrice).toString() : ''
  );
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? '');
  const [isVeg, setIsVeg] = useState(initialData?.isVeg ?? true);
  const [isAvailable, setIsAvailable] = useState(initialData?.isAvailable ?? true);
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? false);
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder ?? 0);

  // Dynamic Variants & AddOns
  const [variants, setVariants] = useState<VariantData[]>(initialData?.variants ?? []);
  const [addOns, setAddOns] = useState<AddOnData[]>(initialData?.addOns ?? []);

  // Validation & Feedback
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slugManual) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManual(true);
    setSlug(e.target.value);
  };

  // Variant Helpers
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: '',
        priceModifier: 0,
        isDefault: prev.length === 0,
        isAvailable: true,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = <K extends keyof VariantData>(
    index: number,
    key: K,
    value: VariantData[K]
  ) => {
    setVariants((prev) => {
      const updated = [...prev];
      if (key === 'isDefault' && value === true) {
        // Only one default variant allowed
        return updated.map((v, i) => ({
          ...v,
          isDefault: i === index,
        }));
      }
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  // AddOn Helpers
  const addAddOn = () => {
    setAddOns((prev) => [
      ...prev,
      {
        name: '',
        price: 0,
        isAvailable: true,
      },
    ]);
  };

  const removeAddOn = (index: number) => {
    setAddOns((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAddOn = <K extends keyof AddOnData>(
    index: number,
    key: K,
    value: AddOnData[K]
  ) => {
    setAddOns((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const numericPrice = parseFloat(basePrice);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setFieldErrors({ basePrice: ['Please enter a valid non-negative price in INR.'] });
      return;
    }

    const payload = {
      name,
      categoryId,
      slug,
      description: description.trim() || null,
      basePrice: numericPrice,
      imageUrl: imageUrl.trim() || null,
      isVeg,
      isAvailable,
      isPublished,
      displayOrder,
      variants,
      addOns,
    };

    startTransition(async () => {
      if (isEditing && initialData) {
        const res = await updateMenuItemAction(initialData.id, payload);
        if (!res.success) {
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
          setErrorMessage(res.error || 'Failed to update menu item.');
          return;
        }
      } else {
        const res = await createMenuItemAction(payload);
        if (!res.success) {
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
          setErrorMessage(res.error || 'Failed to create menu item.');
          return;
        }
      }

      router.push('/dashboard/menu');
      router.refresh();
    });
  };

  const parsedBasePrice = parseFloat(basePrice) || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl pb-16">
      {/* Top bar with back button and CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/menu">
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </Link>
          </Button>
          <h1
            className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {isEditing ? `Edit Dish: ${initialData.name}` : 'New Menu Item'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={isPending}
            onClick={() => router.push('/dashboard/menu')}
          >
            Cancel
          </Button>
          <Button type="submit" variant="accent" size="md" loading={isPending}>
            {isEditing ? 'Save Changes' : 'Create Item'}
          </Button>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          className="p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error)]/20 text-sm flex items-center gap-2.5"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Specify the dish title, category, price, and descriptive details for customer clarity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Item Name"
              placeholder="e.g. Paneer Butter Masala, Dal Makhani"
              value={name}
              onChange={handleNameChange}
              required
              error={fieldErrors.name?.[0]}
            />

            <div>
              <label
                htmlFor="category-select"
                className="text-sm font-medium text-[var(--color-text-primary)] block mb-1.5"
              >
                Category <span className="text-[var(--color-error)]">*</span>
              </label>
              <select
                id="category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId?.[0] && (
                <p className="text-xs text-[var(--color-error)] mt-1">
                  {fieldErrors.categoryId[0]}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Slug (URL identifier)"
              placeholder="e.g. paneer-butter-masala"
              value={slug}
              onChange={handleSlugChange}
              required
              hint="Lowercase letters, numbers, and hyphens."
              error={fieldErrors.slug?.[0]}
            />

            <div>
              <Input
                label="Base Price (INR ₹)"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 250"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
                error={fieldErrors.basePrice?.[0]}
              />
              {parsedBasePrice > 0 && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Formatted preview:{' '}
                  <span className="font-semibold text-[var(--color-accent-dark)]">
                    {formatCurrency(parsedBasePrice)}
                  </span>
                </p>
              )}
            </div>
          </div>

          <Textarea
            label="Description (Optional)"
            placeholder="Describe the dish ingredients, preparation style, or serving notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            error={fieldErrors.description?.[0]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Image URL (Optional)"
              type="url"
              placeholder="https://example.com/photos/dish.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              hint="Leave blank to display the tasteful brand placeholder."
              error={fieldErrors.imageUrl?.[0]}
            />

            <Input
              label="Display Order in Category"
              type="number"
              min="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
              hint="Lower numbers appear first."
              error={fieldErrors.displayOrder?.[0]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Status & Dietary Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Dietary & Visibility Controls</CardTitle>
          <CardDescription>
            Control publication state, instant kitchen availability, and vegetarian certification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vegetarian Toggle */}
            <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVeg}
                  onChange={(e) => setIsVeg(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[var(--color-success)] focus:ring-[var(--color-success)]"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-sm text-[var(--color-text-primary)]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] inline-block" />
                    Pure Vegetarian
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    100% vegetarian family restaurant standard.
                  </p>
                </div>
              </label>
            </div>

            {/* Availability Toggle */}
            <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <div>
                  <div className="font-medium text-sm text-[var(--color-text-primary)]">
                    In Stock / Available
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Uncheck to mark as &ldquo;Unavailable&rdquo; without removing it from menu.
                  </p>
                </div>
              </label>
            </div>

            {/* Publication Status Toggle */}
            <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                <div>
                  <div className="font-medium text-sm text-[var(--color-text-primary)]">
                    Published on Menu
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    When unchecked, item remains a Draft hidden from the public website.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Portion Sizes & Variants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Portion Sizes & Variants (Optional)</CardTitle>
            <CardDescription>
              Configure size options (e.g. Half, Full, Small, Large) with optional price adjustments.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="w-4 h-4" />
            Add Variant
          </Button>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] italic">
              No portion variants added. This item will use the single base price of {formatCurrency(parsedBasePrice)}.
            </p>
          ) : (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-gray-50/50"
                >
                  <div className="flex-1">
                    <Input
                      placeholder="Variant name (e.g. Half, Full)"
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-full sm:w-44">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price adjustment (+/- ₹)"
                      value={variant.priceModifier}
                      onChange={(e) =>
                        updateVariant(index, 'priceModifier', parseFloat(e.target.value) || 0)
                      }
                      hint={`Effective: ${formatCurrency(parsedBasePrice + variant.priceModifier)}`}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-text-secondary)]">
                      <input
                        type="radio"
                        name="defaultVariant"
                        checked={variant.isDefault}
                        onChange={() => updateVariant(index, 'isDefault', true)}
                      />
                      Default
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={variant.isAvailable}
                        onChange={(e) => updateVariant(index, 'isAvailable', e.target.checked)}
                      />
                      Available
                    </label>

                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-error)] rounded transition-colors"
                      aria-label="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Add-Ons & Extras */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Add-Ons & Extras (Optional)</CardTitle>
            <CardDescription>
              Optional additions customers can select (e.g. Extra Cheese, Butter, Raita).
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addAddOn}>
            <Plus className="w-4 h-4" />
            Add Add-On
          </Button>
        </CardHeader>
        <CardContent>
          {addOns.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] italic">
              No add-ons configured for this item.
            </p>
          ) : (
            <div className="space-y-3">
              {addOns.map((addon, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-gray-50/50"
                >
                  <div className="flex-1">
                    <Input
                      placeholder="Add-on name (e.g. Extra Butter, Papad)"
                      value={addon.name}
                      onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-full sm:w-44">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price (₹)"
                      value={addon.price}
                      onChange={(e) => updateAddOn(index, 'price', parseFloat(e.target.value) || 0)}
                      hint={formatCurrency(addon.price)}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={addon.isAvailable}
                        onChange={(e) => updateAddOn(index, 'isAvailable', e.target.checked)}
                      />
                      Available
                    </label>

                    <button
                      type="button"
                      onClick={() => removeAddOn(index)}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-error)] rounded transition-colors"
                      aria-label="Remove add-on"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isPending}
          onClick={() => router.push('/dashboard/menu')}
        >
          Cancel
        </Button>
        <Button type="submit" variant="accent" size="lg" loading={isPending}>
          {isEditing ? 'Save Changes' : 'Create Item'}
        </Button>
      </div>
    </form>
  );
}
