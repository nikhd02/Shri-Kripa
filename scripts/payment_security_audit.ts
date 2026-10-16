/**
 * C:\Users\dubey\.gemini\antigravity\brain\07f61f3a-49e4-45e3-ad36-3b7dc7661a45\scratch\payment_security_audit.ts
 *
 * Comprehensive Payment & Security Audit Test Suite for Shree Kripa Family Restaurant.
 * Tests:
 * 1. Payment status and settlement isolation
 * 2. QR token security and verification
 * 3. Duplicate-order protection and concurrent idempotency
 * 4. Server-side price calculation, tax accuracy, and tamper rejection
 * 5. Staff permissions and role-based access control
 *
 * Safe execution: Uses isolated test fixtures with AUDIT_TEST_ prefix and cleans them up.
 */

import { db } from '@/lib/db';
import { placeOrderAction, updateOrderStatusAction, updatePaymentStatusAction } from '@/server/actions/orders';
import { createTableAction, updateTableAction, regenerateTableQRAction, deleteTableAction, verifyTableToken } from '@/server/actions/tables';
import { createMenuItemAction, updateMenuItemAction, deleteMenuItemAction } from '@/server/actions/menu';
import { createCategoryAction } from '@/server/actions/categories';
import { Role, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

interface TestResult {
  category: string;
  testName: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
}

const results: TestResult[] = [];

function recordTest(category: string, testName: string, status: 'PASS' | 'FAIL', evidence: string) {
  results.push({ category, testName, status, evidence });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${category}] ${testName}: ${status}`);
  if (status === 'FAIL') {
    console.error(`   Evidence: ${evidence}`);
  }
}

async function runAudit() {
  console.log('================================================================');
  console.log('   SHREE KRIPA RESTAURANT — PAYMENT & SECURITY AUDIT TEST RUN   ');
  console.log('================================================================\n');

  // Track created test IDs for safe cleanup
  const createdOrderIds: string[] = [];
  const createdTableIds: string[] = [];
  const createdMenuItemIds: string[] = [];
  const createdCategoryIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // Setup Test Fixtures
    // -------------------------------------------------------------------------
    console.log('--- Setting up isolated test fixtures ---');

    // 1. Test Category
    const testCategory = await db.category.create({
      data: {
        name: 'AUDIT_TEST Category',
        slug: `audit-test-category-${Date.now()}`,
        active: true,
        displayOrder: 999,
      },
    });
    createdCategoryIds.push(testCategory.id);

    // 2. Active Menu Item with Variant and Add-On
    const testMenuItem = await db.menuItem.create({
      data: {
        categoryId: testCategory.id,
        name: 'AUDIT_TEST Item',
        slug: `audit-test-item-${Date.now()}`,
        basePrice: 150.00,
        isVeg: true,
        isAvailable: true,
        isPublished: true,
        displayOrder: 999,
        variants: {
          create: [
            { name: 'Half', priceModifier: -30.00, isAvailable: true },
            { name: 'Full', priceModifier: 50.00, isAvailable: true },
            { name: 'Sold Out Portion', priceModifier: 20.00, isAvailable: false },
          ],
        },
        addOns: {
          create: [
            { name: 'Extra Butter', price: 25.00, isAvailable: true },
            { name: 'Unavailable Addon', price: 10.00, isAvailable: false },
          ],
        },
      },
      include: { variants: true, addOns: true },
    });
    createdMenuItemIds.push(testMenuItem.id);

    // 3. Unpublished Menu Item
    const testUnpublishedItem = await db.menuItem.create({
      data: {
        categoryId: testCategory.id,
        name: 'AUDIT_TEST Unpublished Item',
        slug: `audit-test-unpub-${Date.now()}`,
        basePrice: 200.00,
        isAvailable: true,
        isPublished: false,
      },
    });
    createdMenuItemIds.push(testUnpublishedItem.id);

    // 4. Unavailable / Sold-out Menu Item
    const testUnavailableItem = await db.menuItem.create({
      data: {
        categoryId: testCategory.id,
        name: 'AUDIT_TEST Unavailable Item',
        slug: `audit-test-unavail-${Date.now()}`,
        basePrice: 180.00,
        isAvailable: false,
        isPublished: true,
      },
    });
    createdMenuItemIds.push(testUnavailableItem.id);

    // 5. Active Dining Table
    const testTable = await db.restaurantTable.create({
      data: {
        tableNumber: `AUDIT_T${Date.now() % 10000}`,
        capacity: 4,
        isActive: true,
        qrToken: `audit_token_active_${Date.now()}`,
      },
    });
    createdTableIds.push(testTable.id);

    // 6. Inactive Dining Table
    const testInactiveTable = await db.restaurantTable.create({
      data: {
        tableNumber: `AUDIT_INACT_${Date.now() % 10000}`,
        capacity: 2,
        isActive: false,
        qrToken: `audit_token_inactive_${Date.now()}`,
      },
    });
    createdTableIds.push(testInactiveTable.id);

    console.log('Fixtures established successfully.\n');

    // =========================================================================
    // SECTION 1: Payment Status and Settlement
    // =========================================================================
    console.log('--- AUDITING SECTION 1: Payment Status and Settlement ---');

    // 1.1: Placing order creates PaymentRecord with status PENDING
    const order1 = await placeOrderAction({
      tableToken: testTable.qrToken,
      customerName: 'Audit Customer',
      customerPhone: '9876543210',
      items: [{ menuItemId: testMenuItem.id, quantity: 2 }],
    });

    if (order1.success && order1.data) {
      createdOrderIds.push(order1.data.orderId);
      const dbOrder = await db.order.findUnique({
        where: { id: order1.data.orderId },
        include: { paymentRecords: true },
      });

      if (dbOrder?.status === OrderStatus.PENDING && dbOrder.paymentRecords[0]?.status === PaymentStatus.PENDING) {
        recordTest('Payment & Settlement', 'New order initial payment status is strictly PENDING', 'PASS',
          `Order #${dbOrder.orderNumber} created with OrderStatus=PENDING and PaymentRecord status=PENDING (amount=₹${dbOrder.total})`);
      } else {
        recordTest('Payment & Settlement', 'New order initial payment status is strictly PENDING', 'FAIL',
          `Unexpected status: Order=${dbOrder?.status}, Payment=${dbOrder?.paymentRecords[0]?.status}`);
      }
    } else {
      recordTest('Payment & Settlement', 'New order initial payment status is strictly PENDING', 'FAIL',
        `Failed to place order: ${order1.error}`);
    }

    // 1.2: Order status progression remains isolated from payment status
    if (order1.success && order1.data) {
      process.env.TEST_AUTH_USER = JSON.stringify({ id: 'usr_staff_1', name: 'Staff User', email: 'staff@test.com', role: Role.STAFF });

      // Advance order PENDING -> ACCEPTED -> PREPARING -> READY
      await updateOrderStatusAction({ orderId: order1.data.orderId, status: OrderStatus.ACCEPTED });
      await updateOrderStatusAction({ orderId: order1.data.orderId, status: OrderStatus.PREPARING });
      await updateOrderStatusAction({ orderId: order1.data.orderId, status: OrderStatus.READY });

      const readyOrder = await db.order.findUnique({
        where: { id: order1.data.orderId },
        include: { paymentRecords: true },
      });

      if (readyOrder?.status === OrderStatus.READY && readyOrder.paymentRecords[0]?.status === PaymentStatus.PENDING) {
        recordTest('Payment & Settlement', 'Order status progression does not falsely settle payment', 'PASS',
          `Order moved to READY while payment status strictly remained PENDING`);
      } else {
        recordTest('Payment & Settlement', 'Order status progression does not falsely settle payment', 'FAIL',
          `Payment status mutated unexpectedly: ${readyOrder?.paymentRecords[0]?.status}`);
      }

      // 1.3: Authorized staff cash settlement
      const settleRes = await updatePaymentStatusAction({
        orderId: order1.data.orderId,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.CASH,
      });

      const settledOrder = await db.order.findUnique({
        where: { id: order1.data.orderId },
        include: { paymentRecords: true },
      });

      if (settleRes.success && settledOrder?.paymentRecords[0]?.status === PaymentStatus.COMPLETED) {
        recordTest('Payment & Settlement', 'Authorized staff cash settlement succeeds', 'PASS',
          `Payment marked COMPLETED via CASH by authorized STAFF user`);
      } else {
        recordTest('Payment & Settlement', 'Authorized staff cash settlement succeeds', 'FAIL',
          `Failed settlement: ${settleRes.error}`);
      }
    }

    // 1.4: Kitchen role attempting payment update is REJECTED
    if (order1.success && order1.data) {
      process.env.TEST_AUTH_USER = JSON.stringify({ id: 'usr_kitchen_1', name: 'Chef User', email: 'chef@test.com', role: Role.KITCHEN });
      let kitchenRejected = false;
      try {
        await updatePaymentStatusAction({
          orderId: order1.data.orderId,
          status: PaymentStatus.COMPLETED,
          method: PaymentMethod.UPI_MANUAL,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('Unauthorized')) {
          kitchenRejected = true;
        }
      }

      if (kitchenRejected) {
        recordTest('Payment & Settlement', 'KITCHEN role cannot settle payments', 'PASS',
          'Server-side requireAuth threw Unauthorized when KITCHEN role attempted updatePaymentStatusAction');
      } else {
        recordTest('Payment & Settlement', 'KITCHEN role cannot settle payments', 'FAIL',
          'KITCHEN role was not rejected by updatePaymentStatusAction');
      }
    }

    // 1.5: Unauthenticated payment update is REJECTED
    if (order1.success && order1.data) {
      process.env.TEST_AUTH_USER = 'UNAUTHENTICATED';
      let unauthRejected = false;
      try {
        await updatePaymentStatusAction({
          orderId: order1.data.orderId,
          status: PaymentStatus.COMPLETED,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('Unauthorized')) {
          unauthRejected = true;
        }
      }

      if (unauthRejected) {
        recordTest('Payment & Settlement', 'Unauthenticated payment settlement is rejected', 'PASS',
          'Server-side requireAuth threw Unauthorized for unauthenticated call');
      } else {
        recordTest('Payment & Settlement', 'Unauthenticated payment settlement is rejected', 'FAIL',
          'Unauthenticated caller was not rejected');
      }
    }

    // =========================================================================
    // SECTION 2: QR Token Security
    // =========================================================================
    console.log('\n--- AUDITING SECTION 2: QR Token Security ---');

    // 2.1: Valid active table QR token
    const validQrOrder = await placeOrderAction({
      tableToken: testTable.qrToken,
      items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
    });
    if (validQrOrder.success && validQrOrder.data) {
      createdOrderIds.push(validQrOrder.data.orderId);
      const dbOrd = await db.order.findUnique({ where: { id: validQrOrder.data.orderId } });
      if (dbOrd?.tableId === testTable.id && dbOrd.source === 'DINE_IN') {
        recordTest('QR Token Security', 'Valid active table QR token links order to table', 'PASS',
          `Order #${dbOrd.orderNumber} successfully associated with Table ${testTable.tableNumber}`);
      } else {
        recordTest('QR Token Security', 'Valid active table QR token links order to table', 'FAIL',
          `Table association failed: tableId=${dbOrd?.tableId}`);
      }
    }

    // 2.2: Invalid table QR token
    const invalidQrOrder = await placeOrderAction({
      tableToken: 'non_existent_fake_qr_token_12345',
      items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
    });
    if (!invalidQrOrder.success && invalidQrOrder.error?.includes('invalid or this table is currently inactive')) {
      recordTest('QR Token Security', 'Invalid QR token is strictly rejected', 'PASS',
        `Server rejected order with message: "${invalidQrOrder.error}"`);
    } else {
      recordTest('QR Token Security', 'Invalid QR token is strictly rejected', 'FAIL',
        `Invalid QR token was unexpectedly accepted or gave wrong error: ${JSON.stringify(invalidQrOrder)}`);
    }

    // 2.3: Inactive table QR token
    const inactiveQrOrder = await placeOrderAction({
      tableToken: testInactiveTable.qrToken,
      items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
    });
    if (!inactiveQrOrder.success && inactiveQrOrder.error?.includes('invalid or this table is currently inactive')) {
      recordTest('QR Token Security', 'Inactive table QR token is strictly rejected', 'PASS',
        `Server refused order against inactive table "${testInactiveTable.tableNumber}"`);
    } else {
      recordTest('QR Token Security', 'Inactive table QR token is strictly rejected', 'FAIL',
        `Inactive table token was accepted: ${JSON.stringify(inactiveQrOrder)}`);
    }

    // 2.4: Regenerated QR token (old token expired)
    process.env.TEST_AUTH_USER = JSON.stringify({ id: 'usr_admin_1', name: 'Admin', email: 'admin@test.com', role: Role.ADMIN });
    const oldToken = testTable.qrToken;
    const regenResult = await regenerateTableQRAction(testTable.id);
    if (regenResult.success && regenResult.data) {
      const newToken = regenResult.data.qrToken;

      // Try placing order with OLD token
      const oldTokenOrder = await placeOrderAction({
        tableToken: oldToken,
        items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
      });

      // Try placing order with NEW token
      const newTokenOrder = await placeOrderAction({
        tableToken: newToken,
        items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
      });
      if (newTokenOrder.data) createdOrderIds.push(newTokenOrder.data.orderId);

      if (!oldTokenOrder.success && newTokenOrder.success) {
        recordTest('QR Token Security', 'Regenerated QR token invalidates previous token', 'PASS',
          'Previous QR token was rejected; newly generated token succeeded');
      } else {
        recordTest('QR Token Security', 'Regenerated QR token invalidates previous token', 'FAIL',
          `Old token success=${oldTokenOrder.success}, New token success=${newTokenOrder.success}`);
      }
    }

    // 2.5: Client-supplied tableId cannot bypass QR token verification
    const bypassAttempt = await placeOrderAction({
      tableId: testTable.id, // client trying to pass raw tableId
      items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
    });
    if (bypassAttempt.success && bypassAttempt.data) {
      createdOrderIds.push(bypassAttempt.data.orderId);
      const dbBypassOrder = await db.order.findUnique({ where: { id: bypassAttempt.data.orderId } });
      if (dbBypassOrder?.tableId === null && dbBypassOrder.source === 'WEBSITE') {
        recordTest('QR Token Security', 'Raw tableId parameter cannot bypass QR token validation', 'PASS',
          'Client-supplied tableId was stripped by schema; order defaulted to WEBSITE with tableId=null');
      } else {
        recordTest('QR Token Security', 'Raw tableId parameter cannot bypass QR token validation', 'FAIL',
          `TableId bypass succeeded: order.tableId=${dbBypassOrder?.tableId}`);
      }
    }

    // =========================================================================
    // SECTION 3: Duplicate-Order Protection & Idempotency
    // =========================================================================
    console.log('\n--- AUDITING SECTION 3: Duplicate-Order Protection ---');

    const testIdempotencyKey = `idem_audit_${Date.now()}_test`;

    // 3.1: Sequential duplicate submission
    const idemOrder1 = await placeOrderAction({
      idempotencyKey: testIdempotencyKey,
      items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
    });
    if (idemOrder1.data) createdOrderIds.push(idemOrder1.data.orderId);

    const idemOrder2 = await placeOrderAction({
      idempotencyKey: testIdempotencyKey,
      items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
    });

    if (idemOrder1.success && idemOrder2.success && idemOrder1.data?.orderId === idemOrder2.data?.orderId) {
      recordTest('Duplicate Protection', 'Sequential duplicate idempotency key returns existing order', 'PASS',
        `Both calls returned same Order #${idemOrder1.data?.orderNumber} (ID: ${idemOrder1.data?.orderId})`);
    } else {
      recordTest('Duplicate Protection', 'Sequential duplicate idempotency key returns existing order', 'FAIL',
        `Different orders returned: ${idemOrder1.data?.orderId} vs ${idemOrder2.data?.orderId}`);
    }

    // 3.2: Concurrent submission test (race condition)
    const concurrentKey = `idem_concurrent_${Date.now()}`;
    const [concResultA, concResultB] = await Promise.all([
      placeOrderAction({
        idempotencyKey: concurrentKey,
        customerName: 'Concurrent Tester A',
        items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
      }),
      placeOrderAction({
        idempotencyKey: concurrentKey,
        customerName: 'Concurrent Tester B',
        items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
      }),
    ]);

    if (concResultA.data) createdOrderIds.push(concResultA.data.orderId);

    if (concResultA.success && concResultB.success && concResultA.data?.orderId === concResultB.data?.orderId) {
      recordTest('Duplicate Protection', 'Concurrent requests with same key produce exactly one order', 'PASS',
        `Concurrent requests resolved to identical order ID: ${concResultA.data?.orderId}`);
    } else {
      recordTest('Duplicate Protection', 'Concurrent requests with same key produce exactly one order', 'FAIL',
        `Duplicate created: OrderA=${concResultA.data?.orderId}, OrderB=${concResultB.data?.orderId}`);
    }

    // =========================================================================
    // SECTION 4: Server-Side Pricing Integrity
    // =========================================================================
    console.log('\n--- AUDITING SECTION 4: Server-Side Pricing Integrity ---');

    // 4.1: Client tampering with prices and totals
    const tamperOrder = await placeOrderAction({
      basePrice: 0.01,
      unitPrice: 0.01,
      subtotal: 0.01,
      taxAmount: 0.00,
      total: 0.01,
      items: [{
        menuItemId: testMenuItem.id,
        quantity: 2,
        basePrice: 1.00, // tampered
        unitPrice: 1.00, // tampered
        lineTotal: 2.00, // tampered
      }],
    });

    if (tamperOrder.success && tamperOrder.data) {
      createdOrderIds.push(tamperOrder.data.orderId);
      const dbTamper = await db.order.findUnique({ where: { id: tamperOrder.data.orderId } });

      // DB base price is 150.00. 2x150 = 300.00 subtotal.
      // Settings tax is 5% or 0%. With 5%: 300 + 15 = 315.
      if (Number(dbTamper?.subtotal) === 300) {
        recordTest('Server-Side Pricing', 'Client price tampering is completely ignored', 'PASS',
          `Server computed subtotal ₹${dbTamper?.subtotal} from DB (150 * 2), ignoring client ₹1.00 tamper attempt`);
      } else {
        recordTest('Server-Side Pricing', 'Client price tampering is completely ignored', 'FAIL',
          `Subtotal was not 300: ${dbTamper?.subtotal}`);
      }
    }

    // 4.2: Unpublished items cannot be ordered
    const unpubOrder = await placeOrderAction({
      items: [{ menuItemId: testUnpublishedItem.id, quantity: 1 }],
    });
    if (!unpubOrder.success && unpubOrder.error?.includes('currently unavailable')) {
      recordTest('Server-Side Pricing', 'Unpublished menu items cannot be ordered', 'PASS',
        `Server rejected order of unpublished item: "${unpubOrder.error}"`);
    } else {
      recordTest('Server-Side Pricing', 'Unpublished menu items cannot be ordered', 'FAIL',
        `Unpublished item order succeeded or gave wrong error: ${JSON.stringify(unpubOrder)}`);
    }

    // 4.3: Inactive / sold-out items cannot be ordered
    const unavailOrder = await placeOrderAction({
      items: [{ menuItemId: testUnavailableItem.id, quantity: 1 }],
    });
    if (!unavailOrder.success && unavailOrder.error?.includes('currently unavailable')) {
      recordTest('Server-Side Pricing', 'Unavailable / sold-out menu items cannot be ordered', 'PASS',
        `Server rejected order of unavailable item: "${unavailOrder.error}"`);
    } else {
      recordTest('Server-Side Pricing', 'Unavailable / sold-out menu items cannot be ordered', 'FAIL',
        `Unavailable item was accepted: ${JSON.stringify(unavailOrder)}`);
    }

    // 4.4: Sold out variant portion rejected
    const soldOutVariant = testMenuItem.variants.find((v) => !v.isAvailable)!;
    const soldOutVarOrder = await placeOrderAction({
      items: [{
        menuItemId: testMenuItem.id,
        variantId: soldOutVariant.id,
        quantity: 1,
      }],
    });
    if (!soldOutVarOrder.success && soldOutVarOrder.error?.includes('portion size')) {
      recordTest('Server-Side Pricing', 'Unavailable variant portion size cannot be ordered', 'PASS',
        `Server rejected sold-out variant portion: "${soldOutVarOrder.error}"`);
    } else {
      recordTest('Server-Side Pricing', 'Unavailable variant portion size cannot be ordered', 'FAIL',
        `Sold-out variant accepted: ${JSON.stringify(soldOutVarOrder)}`);
    }

    // 4.5: Sold out add-on rejected
    const soldOutAddOn = testMenuItem.addOns.find((a) => !a.isAvailable)!;
    const soldOutAddOnOrder = await placeOrderAction({
      items: [{
        menuItemId: testMenuItem.id,
        addOnIds: [soldOutAddOn.id],
        quantity: 1,
      }],
    });
    if (!soldOutAddOnOrder.success && soldOutAddOnOrder.error?.includes('add-on')) {
      recordTest('Server-Side Pricing', 'Unavailable add-on cannot be ordered', 'PASS',
        `Server rejected sold-out add-on: "${soldOutAddOnOrder.error}"`);
    } else {
      recordTest('Server-Side Pricing', 'Unavailable add-on cannot be ordered', 'FAIL',
        `Sold-out add-on accepted: ${JSON.stringify(soldOutAddOnOrder)}`);
    }

    // 4.6: Invalid quantities (0, negative, >50) rejected by Zod schema
    const invalidQtyOrder = await placeOrderAction({
      items: [{ menuItemId: testMenuItem.id, quantity: -5 }],
    });
    if (!invalidQtyOrder.success && invalidQtyOrder.fieldErrors?.['items.0.quantity']) {
      recordTest('Server-Side Pricing', 'Negative quantities are rejected by schema', 'PASS',
        `Validation caught invalid quantity: ${JSON.stringify(invalidQtyOrder.fieldErrors['items.0.quantity'])}`);
    } else {
      recordTest('Server-Side Pricing', 'Negative quantities are rejected by schema', 'FAIL',
        `Negative quantity was not rejected: ${JSON.stringify(invalidQtyOrder)}`);
    }

    // =========================================================================
    // SECTION 5: Staff Permissions & Role Authorization
    // =========================================================================
    console.log('\n--- AUDITING SECTION 5: Staff Permissions & Role Authorization ---');

    // 5.1: STAFF role cannot create or delete menu items
    process.env.TEST_AUTH_USER = JSON.stringify({ id: 'usr_staff_2', name: 'Staff Member', email: 'staff2@test.com', role: Role.STAFF });
    let staffCreateItemBlocked = false;
    try {
      await createMenuItemAction({
        name: 'Unauthorized Item',
        categoryId: testCategory.id,
        slug: 'unauthorized-item',
        basePrice: 100,
        isVeg: true,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        staffCreateItemBlocked = true;
      }
    }
    if (staffCreateItemBlocked) {
      recordTest('Staff Permissions', 'STAFF role cannot create menu items', 'PASS',
        'requireAuth threw Unauthorized when STAFF role attempted createMenuItemAction');
    } else {
      recordTest('Staff Permissions', 'STAFF role cannot create menu items', 'FAIL',
        'STAFF role was not blocked from creating menu items');
    }

    // 5.2: STAFF role cannot delete dining tables
    let staffDeleteTableBlocked = false;
    try {
      await deleteTableAction(testTable.id);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        staffDeleteTableBlocked = true;
      }
    }
    if (staffDeleteTableBlocked) {
      recordTest('Staff Permissions', 'STAFF role cannot delete dining tables', 'PASS',
        'requireAuth threw Unauthorized when STAFF role attempted deleteTableAction');
    } else {
      recordTest('Staff Permissions', 'STAFF role cannot delete dining tables', 'FAIL',
        'STAFF role was not blocked from deleting tables');
    }

    // 5.3: KITCHEN role cannot create categories
    process.env.TEST_AUTH_USER = JSON.stringify({ id: 'usr_kitchen_2', name: 'Chef Line', email: 'line@test.com', role: Role.KITCHEN });
    let kitchenCategoryBlocked = false;
    try {
      await createCategoryAction({
        name: 'Unauthorized Category',
        slug: 'unauth-cat',
        displayOrder: 1,
        active: true,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        kitchenCategoryBlocked = true;
      }
    }
    if (kitchenCategoryBlocked) {
      recordTest('Staff Permissions', 'KITCHEN role cannot create menu categories', 'PASS',
        'requireAuth threw Unauthorized when KITCHEN role attempted createCategoryAction');
    } else {
      recordTest('Staff Permissions', 'KITCHEN role cannot create menu categories', 'FAIL',
        'KITCHEN role was not blocked from creating categories');
    }

    // 5.4: ADMIN role has full authorization
    process.env.TEST_AUTH_USER = JSON.stringify({ id: 'usr_admin_root', name: 'Root Admin', email: 'root@test.com', role: Role.ADMIN });
    const adminCategoryRes = await createCategoryAction({
      name: 'AUDIT_TEST Admin Perm Category',
      slug: `audit-admin-cat-${Date.now()}`,
      displayOrder: 100,
      active: true,
    });
    if (adminCategoryRes.success && adminCategoryRes.data) {
      createdCategoryIds.push((adminCategoryRes.data as { id: string }).id);
      recordTest('Staff Permissions', 'ADMIN role has authorized access', 'PASS',
        'Admin action executed successfully without error');
    } else {
      recordTest('Staff Permissions', 'ADMIN role has authorized access', 'FAIL',
        `Admin action failed: ${adminCategoryRes.error}`);
    }

  } catch (err) {
    console.error('Audit execution error:', err);
  } finally {
    // -------------------------------------------------------------------------
    // Safe Cleanup of All Test Records
    // -------------------------------------------------------------------------
    console.log('\n--- Cleaning up isolated test fixtures ---');
    try {
      // Delete orders and associated records
      if (createdOrderIds.length > 0) {
        await db.paymentRecord.deleteMany({ where: { orderId: { in: createdOrderIds } } });
        await db.orderItemAddOn.deleteMany({ where: { orderItem: { orderId: { in: createdOrderIds } } } });
        await db.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } });
        await db.order.deleteMany({ where: { id: { in: createdOrderIds } } });
      }

      // Delete menu items
      if (createdMenuItemIds.length > 0) {
        await db.menuVariant.deleteMany({ where: { menuItemId: { in: createdMenuItemIds } } });
        await db.menuAddOn.deleteMany({ where: { menuItemId: { in: createdMenuItemIds } } });
        await db.menuItem.deleteMany({ where: { id: { in: createdMenuItemIds } } });
      }

      // Delete categories
      if (createdCategoryIds.length > 0) {
        await db.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
      }

      // Delete tables
      if (createdTableIds.length > 0) {
        await db.restaurantTable.deleteMany({ where: { id: { in: createdTableIds } } });
      }

      console.log('Test fixtures cleaned up safely. No real data affected.\n');
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('================================================================');
  console.log('                     AUDIT SUMMARY RESULTS                      ');
  console.log('================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Checks Executed : ${results.length}`);
  console.log(`Passed Checks         : ${passCount}`);
  console.log(`Failed Checks         : ${failCount}`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAudit();
