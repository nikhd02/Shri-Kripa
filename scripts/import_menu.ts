/**
 * scripts/import_menu.ts
 * Safely imports the verified complete original Shree Kripa Menu (135 items across 13 categories)
 * into the database while preserving existing records, IDs, and order integrity.
 */

import { PrismaClient, Prisma } from '@prisma/client';

const url =
  process.env.DATABASE_URL ||
  'mysql://jnetdslr_admin:Kripa%40123@neo.herosite.pro:3306/jnetdslr_shri_kripa?connect_timeout=30&sslmode=prefer';

const prisma = new PrismaClient({
  datasources: { db: { url } },
});

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[().,/&]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface MenuItemData {
  name: string;
  basePrice: number;
  description?: string;
  variants?: Array<{ name: string; priceModifier: number; isDefault?: boolean }>;
}

interface CategoryData {
  name: string;
  slug: string;
  displayOrder: number;
  items: MenuItemData[];
}

const MENU_DATA: CategoryData[] = [
  // 1. Salad & Papad
  {
    name: 'Salad & Papad',
    slug: 'salad-papad',
    displayOrder: 1,
    items: [
      { name: 'Green Salad', basePrice: 50 },
      { name: 'Papad Dry', basePrice: 10 },
      { name: 'Papad Fry', basePrice: 15 },
      { name: 'Papad Masala', basePrice: 30 },
      {
        name: 'Raita (Bondi/Veg.)',
        basePrice: 60,
        variants: [
          { name: 'Boondi Raita', priceModifier: 0, isDefault: true },
          { name: 'Veg Raita', priceModifier: 0, isDefault: false },
        ],
      },
    ],
  },

  // 2. Rice & Veg.
  {
    name: 'Rice & Veg.',
    slug: 'rice-veg',
    displayOrder: 2,
    items: [
      { name: 'Steam Rice', basePrice: 95 },
      { name: 'Jeera Rice', basePrice: 115 },
      { name: 'Peach Pulao', basePrice: 160, description: 'Traditional green peas pulao (printed as Peach Pulao in original menu)' },
      { name: 'Veg Pulao', basePrice: 150 },
      { name: 'Cheese Pulao', basePrice: 160 },
      { name: 'Veg. Biryani', basePrice: 170 },
      { name: 'Paneer Biryani', basePrice: 180 },
      { name: 'Kashmiri Pulao', basePrice: 185 },
      { name: 'Shahi Pulao', basePrice: 180 },
    ],
  },

  // 3. Indian Bread
  {
    name: 'Indian Bread',
    slug: 'indian-bread',
    displayOrder: 3,
    items: [
      { name: 'Roti', basePrice: 15 },
      { name: 'Butter Roti', basePrice: 20 },
      { name: 'Plain Naan', basePrice: 30 },
      { name: 'Butter Naan', basePrice: 35 },
      { name: 'Lachha Paratha', basePrice: 45 },
      { name: 'Stuff Naan', basePrice: 55 },
      { name: 'Stuff Kulcha', basePrice: 65 },
      { name: 'Garlic Naan', basePrice: 40 },
      { name: 'Kashmiri Naan', basePrice: 40 },
      { name: 'Paneer Kulcha', basePrice: 45 },
      { name: 'Tawa Roti (Butter)', basePrice: 20 },
      { name: 'Tawa Paratha', basePrice: 35 },
      { name: 'Aloo Paratha (With Curd), 2 pc', basePrice: 130 },
      { name: 'Paneer Paratha (With Curd), 2 pc', basePrice: 150 },
    ],
  },

  // 4. Dosa
  {
    name: 'Dosa',
    slug: 'dosa',
    displayOrder: 4,
    items: [
      { name: 'Masala Dosa', basePrice: 130 },
      { name: 'Paper Dosa', basePrice: 100 },
      { name: 'Paneer Dosa', basePrice: 160 },
      { name: 'Special Dosa', basePrice: 180 },
    ],
  },

  // 5. Main Course Veg.
  {
    name: 'Main Course Veg.',
    slug: 'main-course-veg',
    displayOrder: 5,
    items: [
      { name: 'Aloo Jira', basePrice: 130 },
      { name: 'Paneer Kadhai', basePrice: 260 },
      { name: 'Shahi Paneer (Sweet)', basePrice: 270 },
      { name: 'Shahi Kaju Paneer', basePrice: 280 },
      { name: 'Kaju Curry', basePrice: 300 },
      { name: 'Paneer Do Pyaza', basePrice: 260 },
      { name: 'Paneer Butter Masala', basePrice: 260 },
      { name: 'Paneer Tikka Masala', basePrice: 280 },
      { name: 'Paneer Tikka Lavabdaar', basePrice: 270 },
      { name: 'Paneer Handi', basePrice: 250 },
      { name: 'Aloo Dum Banarasi', basePrice: 170 },
      { name: 'Mushroom Masala', basePrice: 270 },
      { name: 'Mushroom Do Pyaza', basePrice: 290 },
      { name: 'Paneer Mushroom', basePrice: 300 },
      { name: 'Matar Mushroom', basePrice: 260 },
      { name: 'Matar Paneer', basePrice: 240 },
      { name: 'Palak Paneer', basePrice: 195 },
      { name: 'Malai Kofta (Sweet)', basePrice: 200 },
      { name: 'Veg. Kofta', basePrice: 180 },
      { name: 'Paneer Kofta', basePrice: 215 },
      { name: 'Paneer Methi Malai', basePrice: 250 },
      { name: 'Paneer Pasanda', basePrice: 220 },
      { name: 'Navratan Korma', basePrice: 210 },
      { name: 'Mix Veg. (Dry)', basePrice: 190 },
      { name: 'Veg Jhalfrezi (Dry)', basePrice: 175 },
      { name: 'Mushroom Jhalfrezi', basePrice: 175 },
      { name: 'Paneer Jhalfrezi (Dry)', basePrice: 175 },
      { name: 'Dal Fry', basePrice: 135 },
      { name: 'Dal Tadka', basePrice: 135 },
      { name: 'Dal Makhani', basePrice: 170 },
      { name: 'Paneer Lababdar', basePrice: 260 },
      { name: 'Paneer Bhujia', basePrice: 200 },
    ],
  },

  // 6. Veg. Soup
  {
    name: 'Veg. Soup',
    slug: 'veg-soup',
    displayOrder: 6,
    items: [
      { name: 'Tomato Soup', basePrice: 100 },
      { name: 'Veg. Hot & Sour Soup', basePrice: 110 },
      { name: 'Veg. Clear Soup', basePrice: 120 },
      { name: 'Veg. Manchow Soup', basePrice: 130 },
      { name: 'Lemon Coriander Soup', basePrice: 140 },
    ],
  },

  // 7. Starters
  {
    name: 'Starters',
    slug: 'starters',
    displayOrder: 7,
    items: [
      { name: 'Onion Pakoda', basePrice: 100 },
      { name: 'Veg. Pakoda', basePrice: 100 },
      { name: 'Paneer Pakoda', basePrice: 140 },
      { name: 'Finger Chips', basePrice: 140 },
      {
        name: 'Paneer Chilly (Dry/Gravy)',
        basePrice: 200,
        variants: [
          { name: 'Dry', priceModifier: 0, isDefault: true },
          { name: 'Gravy', priceModifier: 0, isDefault: false },
        ],
      },
      {
        name: 'Mashroom Chilly (Dry/Gravy)',
        basePrice: 195,
        variants: [
          { name: 'Dry', priceModifier: 0, isDefault: true },
          { name: 'Gravy', priceModifier: 0, isDefault: false },
        ],
      },
      { name: 'Baby Corn Crispy', basePrice: 170 },
      { name: 'Paneer 65', basePrice: 190 },
      { name: 'Veg. Seekh Kabab', basePrice: 190 },
      { name: 'Harabhara Kabab', basePrice: 180 },
      { name: 'Bhutta Kabab', basePrice: 210 },
      { name: 'American Chop suey', basePrice: 210 },
      { name: 'Masala Finger Chips', basePrice: 210 },
      { name: 'Corn Cheese Balls', basePrice: 160 },
      { name: 'Corn Tikka', basePrice: 150 },
      { name: 'Baby Corn Chilly', basePrice: 190 },
      { name: 'Garlic Paneer', basePrice: 190 },
      { name: 'Paneer Adraki', basePrice: 210 },
      { name: 'Veg. Soya Achari Tikka', basePrice: 220 },
      { name: 'Paneer Paper Tikka', basePrice: 220 },
      { name: 'Paneer Tikka', basePrice: 220 },
      { name: 'Paneer Hariyali Tikka', basePrice: 240 },
      { name: 'Paneer Malai Tikka', basePrice: 260 },
    ],
  },

  // 8. Pizza & Pasta
  {
    name: 'Pizza & Pasta',
    slug: 'pizza-pasta',
    displayOrder: 8,
    items: [
      { name: 'Veg. Cheese Pizza', basePrice: 130 },
      { name: 'Paneer Makhani Cheese Pizza', basePrice: 160 },
      { name: 'Shree Kripa Special Cheese Pizza', basePrice: 170 },
      { name: 'Farm Paradise Pizza', basePrice: 160 },
      { name: 'Cheese Macroni', basePrice: 90 },
      { name: 'Veg. Macroni', basePrice: 85 },
      { name: 'Paneer Macroni', basePrice: 85 },
      { name: 'Red Sous Pasta', basePrice: 170 },
      { name: 'White Sous Pasta', basePrice: 190 },
    ],
  },

  // 9. Burger
  {
    name: 'Burger',
    slug: 'burger',
    displayOrder: 9,
    items: [
      { name: 'Burger', basePrice: 80 },
      { name: 'Cheese Burger', basePrice: 110 },
      { name: 'Paneer Burger', basePrice: 100 },
    ],
  },

  // 10. Chinese
  {
    name: 'Chinese',
    slug: 'chinese',
    displayOrder: 10,
    items: [
      { name: 'Veg. Roll', basePrice: 70 },
      { name: 'Veg. Paneer Roll', basePrice: 110 },
      { name: 'Veg. Chowmein', basePrice: 130 },
      { name: 'Paneer Chowmein', basePrice: 150 },
      { name: 'Mix Chowmein Veg', basePrice: 180 },
      { name: 'Veg. Schezwan Chowmein', basePrice: 180 },
      { name: 'Veg. Schezwan Rice', basePrice: 140 },
      { name: 'Veg. Fried Rice', basePrice: 140 },
      { name: 'Mix Fried Rice', basePrice: 190 },
      { name: 'Veg. Chopsuey', basePrice: 130 },
      { name: 'Potato Chill (Dry)', basePrice: 130 },
      { name: 'Veg. Manchurian', basePrice: 160 },
      { name: 'Paneer Manchurian', basePrice: 180 },
      { name: 'Paneer Fried Rice', basePrice: 170 },
      { name: 'Spring Roll', basePrice: 140 },
    ],
  },

  // 11. Drinks & Beverages
  {
    name: 'Drinks & Beverages',
    slug: 'drinks-beverages',
    displayOrder: 11,
    items: [
      { name: 'Tea', basePrice: 40 },
      { name: 'Coffee', basePrice: 50 },
      { name: 'Cold Coffee', basePrice: 70 },
      { name: 'Banana Shake', basePrice: 50 },
      { name: 'Cold Drinks Glass', basePrice: 30 },
      { name: 'Mineral Water', basePrice: 25 },
      { name: 'Cold Drink Can', basePrice: 50 },
      { name: 'Lassi', basePrice: 50 },
      { name: 'Milk Shake', basePrice: 50 },
      { name: 'Cold Coffee With Ice Cream', basePrice: 110 },
    ],
  },

  // 12. Thali (Veg.)
  {
    name: 'Thali (Veg.)',
    slug: 'thali-veg',
    displayOrder: 12,
    items: [
      {
        name: 'Normal Thali',
        basePrice: 110,
        description: '2 pc Roti, Rice, Dal, Mix Veg, Papad, Salad.',
      },
      {
        name: 'Kripa Special Thali',
        basePrice: 270,
        description:
          '1 pc Butter Nan, 1 pc Lachha Paratha, Jeera Rice, Paneer Ki Sabzi, Dal, Mix Veg, Papad, Salad, Achar, Ice-cream.',
      },
    ],
  },

  // 13. Dessert
  {
    name: 'Dessert',
    slug: 'dessert',
    displayOrder: 13,
    items: [
      { name: 'Sizzling Brownie', basePrice: 150 },
      { name: 'Gulab Jamun', basePrice: 30 },
      { name: 'Rasgulla', basePrice: 30 },
      { name: 'Cham Cham', basePrice: 55 },
    ],
  },
];

async function main() {
  console.log('🍽️ Starting Shree Kripa Menu Import...\n');

  // Verify before-counts
  const initialCategoryCount = await prisma.category.count();
  const initialItemCount = await prisma.menuItem.count();
  const initialOrderCount = await prisma.order.count();
  const initialUserCount = await prisma.user.count();

  console.log(`Initial DB State:`);
  console.log(`- Categories: ${initialCategoryCount}`);
  console.log(`- Menu Items: ${initialItemCount}`);
  console.log(`- Orders    : ${initialOrderCount}`);
  console.log(`- Users     : ${initialUserCount}\n`);

  let totalCategoriesCreated = 0;
  let totalCategoriesUpdated = 0;
  let totalItemsCreated = 0;
  let totalItemsUpdated = 0;
  let totalVariantsCreated = 0;

  // Process categories
  for (const catData of MENU_DATA) {
    // Check if category exists by slug or name (handling case where existing category was 'Starter' or 'starters')
    let category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: catData.slug },
          { name: catData.name },
          // Special match for existing 'Starter' / 'starter'
          ...(catData.slug === 'starters' ? [{ slug: 'starter' }, { name: 'Starter' }] : []),
        ],
      },
    });

    if (category) {
      category = await prisma.category.update({
        where: { id: category.id },
        data: {
          name: catData.name,
          slug: catData.slug,
          displayOrder: catData.displayOrder,
          active: true, // activate so it shows on public menu
        },
      });
      totalCategoriesUpdated++;
    } else {
      category = await prisma.category.create({
        data: {
          name: catData.name,
          slug: catData.slug,
          displayOrder: catData.displayOrder,
          active: true,
        },
      });
      totalCategoriesCreated++;
    }

    // Process items in this category
    let itemOrder = 1;
    for (const itemData of catData.items) {
      const slug = generateSlug(itemData.name);

      // Check if item already exists by name or slug
      const existingItem = await prisma.menuItem.findFirst({
        where: {
          OR: [{ name: itemData.name }, { slug }],
        },
        include: { variants: true },
      });

      let menuItemId: string;

      if (existingItem) {
        // Update existing item while preserving its primary key ID!
        await prisma.menuItem.update({
          where: { id: existingItem.id },
          data: {
            name: itemData.name,
            slug,
            categoryId: category.id,
            basePrice: new Prisma.Decimal(itemData.basePrice),
            description: itemData.description || null,
            isVeg: true,
            isPublished: true,
            isAvailable: true,
            displayOrder: itemOrder,
          },
        });
        menuItemId = existingItem.id;
        totalItemsUpdated++;
      } else {
        // Create new item
        const newItem = await prisma.menuItem.create({
          data: {
            name: itemData.name,
            slug,
            categoryId: category.id,
            basePrice: new Prisma.Decimal(itemData.basePrice),
            description: itemData.description || null,
            isVeg: true,
            isPublished: true,
            isAvailable: true,
            displayOrder: itemOrder,
          },
        });
        menuItemId = newItem.id;
        totalItemsCreated++;
      }

      // Handle variants if any
      if (itemData.variants && itemData.variants.length > 0) {
        for (const vData of itemData.variants) {
          const existingVariant = await prisma.menuVariant.findFirst({
            where: {
              menuItemId,
              name: vData.name,
            },
          });

          if (!existingVariant) {
            await prisma.menuVariant.create({
              data: {
                menuItemId,
                name: vData.name,
                priceModifier: new Prisma.Decimal(vData.priceModifier),
                isDefault: vData.isDefault ?? false,
                isAvailable: true,
              },
            });
            totalVariantsCreated++;
          }
        }
      }

      itemOrder++;
    }
  }

  // Final verification counts
  const finalCategoryCount = await prisma.category.count();
  const finalActiveCategoryCount = await prisma.category.count({ where: { active: true } });
  const finalItemCount = await prisma.menuItem.count();
  const finalPublishedItemCount = await prisma.menuItem.count({ where: { isPublished: true } });
  const finalOrderCount = await prisma.order.count();
  const finalUserCount = await prisma.user.count();

  console.log(`\n========================================`);
  console.log(`🎉 MENU IMPORT COMPLETED SUCCESSFULLY`);
  console.log(`========================================`);
  console.log(`Categories:`);
  console.log(`  - Total in DB: ${finalCategoryCount} (Active: ${finalActiveCategoryCount})`);
  console.log(`  - Created: ${totalCategoriesCreated}, Updated: ${totalCategoriesUpdated}`);
  console.log(`Items:`);
  console.log(`  - Total in DB: ${finalItemCount} (Published: ${finalPublishedItemCount})`);
  console.log(`  - Created: ${totalItemsCreated}, Updated: ${totalItemsUpdated}`);
  console.log(`  - Variants Created: ${totalVariantsCreated}`);
  console.log(`Integrity Verification:`);
  console.log(`  - Orders intact: ${finalOrderCount === initialOrderCount} (${finalOrderCount} orders)`);
  console.log(`  - Users intact : ${finalUserCount === initialUserCount} (${finalUserCount} users)`);
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
