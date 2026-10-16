/**
 * src/app/(customer)/menu/PublicMenuClient.tsx
 * Complete mobile-friendly public menu and QR table ordering client component.
 */

'use client';

import React, { useState, useMemo, useTransition } from 'react';
import {
  Search,
  UtensilsCrossed,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { placeOrderAction } from '@/server/actions/orders';

export interface PublicMenuVariant {
  id: string;
  name: string;
  priceModifier: number | string;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface PublicMenuAddOn {
  id: string;
  name: string;
  price: number | string;
  isAvailable: boolean;
}

export interface PublicMenuItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number | string;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  displayOrder: number;
  variants: PublicMenuVariant[];
  addOns: PublicMenuAddOn[];
}

export interface PublicCategoryWithItems {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  items: PublicMenuItem[];
}

export interface CartItem {
  cartItemId: string; // unique composite key for item + variant + addons
  menuItemId: string;
  name: string;
  basePrice: number;
  variantId: string | null;
  variantName: string | null;
  variantModifier: number;
  selectedAddOns: Array<{ id: string; name: string; price: number }>;
  unitPrice: number;
  quantity: number;
  specialInstructions: string;
}

interface PublicMenuClientProps {
  categories: PublicCategoryWithItems[];
  verifiedTable: {
    id: string;
    tableNumber: string;
    capacity: number;
    qrToken: string;
  } | null;
  isInvalidTableToken?: boolean;
  taxRate: number;
  taxLabel: string;
}

export function PublicMenuClient({
  categories,
  verifiedTable,
  isInvalidTableToken = false,
  taxRate = 0,
  taxLabel = 'GST',
}: PublicMenuClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('ALL');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customization Modal State
  const [customizingItem, setCustomizingItem] = useState<PublicMenuItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [itemSpecialInstructions, setItemSpecialInstructions] = useState('');
  const [modalQuantity, setModalQuantity] = useState(1);

  // Checkout State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting, startOrderTransition] = useTransition();

  // Order Success Modal State
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    total: string;
    tableNumber?: string;
  } | null>(null);

  // Filter categories and items based on search query
  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return categories
      .map((cat) => {
        const matchingItems = cat.items.filter((item) => {
          if (!query) return true;
          const matchName = item.name.toLowerCase().includes(query);
          const matchDesc = item.description?.toLowerCase().includes(query) ?? false;
          return matchName || matchDesc;
        });

        return {
          ...cat,
          items: matchingItems,
        };
      })
      .filter((cat) => {
        if (query) return cat.items.length > 0;
        return activeCategorySlug === 'ALL' || cat.slug === activeCategorySlug;
      });
  }, [categories, searchQuery, activeCategorySlug]);

  // Open Customization Modal
  const openCustomizationModal = (item: PublicMenuItem) => {
    setCustomizingItem(item);
    const defaultVariant = item.variants.find((v) => v.isDefault) || item.variants[0];
    setSelectedVariantId(defaultVariant ? defaultVariant.id : null);
    setSelectedAddOnIds([]);
    setItemSpecialInstructions('');
    setModalQuantity(1);
  };

  // Quick Add for items without variants or add-ons
  const handleQuickAdd = (item: PublicMenuItem) => {
    if (item.variants.length > 0 || item.addOns.length > 0) {
      openCustomizationModal(item);
      return;
    }

    const basePriceNum = parseFloat(item.basePrice.toString());
    const cartItemId = `${item.id}-default`;

    setCart((prev) => {
      const existing = prev.find((ci) => ci.cartItemId === cartItemId);
      if (existing) {
        return prev.map((ci) =>
          ci.cartItemId === cartItemId ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          menuItemId: item.id,
          name: item.name,
          basePrice: basePriceNum,
          variantId: null,
          variantName: null,
          variantModifier: 0,
          selectedAddOns: [],
          unitPrice: basePriceNum,
          quantity: 1,
          specialInstructions: '',
        },
      ];
    });
  };

  // Add customized item from modal to cart
  const handleAddCustomizedToCart = () => {
    if (!customizingItem) return;

    const basePriceNum = parseFloat(customizingItem.basePrice.toString());
    const selectedVariant = customizingItem.variants.find((v) => v.id === selectedVariantId);
    const variantModifier = selectedVariant ? parseFloat(selectedVariant.priceModifier.toString()) : 0;
    const variantName = selectedVariant ? selectedVariant.name : null;

    const chosenAddOns = customizingItem.addOns
      .filter((a) => selectedAddOnIds.includes(a.id))
      .map((a) => ({
        id: a.id,
        name: a.name,
        price: parseFloat(a.price.toString()),
      }));

    const unitPrice =
      basePriceNum +
      variantModifier +
      chosenAddOns.reduce((sum, ao) => sum + ao.price, 0);

    const sortedAddOnIds = [...selectedAddOnIds].sort().join(',');
    const cartItemId = `${customizingItem.id}-${selectedVariantId || 'none'}-${sortedAddOnIds}-${itemSpecialInstructions.trim()}`;

    setCart((prev) => {
      const existing = prev.find((ci) => ci.cartItemId === cartItemId);
      if (existing) {
        return prev.map((ci) =>
          ci.cartItemId === cartItemId
            ? { ...ci, quantity: ci.quantity + modalQuantity }
            : ci
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          menuItemId: customizingItem.id,
          name: customizingItem.name,
          basePrice: basePriceNum,
          variantId: selectedVariantId,
          variantName,
          variantModifier,
          selectedAddOns: chosenAddOns,
          unitPrice,
          quantity: modalQuantity,
          specialInstructions: itemSpecialInstructions.trim(),
        },
      ];
    });

    setCustomizingItem(null);
  };

  // Adjust item quantity in cart
  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  // Remove item completely
  const removeCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  // Cart Totals Calculation
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    if (taxRate <= 0) return 0;
    return Math.round(((cartSubtotal * taxRate) / 100) * 100) / 100;
  }, [cartSubtotal, taxRate]);

  const cartTotal = useMemo(() => {
    return cartSubtotal + cartTax;
  }, [cartSubtotal, cartTax]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Total count for specific item in cart
  const getItemCountInCart = (menuItemId: string) => {
    return cart
      .filter((ci) => ci.menuItemId === menuItemId)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  // Submit Order Action
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    setCheckoutError(null);

    // Generate random idempotency key for this submission attempt
    const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    startOrderTransition(async () => {
      const payload = {
        tableToken: verifiedTable?.qrToken || null,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        idempotencyKey,
        items: cart.map((ci) => ({
          menuItemId: ci.menuItemId,
          variantId: ci.variantId || undefined,
          addOnIds: ci.selectedAddOns.map((ao) => ao.id),
          quantity: ci.quantity,
          specialInstructions: ci.specialInstructions || undefined,
        })),
      };

      const res = await placeOrderAction(payload);

      if (res.success && res.data) {
        setConfirmedOrder({
          orderNumber: res.data.orderNumber,
          total: res.data.total,
          tableNumber: res.data.tableNumber || verifiedTable?.tableNumber,
        });
        setCart([]);
        setIsCartOpen(false);
      } else {
        setCheckoutError(res.error || 'Failed to place order. Please try again.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Verified Table Banner */}
      {verifiedTable && (
        <div className="p-4 rounded-xl bg-linear-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-md border border-[var(--color-accent)]/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-[var(--color-accent-light)] text-sm">
                T{verifiedTable.tableNumber}
              </span>
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base flex items-center gap-2">
                Ordering for Table {verifiedTable.tableNumber}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                  Dine-In Active
                </span>
              </p>
              <p className="text-xs text-white/70">
                Seating capacity: {verifiedTable.capacity} guests • Orders go directly to our kitchen
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invalid Table QR Banner */}
      {isInvalidTableToken && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Table QR not recognized</p>
            <p className="text-amber-700 mt-0.5">
              The scanned table QR code may have expired or is inactive. You can still browse our menu, and our staff will gladly take your order.
            </p>
          </div>
        </div>
      )}

      {/* 2. Search & Category Filters Bar */}
      <div className="sticky top-16 md:top-20 z-30 bg-[#FFFDF9]/95 backdrop-blur-md py-3 border-b border-[var(--color-border)] -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="space-y-3 max-w-5xl mx-auto">
          {/* Live Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-primary)]/50" />
            <input
              type="text"
              placeholder="Search dishes (e.g. Paneer Butter, Dal Makhani, Dosa, Soup)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Horizontal Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setActiveCategorySlug('ALL')}
              className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeCategorySlug === 'ALL'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40'
              }`}
            >
              All Dishes
            </button>
            {categories.map((cat) => {
              const isSelected = activeCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategorySlug(cat.slug);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40'
                  }`}
                >
                  {cat.name} ({cat.items.length})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Menu Categories & Dishes Grid */}
      {filteredCategories.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-[var(--color-border)] p-8 max-w-md mx-auto">
          <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-lg">No dishes found</h3>
          <p className="text-sm text-gray-500 mt-1">
            We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Try another delicious dish name!
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategorySlug('ALL');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold"
          >
            Show All Dishes
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredCategories.map((category) => (
            <section
              key={category.id}
              id={`cat-${category.slug}`}
              className="space-y-4 scroll-mt-36"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 pb-2.5 border-b-2 border-[var(--color-accent)]/30">
                <div className="w-2.5 h-6 rounded-full bg-[var(--color-accent)]" />
                <div>
                  <h2
                    className="text-xl sm:text-2xl font-bold text-[var(--color-primary)] tracking-wide"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
                      {category.description}
                    </p>
                  )}
                </div>
                <span className="ml-auto text-xs font-medium text-[var(--color-text-muted)]">
                  {category.items.length} {category.items.length === 1 ? 'dish' : 'dishes'}
                </span>
              </div>

              {/* Dishes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map((item) => {
                  const basePriceNum = parseFloat(item.basePrice.toString());
                  const countInCart = getItemCountInCart(item.id);
                  const hasCustomizations = item.variants.length > 0 || item.addOns.length > 0;

                  return (
                    <article
                      key={item.id}
                      className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border bg-white shadow-xs transition-all duration-200 hover:shadow-md ${
                        item.isAvailable
                          ? 'border-[var(--color-border)]'
                          : 'border-gray-200 opacity-75 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Dietary Indicator & Name */}
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-4 h-4 rounded border border-green-600 flex items-center justify-center flex-shrink-0"
                              title="100% Pure Vegetarian"
                            >
                              <span className="w-2 h-2 rounded-full bg-green-600 inline-block" />
                            </span>
                            <h3
                              className="font-bold text-base sm:text-lg text-[var(--color-text-primary)] leading-snug"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {item.name}
                            </h3>
                          </div>

                          {/* Description */}
                          {item.description && (
                            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1.5 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Image or Brand Placeholder */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[var(--color-muted)] flex-shrink-0 border border-[var(--color-border)] flex items-center justify-center relative">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-[var(--color-primary-dark)]/5 flex flex-col items-center justify-center text-[var(--color-accent)]">
                              <UtensilsCrossed className="w-6 h-6 stroke-[1.5]" />
                            </div>
                          )}

                          {countInCart > 0 && (
                            <div className="absolute top-1 right-1 bg-[var(--color-primary)] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                              {countInCart}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing and Action Footer */}
                      <div className="mt-4 pt-3 border-t border-[var(--color-border)]/60 flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base sm:text-lg font-bold text-[var(--color-primary)]">
                            {formatCurrency(basePriceNum)}
                          </span>
                          {item.variants.length > 0 && (
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              (Options)
                            </span>
                          )}
                        </div>

                        {item.isAvailable ? (
                          <div className="flex items-center gap-2">
                            {hasCustomizations ? (
                              <button
                                type="button"
                                onClick={() => openCustomizationModal(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white text-xs font-bold transition-all cursor-pointer border border-[var(--color-primary)]/20"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {countInCart > 0 ? `Add (${countInCart})` : 'Add +'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickAdd(item)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {countInCart > 0 ? `Add (${countInCart})` : 'Add'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                            Sold Out Today
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 4. DISH CUSTOMIZATION MODAL */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-gray-200 animate-in fade-in slide-in-from-bottom sm:zoom-in-95 duration-150 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3
                    className="text-xl font-bold text-[var(--color-primary)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {customizingItem.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Customize your portion size and extra toppings
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomizingItem(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Portion Sizes (Variants) */}
              {customizingItem.variants.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Portion Size *
                  </label>
                  <div className="space-y-2">
                    {customizingItem.variants.map((v) => {
                      const mod = parseFloat(v.priceModifier.toString());
                      const effectivePrice =
                        parseFloat(customizingItem.basePrice.toString()) + mod;
                      const isSelected = selectedVariantId === v.id;

                      return (
                        <label
                          key={v.id}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[var(--color-primary)] bg-[var(--color-muted)]/30 ring-1 ring-[var(--color-primary)]'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="itemVariant"
                              checked={isSelected}
                              onChange={() => setSelectedVariantId(v.id)}
                              className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                            />
                            <span className="font-medium text-sm text-gray-800">{v.name}</span>
                          </div>
                          <span className="text-sm font-bold text-[var(--color-primary)]">
                            {formatCurrency(effectivePrice)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {customizingItem.addOns.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Optional Add-Ons
                  </label>
                  <div className="space-y-2">
                    {customizingItem.addOns.map((ao) => {
                      const isChecked = selectedAddOnIds.includes(ao.id);
                      const priceNum = parseFloat(ao.price.toString());

                      return (
                        <label
                          key={ao.id}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAddOnIds((prev) => [...prev, ao.id]);
                                } else {
                                  setSelectedAddOnIds((prev) =>
                                    prev.filter((id) => id !== ao.id)
                                  );
                                }
                              }}
                              className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                            />
                            <span className="font-medium text-sm text-gray-800">{ao.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            +{formatCurrency(priceNum)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div className="mt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Cooking Notes / Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, Extra crispy, No onion / garlic"
                  value={itemSpecialInstructions}
                  onChange={(e) => setItemSpecialInstructions(e.target.value)}
                  maxLength={150}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              {/* Quantity Counter in Modal */}
              <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Quantity</span>
                <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                  <button
                    type="button"
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    disabled={modalQuantity <= 1}
                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-700 shadow-2xs hover:bg-gray-200 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-sm text-gray-800 min-w-[20px] text-center">
                    {modalQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity((q) => Math.min(20, q + 1))}
                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-700 shadow-2xs hover:bg-gray-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-3 border-t border-gray-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomizedToCart}
                className="flex-2 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm cursor-pointer"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FLOATING MOBILE CART BAR */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto animate-in slide-in-from-bottom duration-200">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full p-4 rounded-2xl bg-[var(--color-primary)] text-white shadow-xl hover:bg-[var(--color-primary-dark)] transition-all flex items-center justify-between gap-4 border border-[var(--color-accent)]/30 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-bold flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">
                  {totalCartCount} {totalCartCount === 1 ? 'Dish' : 'Dishes'} in Cart
                </p>
                <p className="text-xs text-[var(--color-accent-light)] font-medium">
                  {verifiedTable ? `Table ${verifiedTable.tableNumber}` : 'Dine-In / Counter'} • Total: {formatCurrency(cartTotal)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-sm bg-white/20 px-3.5 py-1.5 rounded-xl">
              View Order <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* 6. SLIDE-OVER CART DRAWER & CHECKOUT */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[var(--color-muted)]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className="font-bold text-lg text-[var(--color-primary)] leading-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Your Order Cart
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {verifiedTable
                      ? `Dining at Table ${verifiedTable.tableNumber}`
                      : 'Takeaway / Counter Order'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {checkoutError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-700">Your cart is empty</p>
                  <p className="text-xs text-gray-400 mt-1">Add items from the menu to place an order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="p-3.5 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-gray-800">{item.name}</p>
                          {item.variantName && (
                            <p className="text-xs font-semibold text-[var(--color-primary)]">
                              Size: {item.variantName}
                            </p>
                          )}
                          {item.selectedAddOns.length > 0 && (
                            <p className="text-[11px] text-gray-500">
                              + {item.selectedAddOns.map((a) => a.name).join(', ')}
                            </p>
                          )}
                          {item.specialInstructions && (
                            <p className="text-[11px] text-amber-700 italic">
                              &ldquo;{item.specialInstructions}&rdquo;
                            </p>
                          )}
                        </div>

                        <span className="font-bold text-sm text-[var(--color-primary)]">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>

                      {/* Quantity Controls & Delete */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-xs">
                        <span className="text-gray-400">
                          {formatCurrency(item.unitPrice)} each
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.cartItemId, -1)}
                            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-xs min-w-[16px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.cartItemId, 1)}
                            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.cartItemId)}
                            className="p-1 text-red-500 hover:text-red-700 ml-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Info Form */}
              {cart.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Contact & Kitchen Instructions
                  </p>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please bring water glasses first, extra spicy dal..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Bill Summary & Place Order */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-gray-200 bg-[var(--color-muted)]/20 space-y-3">
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(cartSubtotal)}
                    </span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between">
                      <span>{taxLabel} ({taxRate}%)</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(cartTax)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-[var(--color-primary)] pt-1 border-t border-gray-200">
                    <span>Total Amount</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Pay at counter or table after dining via <strong>Cash or UPI</strong>.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm hover:bg-[var(--color-primary-dark)] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Sending Order to Kitchen...' : `Place Order (${formatCurrency(cartTotal)})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. ORDER SUCCESS CONFIRMATION MODAL */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-800 mb-1">
                Order Received!
              </span>
              <h2
                className="text-2xl font-bold text-[var(--color-primary)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Sent to Kitchen
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Our chefs have received your order and are preparing your meal fresh.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-muted)]/50 border border-[var(--color-border)] text-left space-y-2 text-xs">
              <div className="flex justify-between pb-1.5 border-b border-gray-200">
                <span className="text-gray-500">Order Number</span>
                <span className="font-mono font-bold text-[var(--color-primary)] text-sm">
                  {confirmedOrder.orderNumber}
                </span>
              </div>
              {confirmedOrder.tableNumber && (
                <div className="flex justify-between pb-1.5 border-b border-gray-200">
                  <span className="text-gray-500">Dining Table</span>
                  <span className="font-bold text-gray-800">
                    Table {confirmedOrder.tableNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Total Payable</span>
                <span className="font-bold text-gray-800">
                  {formatCurrency(parseFloat(confirmedOrder.total))}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              Payment will be collected at counter or table upon completion (Cash / UPI).
            </p>

            <button
              type="button"
              onClick={() => setConfirmedOrder(null)}
              className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer"
            >
              Order More Items
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
