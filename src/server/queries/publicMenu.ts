/**
 * src/server/queries/publicMenu.ts
 * Cached and resilient queries for the public customer menu.
 */

import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import type { PublicCategoryWithItems } from '@/app/(customer)/menu/PublicMenuClient';

export interface RestaurantSettingsDTO {
  taxRate: number;
  taxLabel: string;
  phone1: string;
  phone2: string;
  address: string;
  googleMapsUrl: string;
}

/**
 * Fetch and serialize public menu categories with all published items.
 * Wrapped in unstable_cache for sub-10ms response times.
 */
export const getCachedPublicMenuCategories = unstable_cache(
  async (): Promise<PublicCategoryWithItems[]> => {
    try {
      const activeCategories = await db.category.findMany({
        where: { active: true },
        orderBy: { displayOrder: 'asc' },
        include: {
          menuItems: {
            where: { isPublished: true },
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
            include: {
              variants: {
                where: { isAvailable: true },
                orderBy: { createdAt: 'asc' },
              },
              addOns: {
                where: { isAvailable: true },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      return activeCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        items: cat.menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          basePrice: item.basePrice.toString(),
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          isAvailable: item.isAvailable,
          displayOrder: item.displayOrder,
          variants: item.variants.map((v) => ({
            id: v.id,
            name: v.name,
            priceModifier: v.priceModifier.toString(),
            isDefault: v.isDefault,
            isAvailable: v.isAvailable,
          })),
          addOns: item.addOns.map((a) => ({
            id: a.id,
            name: a.name,
            price: a.price.toString(),
            isAvailable: a.isAvailable,
          })),
        })),
      }));
    } catch (error) {
      console.error('[getCachedPublicMenuCategories] Failed to query menu from database:', error);
      throw error;
    }
  },
  ['public-menu-categories-cache-key'],
  {
    revalidate: 60,
    tags: ['menu-data', 'categories', 'menu-items'],
  }
);

/**
 * Fetch restaurant settings with fallback defaults.
 */
export const getCachedRestaurantSettings = unstable_cache(
  async (): Promise<RestaurantSettingsDTO> => {
    const defaults: RestaurantSettingsDTO = {
      taxRate: 5,
      taxLabel: 'GST',
      phone1: '9415268463',
      phone2: '9125669366',
      address: 'Akhari Bypass, Near Flyover, Varanasi',
      googleMapsUrl: 'https://maps.app.goo.gl/LBiuC9hTsP3w3NdYA',
    };

    try {
      const settings = await db.restaurantSettings.findFirst();
      if (!settings) return defaults;

      return {
        taxRate: settings.taxRate ? Number(settings.taxRate) : defaults.taxRate,
        taxLabel: settings.taxLabel || defaults.taxLabel,
        phone1: settings.phone1 || defaults.phone1,
        phone2: settings.phone2 || defaults.phone2,
        address: settings.address || defaults.address,
        googleMapsUrl: settings.googleMapsUrl || defaults.googleMapsUrl,
      };
    } catch (error) {
      console.error('[getCachedRestaurantSettings] Failed to fetch settings:', error);
      return defaults;
    }
  },
  ['restaurant-settings-cache-key'],
  {
    revalidate: 300,
    tags: ['restaurant-settings'],
  }
);
