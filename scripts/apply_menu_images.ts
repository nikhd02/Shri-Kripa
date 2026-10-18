import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

const prisma = new PrismaClient();

const FORBIDDEN_WORDS = [
  'chicken',
  'meat',
  'beef',
  'pork',
  'fish',
  'prawn',
  'shrimp',
  'shrimps',
  'egg',
  'lula',
  'mutton',
  'non-veg',
  'nonveg',
  'seafood',
  'sandwich',
  'bacon',
  'ham',
];

function checkUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.request(
        parsed,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextLoc = res.headers.location;
            if (!nextLoc.startsWith('http')) {
              nextLoc = new URL(nextLoc, url).toString();
            }
            checkUrl(nextLoc).then(resolve);
            return;
          }
          const ct = res.headers['content-type'] || '';
          const ok = !!(res.statusCode && res.statusCode >= 200 && res.statusCode < 400 && (ct.startsWith('image/') || ct.includes('octet-stream')));
          resolve(ok);
          res.resume();
        }
      );
      req.on('error', () => resolve(false));
      req.setTimeout(8000, () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  console.log('🍽️ Applying strictly vetted Pure-Veg dish images to Database...\n');

  const rawMap: Record<string, string | null> = JSON.parse(
    fs.readFileSync('scripts/final_verified_menu_images.json', 'utf-8')
  );

  const cleanMap: Record<string, string | null> = {};
  let purgedCount = 0;

  for (const [dish, url] of Object.entries(rawMap)) {
    if (!url) {
      cleanMap[dish] = null;
      continue;
    }
    const lower = url.toLowerCase();
    const hasForbidden = FORBIDDEN_WORDS.some((word) => lower.includes(word));
    if (hasForbidden) {
      console.warn(`[PURGED NON-VEG / MISMATCH] ${dish}: ${url}`);
      cleanMap[dish] = null;
      purgedCount++;
    } else {
      cleanMap[dish] = url;
    }
  }

  console.log(`\nPurged ${purgedCount} non-veg / mismatch entries.`);

  // Connect to DB and fetch existing items
  const items = await prisma.menuItem.findMany({
    include: { category: true },
  });

  console.log(`Found ${items.length} items in DB.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    const targetUrl = cleanMap[item.name] || null;

    if (targetUrl) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { imageUrl: targetUrl },
      });
      updatedCount++;
      console.log(`✔ [${item.category.name}] ${item.name} -> Image saved!`);
    } else {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { imageUrl: null },
      });
      skippedCount++;
      console.log(`- [${item.category.name}] ${item.name} -> Clean icon placeholder (no wrong photo)`);
    }
  }

  console.log(`\n🎉 Database Update Complete:`);
  console.log(`- Total items: ${items.length}`);
  console.log(`- Dishes with exact verified photo: ${updatedCount}`);
  console.log(`- Dishes with clean brand placeholder: ${skippedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
