import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function testConnection(url: string, label: string) {
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    const count = await prisma.menuItem.count();
    console.log(`[${label}] Success! Item count: ${count}`);
    return prisma;
  } catch (err: any) {
    console.log(`[${label}] Failed: ${err.message}`);
    await prisma.$disconnect();
    return null;
  }
}

async function main() {
  const url1 = process.env.DATABASE_URL!;
  console.log('Testing .env DATABASE_URL...');
  let prisma = await testConnection(url1, '.env URL');

  if (!prisma) {
    const url2 = 'mysql://jnetdslr_admin:Kripa%40123@neo.herosite.pro:3306/jnetdslr_shri_kripa?connect_timeout=30&sslmode=prefer';
    console.log('Testing Kripa@123 URL...');
    prisma = await testConnection(url2, 'Kripa@123 URL');
  }

  if (prisma) {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
    });

    const byCat: Record<string, Array<{ id: string; name: string; slug: string; imageUrl: string | null }>> = {};
    for (const item of items) {
      if (!byCat[item.category.name]) {
        byCat[item.category.name] = [];
      }
      byCat[item.category.name].push({
        id: item.id,
        name: item.name,
        slug: item.slug,
        imageUrl: item.imageUrl,
      });
    }

    fs.writeFileSync('scripts/db_items_dump.json', JSON.stringify(byCat, null, 2), 'utf-8');
    console.log('Successfully wrote scripts/db_items_dump.json with', items.length, 'items');
    await prisma.$disconnect();
  }
}

main().catch(console.error);
