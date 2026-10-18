import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.restaurantSettings.findFirst();
  console.log('--- Current Settings ---');
  console.log(JSON.stringify(settings, null, 2));

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  console.log('--- Current Users (' + users.length + ') ---');
  console.log(JSON.stringify(users, null, 2));

  const ordersCount = await prisma.order.count();
  const completedOrdersCount = await prisma.order.count({ where: { status: 'COMPLETED' } });
  const enquiriesCount = await prisma.banquetEnquiry.count();
  console.log(`--- Stats: Orders: ${ordersCount}, Completed: ${completedOrdersCount}, Enquiries: ${enquiriesCount} ---`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
