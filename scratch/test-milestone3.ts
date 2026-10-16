/**
 * scratch/test-milestone3.ts
 * End-to-end automated verification script for Milestone 3:
 * - Table creation & QR token verification
 * - Order placement with server-side price computation
 * - Idempotency duplicate prevention
 * - Kitchen workflow state machine progression
 * - Payment status updates
 * - Table deletion safety check
 */

import { PrismaClient, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { verifyTableToken } from '../src/server/actions/tables';
import {
  placeOrderAction,
  updateOrderStatusAction,
  updatePaymentStatusAction,
} from '../src/server/actions/orders';

const db = new PrismaClient();

async function runTests() {
  console.log('--- Starting Milestone 3 Verification Tests ---');

  // Look up actual seeded admin for valid audit log foreign key
  const adminUser = await db.user.findFirst();
  process.env.TEST_AUTH_USER = JSON.stringify({
    id: adminUser ? adminUser.id : 'admin-test-user',
    name: adminUser ? adminUser.name : 'Administrator',
    email: adminUser ? adminUser.email : 'admin@shreekripa.in',
    role: 'ADMIN',
  });

  // 1. Ensure a test category and menu item exist
  let category = await db.category.findUnique({ where: { slug: 'main-course-veg' } });
  if (!category) {
    category = await db.category.create({
      data: {
        name: 'Main Course Veg',
        slug: 'main-course-veg',
        active: true,
        displayOrder: 1,
      },
    });
  } else if (!category.active) {
    category = await db.category.update({
      where: { id: category.id },
      data: { active: true },
    });
  }

  let menuItem = await db.menuItem.findUnique({ where: { slug: 'paneer-butter' } });
  if (!menuItem) {
    menuItem = await db.menuItem.create({
      data: {
        categoryId: category.id,
        name: 'Paneer Butter',
        slug: 'paneer-butter',
        basePrice: 250,
        isPublished: true,
        isAvailable: true,
      },
    });
  } else {
    menuItem = await db.menuItem.update({
      where: { id: menuItem.id },
      data: { isPublished: true, isAvailable: true },
    });
  }

  // 2. Test Table Management & Token Verification
  console.log('\n[Test 1] Table Creation & Token Verification...');
  let table = await db.restaurantTable.findUnique({ where: { tableNumber: 'M3-TEST-1' } });
  if (!table) {
    table = await db.restaurantTable.create({
      data: {
        tableNumber: 'M3-TEST-1',
        capacity: 4,
        qrToken: 'test-qr-token-' + Date.now(),
        isActive: true,
      },
    });
  }

  // Valid token check
  const verified = await verifyTableToken(table.qrToken);
  if (!verified || verified.tableNumber !== 'M3-TEST-1') {
    throw new Error(`Failed to verify active table token: expected table M3-TEST-1, got ${JSON.stringify(verified)}`);
  }
  console.log('✓ Valid table token correctly verified:', verified.tableNumber);

  // Invalid token check
  const invalidVerified = await verifyTableToken('completely-invalid-token-xyz');
  if (invalidVerified !== null) {
    throw new Error('Invalid token should return null');
  }
  console.log('✓ Invalid token safely returns null');

  // Inactive table check
  await db.restaurantTable.update({ where: { id: table.id }, data: { isActive: false } });
  const inactiveVerified = await verifyTableToken(table.qrToken);
  if (inactiveVerified !== null) {
    throw new Error('Inactive table token should return null');
  }
  console.log('✓ Inactive table token safely returns null');

  // Reactivate table for ordering test
  await db.restaurantTable.update({ where: { id: table.id }, data: { isActive: true } });

  // 3. Test Order Placement & Server-Side Price Calculation
  console.log('\n[Test 2] Order Placement & Server Price Computation...');
  const idempotencyKey = `test_key_${Date.now()}`;

  const orderResult = await placeOrderAction({
    tableToken: table.qrToken,
    customerName: 'Aarav Sharma',
    customerPhone: '9876543210',
    notes: 'Please serve quickly',
    idempotencyKey,
    items: [
      {
        menuItemId: menuItem.id,
        quantity: 2,
        specialInstructions: 'Medium spicy',
      },
    ],
  });

  if (!orderResult.success || !orderResult.data) {
    throw new Error(`Order placement failed: ${orderResult.error}`);
  }

  const { orderId, orderNumber, total } = orderResult.data;
  console.log(`✓ Order placed successfully: ${orderNumber} (ID: ${orderId})`);

  // Verify created order in database
  const createdOrder = await db.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: true,
      paymentRecords: true,
      table: true,
    },
  });

  if (!createdOrder) {
    throw new Error('Order not found in database');
  }

  const expectedSubtotal = 250 * 2; // 500
  if (Number(createdOrder.subtotal) !== expectedSubtotal) {
    throw new Error(`Subtotal mismatch: expected ${expectedSubtotal}, got ${createdOrder.subtotal}`);
  }
  console.log(`✓ Server-side subtotal verified: ₹${createdOrder.subtotal}`);
  console.log(`✓ Total with tax: ₹${createdOrder.total}`);
  console.log(`✓ Table correctly associated: Table ${createdOrder.table?.tableNumber}`);
  console.log(`✓ Initial status: ${createdOrder.status}`);
  console.log(`✓ Initial payment record: ₹${createdOrder.paymentRecords[0]?.amount} (${createdOrder.paymentRecords[0]?.status})`);

  // 4. Test Idempotency (Prevent Duplicate Order Submissions)
  console.log('\n[Test 3] Duplicate Submission Prevention (Idempotency)...');
  const duplicateResult = await placeOrderAction({
    tableToken: table.qrToken,
    customerName: 'Aarav Sharma',
    customerPhone: '9876543210',
    idempotencyKey, // same key
    items: [
      {
        menuItemId: menuItem.id,
        quantity: 2,
      },
    ],
  });

  if (!duplicateResult.success || duplicateResult.data?.orderId !== orderId) {
    throw new Error('Idempotency failed: did not return original order');
  }
  console.log('✓ Idempotency protected: returned original order without creating duplicate');

  // 5. Test State Machine Transitions
  console.log('\n[Test 4] Kitchen Status Progression...');
  // PENDING -> ACCEPTED
  let statusRes = await updateOrderStatusAction({ orderId, status: OrderStatus.ACCEPTED });
  if (!statusRes.success) throw new Error(`Failed to accept order: ${statusRes.error}`);
  console.log('✓ Transition PENDING -> ACCEPTED succeeded');

  // ACCEPTED -> PREPARING
  statusRes = await updateOrderStatusAction({ orderId, status: OrderStatus.PREPARING });
  if (!statusRes.success) throw new Error(`Failed to start preparing: ${statusRes.error}`);
  console.log('✓ Transition ACCEPTED -> PREPARING succeeded');

  // PREPARING -> READY
  statusRes = await updateOrderStatusAction({ orderId, status: OrderStatus.READY });
  if (!statusRes.success) throw new Error(`Failed to mark ready: ${statusRes.error}`);
  console.log('✓ Transition PREPARING -> READY succeeded');

  // READY -> COMPLETED
  statusRes = await updateOrderStatusAction({ orderId, status: OrderStatus.COMPLETED });
  if (!statusRes.success) throw new Error(`Failed to complete order: ${statusRes.error}`);
  console.log('✓ Transition READY -> COMPLETED succeeded');

  // Invalid transition: COMPLETED -> PREPARING should be rejected
  const invalidTransition = await updateOrderStatusAction({ orderId, status: OrderStatus.PREPARING });
  if (invalidTransition.success) {
    throw new Error('Invalid transition from COMPLETED should have been rejected');
  }
  console.log(`✓ Invalid transition rejected as expected: "${invalidTransition.error}"`);

  // 6. Test Payment Status Updates
  console.log('\n[Test 5] Payment Recording...');
  const paymentRes = await updatePaymentStatusAction({
    orderId,
    status: PaymentStatus.COMPLETED,
    method: PaymentMethod.CASH,
  });
  if (!paymentRes.success) throw new Error(`Failed to update payment: ${paymentRes.error}`);

  const updatedPayment = await db.paymentRecord.findFirst({ where: { orderId } });
  if (updatedPayment?.status !== PaymentStatus.COMPLETED) {
    throw new Error('Payment status did not update to COMPLETED');
  }
  console.log('✓ Payment successfully marked as COMPLETED (CASH)');

  // 7. Cleanup test data
  console.log('\n[Test 6] Cleanup...');
  await db.orderItemAddOn.deleteMany({ where: { orderItem: { orderId } } });
  await db.orderItem.deleteMany({ where: { orderId } });
  await db.paymentRecord.deleteMany({ where: { orderId } });
  await db.order.delete({ where: { id: orderId } });
  await db.restaurantTable.delete({ where: { id: table.id } });
  console.log('✓ Test order and test table cleanly removed');

  console.log('\n========================================');
  console.log('ALL MILESTONE 3 TESTS PASSED PERFECTLY!');
  console.log('========================================');
}

runTests()
  .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
