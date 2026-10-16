/**
 * prisma/seed.ts
 * Seeds the database with:
 *   - An initial admin user (credentials from ADMIN_EMAIL and ADMIN_PASSWORD env vars)
 *   - Placeholder menu categories (all inactive — admin must review before activating)
 *   - One sample restaurant table for testing
 *
 * Run with: npm run db:seed
 *
 * SECURITY NOTES:
 *  - Admin credentials are read from environment variables, never hardcoded.
 *  - The seed script will abort if ADMIN_EMAIL or ADMIN_PASSWORD are not set.
 *  - This script does NOT print the admin password to stdout.
 *  - All seeded menu categories are inactive (isPublished: false) by default.
 */

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Validate required environment variables
// ---------------------------------------------------------------------------
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.error(
      `\n❌ SEED ABORTED: Required environment variable "${key}" is not set.\n` +
      `   Copy .env.example to .env and fill in all required values.\n`
    );
    process.exit(1);
  }
  return value.trim();
}

const ADMIN_EMAIL    = getRequiredEnv('ADMIN_EMAIL');
const ADMIN_PASSWORD = getRequiredEnv('ADMIN_PASSWORD');

if (ADMIN_PASSWORD.length < 10) {
  console.error('\n❌ SEED ABORTED: ADMIN_PASSWORD must be at least 10 characters.\n');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Menu categories — all inactive until admin reviews and enables them
// These match the restaurant's printed menu categories.
// Do NOT add individual menu items here — use the admin panel instead.
// ---------------------------------------------------------------------------
const PLACEHOLDER_CATEGORIES = [
  { name: 'Veg Soup',            slug: 'veg-soup',            displayOrder: 1  },
  { name: 'Starters',            slug: 'starters',            displayOrder: 2  },
  { name: 'Main Course Veg',     slug: 'main-course-veg',     displayOrder: 3  },
  { name: 'Salad & Papad',       slug: 'salad-papad',         displayOrder: 4  },
  { name: 'Rice & Veg',          slug: 'rice-veg',            displayOrder: 5  },
  { name: 'Indian Bread',        slug: 'indian-bread',        displayOrder: 6  },
  { name: 'Dosa',                slug: 'dosa',                displayOrder: 7  },
  { name: 'Pizza & Pasta',       slug: 'pizza-pasta',         displayOrder: 8  },
  { name: 'Burger',              slug: 'burger',              displayOrder: 9  },
  { name: 'Chinese',             slug: 'chinese',             displayOrder: 10 },
  { name: 'Drink & Beverages',   slug: 'drink-beverages',     displayOrder: 11 },
  { name: 'Thali (Veg)',         slug: 'thali-veg',           displayOrder: 12 },
  { name: 'Dessert',             slug: 'dessert',             displayOrder: 13 },
] as const;

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function main() {
  console.log('🌱 Starting database seed…\n');

  // 1. Admin user — upsert so re-running seed is safe
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where:  { email: ADMIN_EMAIL },
    update: {},   // Do NOT overwrite an existing admin account
    create: {
      name:         'Restaurant Admin',
      email:        ADMIN_EMAIL,
      passwordHash,
      role:         Role.ADMIN,
      active:       true,
    },
  });

  console.log(`✅ Admin user: ${admin.email} (role: ${admin.role})`);
  console.log(`   ⚠️  Change your password via the admin panel after first login.\n`);

  // 2. Menu categories — skip any that already exist
  let created = 0;
  let skipped = 0;

  for (const cat of PLACEHOLDER_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await prisma.category.create({
        data: { ...cat, active: false }, // inactive until admin reviews
      });
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`✅ Menu categories: ${created} created, ${skipped} already existed`);
  console.log(`   ℹ️  All categories are inactive. Enable them in the admin panel.\n`);

  // 3. Restaurant settings — tax rate 0 until admin configures
  const existingSettings = await prisma.restaurantSettings.findFirst();
  if (!existingSettings) {
    await prisma.restaurantSettings.create({
      data: {
        restaurantName: 'Shree Kripa Family Restaurant & Banquet',
        taxRate:        0,           // admin sets the actual GST rate
        taxLabel:       'GST',
        currency:       'INR',
        timezone:       'Asia/Kolkata',
      },
    });
    console.log('✅ Restaurant settings created (tax rate: 0% — set in admin panel)\n');
  } else {
    console.log('   Restaurant settings already exist, skipping.\n');
  }

  // 4. Sample table for development testing only
  const tableExists = await prisma.restaurantTable.findUnique({
    where: { tableNumber: 'T1' },
  });
  if (!tableExists) {
    const t = await prisma.restaurantTable.create({
      data: { tableNumber: 'T1', capacity: 4, isActive: true },
    });
    console.log(`✅ Sample table created: ${t.tableNumber} (capacity: ${t.capacity})\n`);
  } else {
    console.log('   Table T1 already exists, skipping.\n');
  }

  console.log('🎉 Seed complete.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
